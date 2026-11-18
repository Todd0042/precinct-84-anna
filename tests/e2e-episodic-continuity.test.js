import assert from 'node:assert/strict';

import { createInitialState } from '../bundle/game/state.js';
import { snapSceneId, snapCharacterId, snapBgmId, validateChapterBlueprint } from '../bundle/engine/blueprint-schema.js';
import { buildStoryBiblePrompt } from '../bundle/engine/story-bible.js';
import { selectRandomStoryAssets } from '../bundle/engine/asset-selector.js';
import { StoryLibraryStore } from '../bundle/storage-library.js';
import { PrecinctSaveStore } from '../bundle/storage.js';
import { createXtermTuiSession } from '../bundle/ui/xterm-session.js';
import { createTtsNarrator, resolveSpeechProfile } from '../bundle/audio/tts-speaker.js';
import { createAutoPlayer } from '../bundle/engine/auto-player.js';
import { chooseAutoPlayOption } from '../bundle/engine/story-director.js';
import { getBgmIds, MAIN_MENU_BGM_ID } from '../bundle/assets/audio-catalog.js';
import { syncSceneMusic } from '../bundle/ui/session-ai.js';

function createMockTerm() {
  return { cols: 104, rows: 13, write: () => {}, onData: () => ({ dispose: () => {} }), onResize: () => ({ dispose: () => {} }) };
}

function createMemoryRuntime() {
  const kv = new Map();
  let calls = [];
  return {
    calls,
    storage: {
      async get({ key }) { return { value: kv.has(key) ? JSON.parse(kv.get(key)) : null }; },
      async set({ key, value }) { kv.set(key, JSON.stringify(value)); },
      async delete({ key }) { kv.delete(key); },
    },
    llm: {
      async list_models() { return [{ id: 'preset:fast', label: 'Fast' }]; },
      async *stream(req) {
        calls.push(req);
        const sys = req.systemPrompt || '';
        const usr = req.messages?.[0]?.content || '';
        if (sys.includes('Auto-Play Decision')) {
          yield { event: 'model_token', text: '{"command":"arrest_rival"}' };
        } else if (sys.includes('ONE "between calls"')) {
          yield {
            event: 'model_token',
            text: JSON.stringify({
              title: 'Act I Intermission: Coffee & Doubt',
              sceneId: 'diner_midnight',
              speakerId: 'claire',
              lines: ['Claire Bellamy (#089) sets two coffees down.'],
              choices: [{ label: 'Keep Code', command: 'keep code', reply: 'Marcus nods.' }],
            }),
          };
        } else if (sys.includes('3-chapter Case Outline')) {
          yield {
            event: 'model_token',
            text: JSON.stringify({
              caseTitle: 'Full Case Blueprint',
              culpritId: 'rival_det',
              motive: 'Skimming Blue Velvet crates.',
              twist: 'Fake dispatch logs.',
              chapterArcs: ['Arc 1', 'Arc 2', 'Arc 3'],
            }),
          };
        } else {
          const isCh2 = usr.includes('Chapter 2');
          const isCh3 = usr.includes('Chapter 3');
          yield {
            event: 'model_token',
            text: JSON.stringify({
              caseTitle: 'Harbor Ghost',
              culpritId: 'rival_det',
              motive: 'Rival detective skimming narcotics.',
              twist: 'Claire holds duplicate logs.',
              title: isCh3 ? 'Ch.3: Dawn Finale' : isCh2 ? 'Ch.2: Interrogation Followup' : 'Ch.1: Dockside Ambush',
              beats: [
                {
                  id: 'beat_1',
                  sceneId: 'pier_office_crime_scene',
                  speakerId: 'rival_det',
                  actors: [{ id: 'marcus' }, { id: 'rival_det' }],
                  narrative: ['Rain falls while rival_det eyes the ledger.'],
                  objectives: ['Handle rival_det'],
                  actions: [{
                    label: 'Bag the ledger immediately',
                    command: 'arrest_rival',
                    endChapter: true,
                    isVictory: isCh3,
                    scoreDelta: 15,
                    alignmentDelta: { byTheBook: 2 },
                    log: 'Marcus cuffs rival_det at dawn.',
                  }],
                },
              ],
            }),
          };
        }
        yield { event: 'complete' };
      },
    },
  };
}

async function main() {
  console.log('1. Checking snap*Id empty fallback, truncated beat_6 drop, word-clean labels & ID sanitization...');
  assert.equal(snapCharacterId('', 'lt_malone'), 'lt_malone');
  assert.equal(snapSceneId('', 'diner_midnight'), 'diner_midnight');
  assert.equal(snapBgmId('', 'bgm_harbor_stealth'), 'bgm_harbor_stealth');

  const pool = selectRandomStoryAssets();
  const validated = validateChapterBlueprint({
    title: 'Chapter 1: Midnight Watch at Pier 84 Forevermore',
    beats: [
      { id: 'b1', narrative: ['Marcus spots rival_det near the dock.'], objectives: ['Check desk'], actions: [{ label: 'Bag the ledger as evidence now', command: 'bag_it', log: 'Cuffed rival_det.' }] },
      { id: 'b2', narrative: ['Second beat completes cleanly.'], objectives: ['Finish'], actions: [{ label: 'Wrap Case', command: 'wrap' }] },
      { id: 'beat_6', sceneId: 'precinct_yard_dawn', narrative: [], actions: [] },
    ],
  }, 1, false, pool);
  assert.equal(validated.beats.beat_6, undefined, 'Truncated trailing stub beat_6 must be dropped');
  assert.equal(validated.beats.b2.actions[0].endChapter, true, 'Last complete beat must cleanly endChapter');
  assert.ok(!validated.beats.b1.actions[0].label.endsWith('ev'), 'Word-boundary label must not chop mid-word');
  assert.ok(validated.beats.b1.narrative[0].includes('Det. Vance Thorne') && !validated.beats.b1.narrative[0].includes('rival_det'));
  console.log('   PASS: snap*Id fallbacks, beat_6 guard, word-boundary labels & ID sanitization verified.');

  console.log('2. Testing Episodic (1-call) vs Full Case (3-ch upfront) & Story Bible +1 Ch Import Continuation...');
  const rt = createMemoryRuntime();
  const saveStore = new PrecinctSaveStore(rt);
  const storyLib = new StoryLibraryStore(rt);
  await saveStore.loadTiers();
  await storyLib.load();

  // 2A. Episodic mode compiles Chapter 1 in 1 LLM call
  const sessEp = createXtermTuiSession({
    term: createMockTerm(),
    anna: rt,
    saveStore,
    storyLib,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 3, storyGenMode: 'episodic', aiModel: 'preset:fast', llmAvailable: true }),
    audioEnabled: false,
    tickIntervalMs: 0,
  });
  await sessEp.startShift({ resumeSaved: false });
  assert.equal(rt.calls.length, 1, 'Episodic Ch.1 must use 1 single LLM call');
  assert.equal(sessEp.getState().aiCampaign.storyGenMode, 'episodic');
  sessEp.runCmd('arrest_rival');
  assert.equal(sessEp.getState().aiCampaign.awaitingNextChapter, true);

  // Deduplicated export + Story Bible captures player outcome before continuing +1 Ch from imported JSON
  const savedItem = storyLib.list()[0];
  const exp = storyLib.exportSingleJson(savedItem);
  assert.equal(exp.payload.snapshot.aiCampaign, undefined, 'Exported snapshot must not duplicate aiCampaign');
  const bible = buildStoryBiblePrompt(exp.payload.aiCampaign, sessEp.getState().alignment, sessEp.getState().awarded);
  assert.match(bible, /arrest_rival/);
  assert.match(bible, /Det\. Vance Thorne/);

  const freshLib = new StoryLibraryStore(rt);
  const [reimported] = await freshLib.importFromJsonText(exp.jsonText);
  sessEp.loadSavedStoryEntry(reimported, true);
  await sessEp.continueStory();
  assert.equal(sessEp.getState().aiCampaign.chapters.length, 2, '+1 Ch must extend imported story cleanly');
  assert.ok(rt.calls.at(-1).systemPrompt.includes('arrest_rival'), 'Continuation prompt must carry Ch.1 outcome');
  sessEp.dispose();

  // 2B. Full mode compiles all 3 chapters upfront & auto-advances without extra LLM calls
  const callsBeforeFull = rt.calls.length;
  const sessFull = createXtermTuiSession({
    term: createMockTerm(),
    anna: rt,
    saveStore,
    storyLib,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 3, storyGenMode: 'full', aiModel: 'preset:fast', llmAvailable: true }),
    audioEnabled: false,
    tickIntervalMs: 0,
  });
  await sessFull.startShift({ resumeSaved: false });
  assert.equal(sessFull.getState().aiCampaign.chapters.length, 3, 'Full mode must compile all 3 chapters upfront');
  const callsAfterCompile = rt.calls.length;
  assert.equal(callsAfterCompile - callsBeforeFull, 4, 'Full mode = Outline + 3 Chapters');
  sessFull.runCmd('arrest_rival');
  assert.equal(sessFull.getState().aiCampaign.chapterIdx, 1, 'Finishing Ch.1 advances straight to pre-compiled Ch.2');
  sessFull.runCmd('arrest_rival');
  assert.equal(sessFull.getState().aiCampaign.chapterIdx, 2, 'Finishing Ch.2 advances straight to pre-compiled Ch.3');
  sessFull.runCmd('arrest_rival');
  assert.equal(sessFull.getState().victory, true, 'Finishing Ch.3 completes Full Case');
  assert.equal(rt.calls.length, callsAfterCompile, 'Playing full 3-ch case uses 0 extra LLM calls');
  sessFull.dispose();
  console.log('   PASS: Episodic 1-call mode, Full 3-ch mode, Story Bible & deduplicated +1 Ch JSON import verified.');

  console.log('3. Testing Free Gendered TTS (no cutoffs) & Sequential + AI Auto-Play modes...');
  const voices = [
    { name: 'Daniel (Male)', lang: 'en-US' },
    { name: 'Samantha (Female)', lang: 'en-US' },
  ];
  assert.equal(resolveSpeechProfile('claire', voices).voice.name, 'Samantha (Female)');
  assert.equal(resolveSpeechProfile('marcus', voices).voice.name, 'Daniel (Male)');
  assert.notEqual(resolveSpeechProfile('dooley', voices).pitch, resolveSpeechProfile('marcus', voices).pitch);

  const spoken = [];
  let cancelCount = 0;
  let activeOverlap = false;
  let inFlight = false;
  class MockUtt { constructor(text) { this.text = text; this.voice = null; this.pitch = 1; this.rate = 1; } }
  const mockSpeech = {
    getVoices: () => voices,
    cancel: () => { cancelCount += 1; inFlight = false; },
    speak: (u) => {
      if (inFlight) activeOverlap = true;
      inFlight = true;
      spoken.push({ text: u.text, voice: u.voice?.name });
      setTimeout(() => { inFlight = false; u.onend?.(); }, 8);
    },
  };

  const tts = createTtsNarrator({ enabled: true, speechApi: mockSpeech, UtteranceCtor: MockUtt });
  const sessAuto = createXtermTuiSession({
    term: createMockTerm(),
    anna: rt,
    saveStore,
    storyLib,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 3, storyGenMode: 'full', aiModel: 'preset:fast', llmAvailable: true }),
    audioEnabled: false,
    tickIntervalMs: 0,
    onStateChange: (s) => tts.ingestState(s),
  });
  await sessAuto.startShift({ resumeSaved: false });
  const llmCallsAfterCompile = rt.calls.length;

  const auto = createAutoPlayer({
    getState: () => sessAuto.getState(),
    runCmd: (c) => sessAuto.runCmd(c),
    continueStory: () => sessAuto.continueStory(),
    chooseWithLlm: (s, opts) => chooseAutoPlayOption({ anna: rt, state: s, options: opts }),
    tts,
    stepDelayMs: 5,
  });
  auto.start('sequential');
  for (let i = 0; i < 60 && auto.isRunning(); i++) await new Promise((r) => setTimeout(r, 15));
  assert.equal(rt.calls.length, llmCallsAfterCompile, 'Sequential Auto-Play must spend 0 LLM calls');
  assert.equal(sessAuto.getState().victory, true, 'Sequential Auto-Play should reach victory across 3 chapters');
  assert.equal(activeOverlap, false, 'TTS utterances must never cut off or overlap');
  assert.equal(cancelCount, 0, 'Normal playback must not call cancel() mid-speech');
  assert.ok(spoken.some((x) => x.text.includes('Selecting: Bag the ledger')), 'Auto-Play must announce option selection via TTS');
  assert.ok(spoken.some((x) => x.text.includes('Det. Vance Thorne')), 'TTS must speak sanitized character dialogue');

  // Test pause-after-current-sentence + resume without cutting off active utterance
  const beforePauseCount = spoken.length;
  tts.enqueue('Sentence one finishes completely.', 'marcus');
  tts.enqueue('Sentence two waits until resumed.', 'claire');
  auto.start('sequential');
  auto.pause();
  assert.equal(auto.isPaused(), true);
  assert.equal(cancelCount, 0, 'Pause must NOT call speech cancel() or cut off active sentence');
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(spoken.length, beforePauseCount + 1, 'First sentence finishes, second sentence waits while paused');
  auto.resume();
  assert.equal(auto.isPaused(), false);
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(spoken.length >= beforePauseCount + 2, 'Resume plays remaining queued sentences seamlessly');
  auto.stop();

  // Test AI Auto-Play mode + clean stop() cancellation
  sessAuto.replaySameStory();
  const prevCalls = rt.calls.length;
  auto.start('llm');
  for (let i = 0; i < 60 && auto.isRunning(); i++) await new Promise((r) => setTimeout(r, 15));
  assert.ok(rt.calls.length > prevCalls, 'LLM Auto-Play must invoke LLM choice selector');
  auto.stop();
  sessAuto.dispose();
  console.log('   PASS: Gendered TTS, zero-overlap queue, Sequential (0 LLM) & AI Auto-Play verified.');

  console.log('4. Testing Cross-Tier Parity (Tier 2 1-by-1 Intermissions & Tier 1 Auto-Play)...');
  const callsBeforeT2Ep = rt.calls.length;
  const sessT2Ep = createXtermTuiSession({
    term: createMockTerm(),
    anna: rt,
    saveStore,
    storyLib,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 2, storyGenMode: 'episodic', storyTheme: 'dirty harbor vice\npayoff ring', aiModel: 'preset:fast', llmAvailable: true }),
    audioEnabled: false,
    tickIntervalMs: 0,
  });
  await sessT2Ep.startShift({ resumeSaved: false });
  assert.equal(rt.calls.length, callsBeforeT2Ep, 'Tier 2 1-by-1 must start with 0 upfront LLM calls');
  for (const cmd of ['listen briefing', 'look blackboard', 'go locker', 'open locker', 'take belt', 'take keys', 'go yard', 'inspect tires', 'inspect trunk', 'enter car', 'fasten seatbelt', 'radio 10-8']) {
    sessT2Ep.runCmd(cmd);
  }
  await sessT2Ep.waitForAi();
  assert.equal(rt.calls.length, callsBeforeT2Ep + 1, 'Tier 2 1-by-1 compiles act intermission on transition');
  assert.ok(rt.calls.at(-1).systemPrompt.includes('dirty harbor vice payoff ring'), 'Tier 2 prompt injects sanitized theme');
  assert.ok(sessT2Ep.getState().intermission?.title.includes('Act I Intermission'), 'Compiled single Tier 2 intermission must activate');
  sessT2Ep.dispose();

  const callsBeforeT1 = rt.calls.length;
  const sessT1 = createXtermTuiSession({
    term: createMockTerm(),
    anna: rt,
    saveStore,
    storyLib,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 1, storyTheme: 'midnight stakeout', llmAvailable: true }),
    audioEnabled: false,
    tickIntervalMs: 0,
    onStateChange: (s) => tts.ingestState(s),
  });
  await sessT1.startShift({ resumeSaved: false });
  await sessT1.askClaire('What next?');
  assert.ok(rt.calls.at(-1).systemPrompt.includes('midnight stakeout'), 'Tier 1 Ask Claire weaves theme directive');
  rt.calls.length = callsBeforeT1;
  const autoT1 = createAutoPlayer({
    getState: () => sessT1.getState(),
    runCmd: (c) => sessT1.runCmd(c),
    waitForAi: () => sessT1.waitForAi(),
    tts,
    stepDelayMs: 5,
  });
  autoT1.start('sequential');
  for (let i = 0; i < 40 && sessT1.getState().scene === 'precinct_briefing'; i++) await new Promise((r) => setTimeout(r, 15));
  autoT1.stop();
  assert.equal(sessT1.getState().scene, 'precinct_locker', 'Tier 1 Sequential Auto-Play advances Case I cleanly');
  assert.equal(rt.calls.length, callsBeforeT1, 'Tier 1 Auto: Seq uses 0 LLM calls');
  await sessT1.returnToModeSelect();
  assert.equal(sessT1.getState().phase, 'mode_select', 'Main Menu button returns to mode_select');
  assert.equal(saveStore.getTierActive(1)?.scene, 'precinct_locker', 'Main Menu auto-saves Tier 1 progress');
  sessT1.dispose();

  // Dedicated main-menu cop theme is isolated from LLM BGM pools and plays only in mode_select
  assert.equal(getBgmIds().includes(MAIN_MENU_BGM_ID), false, 'Main menu theme must never appear in getBgmIds()');
  assert.notEqual(snapBgmId(MAIN_MENU_BGM_ID), MAIN_MENU_BGM_ID, 'snapBgmId must never route in-game music to menu theme');
  for (let i = 0; i < 8; i++) assert.equal(selectRandomStoryAssets().bgm.includes(MAIN_MENU_BGM_ID), false);
  const bgmPlayed = [];
  const fakeAudio = { playBgm: (id) => bgmPlayed.push(id) };
  syncSceneMusic(createInitialState({ phase: 'mode_select' }), fakeAudio);
  assert.equal(bgmPlayed.at(-1), MAIN_MENU_BGM_ID, 'mode_select plays dedicated cop theme');
  syncSceneMusic(createInitialState({ phase: 'playing', scene: 'precinct_briefing' }), fakeAudio);
  assert.notEqual(bgmPlayed.at(-1), MAIN_MENU_BGM_ID, 'playing mode switches off menu theme');
  console.log('   PASS: Cross-Tier Parity (Tier 2 1-by-1, Tier 1 Auto-Play & Main Menu Cop BGM isolation) verified.');
}

main().catch((err) => { console.error(err); process.exit(1); });
