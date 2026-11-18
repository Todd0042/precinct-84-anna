import assert from 'node:assert/strict';
import fs from 'node:fs';

import { createInitialState } from '../bundle/game/state.js';
import { loadModelCatalog, extractJsonObject, DEMO_VERBOSE_ERRORS } from '../bundle/engine/anna-ai.js';
import { selectRandomStoryAssets } from '../bundle/engine/asset-selector.js';
import { getSceneIds } from '../bundle/assets/scene-catalog.js';
import { getCharacterList } from '../bundle/assets/character-catalog.js';
import { getBgmIds, CORE_SFX_LIST } from '../bundle/assets/audio-catalog.js';
import { PrecinctSaveStore } from '../bundle/storage.js';
import { StoryLibraryStore } from '../bundle/storage-library.js';
import { createXtermTuiSession } from '../bundle/ui/xterm-session.js';

function createMockTerm(cols = 128, rows = 46) {
  const data = new Set();
  const writes = [];
  return {
    get cols() { return cols; },
    get rows() { return rows; },
    write: (s) => writes.push(String(s)),
    onData: (cb) => { data.add(cb); return { dispose: () => data.delete(cb) }; },
    onResize: () => ({ dispose: () => {} }),
    emit: (seq) => { for (const cb of data) cb(seq); },
    lastScreen: () => writes.at(-1) || '',
  };
}

function createMockKv() {
  const map = new Map();
  return {
    map,
    storage: {
      async get({ key }) { return map.has(key) ? { value: JSON.parse(JSON.stringify(map.get(key))) } : { value: null }; },
      async set({ key, value }) { map.set(key, JSON.parse(JSON.stringify(value))); },
      async delete({ key }) { map.delete(key); },
    },
  };
}

function createMockAnna(kv) {
  const calls = [];
  let genCount = 0;
  return {
    calls,
    storage: kv.storage,
    llm: {
      async catalog() {
        return { models: [{ modelName: 'gemini-3-flash', displayName: 'Gemini 3 Flash', serviceTypes: ['text'], isUserPreferred: true }] };
      },
      async *stream(req) {
        calls.push(req);
        const sys = String(req.systemPrompt || '');
        if (sys.includes('intermissions') || sys.includes('dramatizations')) {
          yield {
            event: 'model_token',
            text: JSON.stringify({
              intermissions: [
                {
                  transitionKey: 'precinct_yard->crosswalk_redlight',
                  title: 'BETWEEN CALLS: PARKING GARAGE MEET',
                  sceneId: 'parking_garage_drop',
                  bgmId: 'bgm_dirty_payoff',
                  sfxId: 'cash_count',
                  speakerId: 'lt_malone',
                  speakerMood: 'corrupt',
                  lines: ['Malone leans out a dark sedan holding a thick envelope.'],
                  choices: [
                    { label: 'Pocket Cash', command: 'pocket cash', reply: 'You slide the envelope into your coat.', corruption: 4 },
                    { label: 'Walk Away', command: 'walk away', reply: 'Claire gives a tight nod.', byTheBook: 3 },
                  ],
                },
              ],
            }),
          };
        } else if (sys.includes('Chapter JSON')) {
          genCount += 1;
          yield {
            event: 'model_token',
            text: JSON.stringify({
              caseTitle: `CASE #84-GEN-${genCount}: MIDNIGHT BEDROOM LEAD`,
              title: 'CH.1: BEHIND CLOSED DOORS',
              beats: [
                {
                  id: 'b1',
                  sceneId: 'marcus_bedroom_visit',
                  bgmId: 'bgm_bedroom_warm',
                  sfxId: 'door_knock',
                  speakerId: 'claire_offduty',
                  speakerMood: 'flirt',
                  actors: [{ id: 'marcus_offduty' }, { id: 'claire_offduty' }],
                  narrative: ['03:12 HRS — Claire sets a warm dossier and two glasses on your nightstand.'],
                  objectives: ['Question Claire or cut a midnight deal'],
                  actions: [
                    { label: 'Press For Truth', command: 'press truth', nextBeatId: 'b2', scoreDelta: 15, alignmentDelta: { byTheBook: 3 }, sfx: 'point', log: 'She slips you the harbor keycard.' },
                    { label: 'Ignore Rules', command: 'burn ledger', nextBeatId: 'b2', scoreDelta: 12, alignmentDelta: { corruption: 4, rogue: 2 }, sfx: 'lighter_flick', log: 'Ash scatters across the carpet.' },
                  ],
                },
                {
                  id: 'b2',
                  sceneId: 'penthouse_payoff',
                  bgmId: 'bgm_dirty_payoff',
                  sfxId: 'cash_count',
                  speakerId: 'lt_malone',
                  speakerMood: 'smirk',
                  actors: [{ id: 'marcus_offduty' }, { id: 'lt_malone' }],
                  narrative: ['Malone slides an open cash briefcase across the penthouse suite.'],
                  objectives: ['Refuse bribe or strike illegally'],
                  actions: [
                    { label: 'Arrest Malone', command: 'cuff malone', endChapter: true, isVictory: true, scoreDelta: 20, alignmentDelta: { byTheBook: 4 }, sfx: 'cuff', log: 'Clean bust under city lights.' },
                    { label: 'Draw Uncovered', command: 'charge blind', failCitation: 'IA-888', failReason: 'Charged without cover.' },
                  ],
                },
              ],
            }),
          };
        } else if (sys.includes('Case Outline')) {
          genCount += 1;
          yield {
            event: 'model_token',
            text: JSON.stringify({
              caseTitle: `CASE #84-GEN-${genCount}: MIDNIGHT BEDROOM LEAD`,
              culpritId: 'lt_malone',
              motive: 'Laundered dockside manifest kickbacks.',
              twist: 'Claire holds duplicate dispatch logs in her loft.',
              castIds: ['marcus_offduty', 'claire_offduty', 'lt_malone', 'raincoat_man'],
              chapterArcs: ['Late-night bedroom confession', 'Harbor showdown'],
            }),
          };
        } else {
          yield { event: 'model_token', text: 'Claire (#089): "Stay sharp, Marcus—watch the BOLO board before hitting Locker #84."' };
        }
        yield { event: 'complete' };
      },
    },
  };
}

async function main() {
  console.log('1. Checking 300+ Asset Catalog & BGM/SFX registries...');
  const totalAssets = getSceneIds().length + getCharacterList().length + getBgmIds().length + CORE_SFX_LIST.length;
  assert.ok(getSceneIds().length >= 150, `Expected >= 150 composed scenes, got ${getSceneIds().length}`);
  assert.ok(getCharacterList().length >= 60, `Expected >= 60 character profiles, got ${getCharacterList().length}`);
  assert.ok(getBgmIds().length >= 40, `Expected >= 40 BGM tracks, got ${getBgmIds().length}`);
  assert.ok(CORE_SFX_LIST.length >= 45, `Expected >= 45 SFX cues, got ${CORE_SFX_LIST.length}`);
  assert.ok(totalAssets >= 300, `Expected >= 300 total assets, got ${totalAssets}`);
  const pool = selectRandomStoryAssets();
  assert.ok(pool.allCharacterIds.length === 12 && pool.allCharacterIds.length === new Set(pool.allCharacterIds).size && pool.allSceneIds.length === new Set(pool.allSceneIds).size && pool.bgm.length === new Set(pool.bgm).size && pool.sfx.length === new Set(pool.sfx).size && pool.scenes.leisure.length === 2);
  console.log(`   PASS: Verified ${totalAssets} assets (${getSceneIds().length} scenes, ${getCharacterList().length} chars, ${getBgmIds().length} BGM, ${CORE_SFX_LIST.length} SFX).`);

  const kv = createMockKv();
  const mockAnna = createMockAnna(kv);
  const store = new PrecinctSaveStore(mockAnna);
  await store.load();
  await store.loadTiers();
  const catalog = await loadModelCatalog(mockAnna);

  console.log('2. Testing Tier 2 upfront blueprint, deviation choices & Tier 3 isolated saves + Replay vs New Story...');
  const term = createMockTerm();
  const session = createXtermTuiSession({
    term,
    anna: mockAnna,
    saveStore: store,
    modelCatalog: catalog,
    initialState: createInitialState({ phase: 'mode_select', aiTier: 2, storyGenMode: 'full', aiModel: 'model:gemini-3-flash', llmAvailable: true }),
    audioEnabled: true,
    tickIntervalMs: 0,
  });

  try {
    // Compile Tier 2 upfront once
    await session.startShift({ resumeSaved: false });
    assert.ok(session.getState().tier2Script['precinct_yard->crosswalk_redlight'], 'Tier 2 must compile upfront script');
    const callsAfterTier2 = mockAnna.calls.length;

    for (const cmd of ['listen briefing', 'look blackboard', 'go locker', 'open locker', 'take belt', 'take keys', 'go yard', 'inspect tires', 'inspect trunk', 'enter car', 'fasten seatbelt', 'radio 10-8']) {
      session.runCmd(cmd);
    }
    assert.ok(session.getState().intermission, 'Should enter Tier 2 compiled intermission deterministically');
    assert.equal(mockAnna.calls.length, callsAfterTier2, 'Tier 2 intermission lookup must take 0 extra LLM calls');
    session.runCmd('pocket cash');
    assert.equal(session.getState().alignment.corruption, 4, 'Dirty choice in intermission must update alignment');

    // Toggle F3 BGM independently
    assert.equal(session.getAudio().isMusicEnabled(), true);
    term.emit('\x1bOR'); // F3
    assert.equal(session.getAudio().isMusicEnabled(), false);

    // Switch to Tier 3 -> compiles bespoke Case + Bedroom scene -> Tier 2 save remains untouched!
    session.returnToModeSelect();
    session.selectTier(3);
    await session.startShift({ resumeSaved: false });
    await store.flush();

    assert.equal(session.getState().scene, 'marcus_bedroom_visit');
    const summaries = store.listTierSummaries();
    assert.ok(summaries[2] && summaries[3], 'Tier 2 and Tier 3 must hold independent active saves');

    // Delete Save sits left of AI model select; Start/Resume sits right; deleteTierSave supports progress-only vs full-story wipe
    const html = fs.readFileSync(new URL('../bundle/index.html', import.meta.url), 'utf8');
    assert.ok(html.indexOf('id="btn-delete-save"') < html.indexOf('id="ai-model-select"') && html.indexOf('id="ai-model-select"') < html.indexOf('id="btn-start-shift"') && html.includes('id="modal-delete-save"'));
    session.returnToModeSelect();
    session.selectTier(1);
    assert.equal((await session.resumeTier()).resumed, false);
    session.selectTier(2);
    assert.equal((await session.resumeTier()).resumed, true);
    session.returnToModeSelect();
    await session.deleteTierSave(2, false);
    assert.ok(!store.getTierActive(2) && store.listTierSummaries()[2]?.hasVault === true && store.listTierSummaries()[2]?.hasProgress === false);
    await session.deleteTierSave(2, true);
    assert.equal(store.listTierSummaries()[2], undefined);
    session.selectTier(3);
    await session.resumeTier();

    // Play deterministic compiled beat + corrupt choice + citation undo
    session.runCmd('burn ledger');
    assert.equal(session.getState().scene, 'penthouse_payoff');
    assert.equal(session.getState().alignment.corruption, 4);

    session.runCmd('charge blind');
    assert.equal(session.getState().gameOver?.citation, 'IA-888');
    session.runCmd('undo');
    assert.equal(session.getState().gameOver, null);

    // Keep Generated Story vs Generate New Story on Restart
    const originalTitle = session.getState().aiCampaign.outline.caseTitle;
    session.replaySameStory();
    assert.equal(session.getState().aiCampaign.outline.caseTitle, originalTitle, 'Keep Story must preserve compiled outline');
    assert.equal(session.getState().score, 0);
    assert.equal(session.getState().scene, 'marcus_bedroom_visit');

    await session.regenerateNewStory();
    assert.notEqual(session.getState().aiCampaign.outline.caseTitle, originalTitle, 'Generate New Story must compile fresh blueprint');
    console.log('   PASS: Compiled Blueprints, 0ms execution, Moral Deviations, Per-Tier Saves, Music Toggle & Replay vs New Story verified.');
  } finally {
    session.dispose();
  }

  console.log('3. Testing Save Verification Retries, Local-Newer Cloud Heal, Blueprint Vault & JSON Repair...');
  // Mock browser localStorage in Node to test true cloud+local dual-layer sync & healing
  const lsBacking = new Map();
  globalThis.localStorage = {
    getItem: (k) => (lsBacking.has(k) ? lsBacking.get(k) : null),
    setItem: (k, v) => lsBacking.set(k, String(v)),
    removeItem: (k) => lsBacking.delete(k),
  };

  try {
    // 3A. Transient APS KV failure (fails 2x, succeeds 3rd + read-back verified)
    let setFailuresRemaining = 2;
    const kvFlaky = createMockKv();
    const flakyRuntime = {
      storage: {
        get: kvFlaky.storage.get,
        delete: kvFlaky.storage.delete,
        async set(arg) {
          if (arg.key === 'precinct-84-anna:tier:3' && setFailuresRemaining > 0) {
            setFailuresRemaining -= 1;
            throw new Error('Transient 503');
          }
          return kvFlaky.storage.set(arg);
        },
      },
    };
    const sRetry = new PrecinctSaveStore(flakyRuntime);
    const t3State = kv.map.get('precinct-84-anna:tier:3');
    const retryRes = await sRetry.saveTierActiveVerified(3, t3State);
    assert.equal(retryRes.cloudOk, true, 'Must retry and verify read-back after transient failures');
    assert.equal(retryRes.attempts, 3);
    assert.equal(sRetry.status.mode, 'cloud+local');

    // 3B. Newer localStorage heals stale cloud + Backup Vault recovers even if tier:3 key wiped
    const staleCloud = { ...t3State, score: 5, _savedAt: 100, _saveSeq: 1 };
    const newerLocal = { ...t3State, score: 88, _savedAt: Date.now() + 5000, _saveSeq: 99 };
    kvFlaky.map.set('precinct-84-anna:tier:3', staleCloud);
    lsBacking.set('precinct-84-anna:tier:3', JSON.stringify(newerLocal));
    const sHeal = new PrecinctSaveStore(flakyRuntime);
    await sHeal.loadTiers();
    await sHeal.flush();
    assert.equal(sHeal.getTierActive(3).score, 88, 'Newer local snapshot must win over stale cloud');
    assert.equal(kvFlaky.map.get('precinct-84-anna:tier:3').score, 88, 'Load must auto-heal stale APS KV');

    // Wipe tier:3 active key only, verify Blueprint Vault recovers story with 0 LLM calls
    await sHeal.clearTierActive(3, false);
    const termHeal = createMockTerm();
    const callsBefore = mockAnna.calls.length;
    const sessHeal = createXtermTuiSession({
      term: termHeal,
      anna: mockAnna,
      saveStore: sHeal,
      initialState: createInitialState({ phase: 'mode_select', aiTier: 3, llmAvailable: true }),
      audioEnabled: false,
      tickIntervalMs: 0,
    });
    await sessHeal.startShift({ resumeSaved: true });
    assert.equal(mockAnna.calls.length, callsBefore, 'Vault recovery must spend 0 LLM calls');
    assert.equal(sessHeal.getState().aiCampaign.outline.caseTitle, t3State.aiCampaign.outline.caseTitle);
    sessHeal.dispose();

    // 3C. Truncated LLM JSON repair (both mid-object AND mid-string cut-offs) prevents wasted credits
    const truncated = '{"title":"CH.2","beats":[{"id":"b1","sceneId":"pier_office"';
    const repaired = extractJsonObject(truncated);
    assert.equal(repaired?.title, 'CH.2');
    assert.equal(repaired?.beats?.[0]?.sceneId, 'pier_office');

    const midStringCut = '{"caseTitle":"The Tarnished Watch","culpritId":"raincoat_man","chapterArcs":["Ch1: Lead","Ch2: Pier 84 exposing';
    const repairedMidStr = extractJsonObject(midStringCut);
    assert.equal(repairedMidStr?.caseTitle, 'The Tarnished Watch');
    assert.equal(repairedMidStr?.culpritId, 'raincoat_man');
    assert.ok(repairedMidStr?.chapterArcs?.length >= 1);

    // 4. Progress Indicator updates + Demo Verbose Error Reporting
    assert.equal(DEMO_VERBOSE_ERRORS, true, 'Demo verbose error flag must be enabled during testing');
    const progSnapshots = [];
    const errAnna = {
      storage: kvFlaky.storage,
      llm: {
        async *stream() {
          yield { event: 'model_token', text: '{"bad' };
          yield { event: 'error', code: 'RATE_LIMITED_429', message: 'Quota exceeded test error' };
        },
      },
    };
    const errTerm = createMockTerm();
    let sessErr;
    sessErr = createXtermTuiSession({
      term: errTerm,
      anna: errAnna,
      saveStore: sHeal,
      initialState: createInitialState({ phase: 'playing', aiTier: 1, aiModel: 'model:gemini-3-flash', llmAvailable: true }),
      audioEnabled: false,
      tickIntervalMs: 0,
      onStateChange: () => {
        const p = sessErr?.getAiProgress?.();
        if (p) progSnapshots.push({ ...p });
      },
    });
    await sessErr.askClaire('what now?');
    assert.ok(progSnapshots.some((p) => p.active && p.chars > 0), 'Progress indicator must track active stage & streamed chars');
    assert.equal(sessErr.getAiProgress(), null, 'Progress indicator must clear when LLM finishes');
    const reported = sessErr.getLastError();
    assert.ok(reported && reported.demoVerbose === true, 'Error must populate on session with demoVerbose');
    assert.match(reported.details, /RATE_LIMITED_429/);
    assert.match(reported.details, /Quota exceeded test error/);
    assert.match(reported.details, /gemini-3-flash/);
    assert.match(reported.details, /"stack":/);
    assert.match(sessErr.getState().log.at(-1).text, /Quota exceeded test error/);
    sessErr.clearLastError();
    assert.equal(sessErr.getLastError(), null);
    sessErr.dispose();

    // 5. Persistent All-Stories Library (Tier 2 + multiple Tier 3) & Export/Import JSON
    const lib = new StoryLibraryStore(flakyRuntime);
    const libTerm = createMockTerm();
    const sessLib = createXtermTuiSession({
      term: libTerm,
      anna: mockAnna,
      saveStore: sHeal,
      storyLib: lib,
      initialState: createInitialState({ phase: 'mode_select', aiTier: 2, llmAvailable: true }),
      audioEnabled: false,
      tickIntervalMs: 0,
    });
    await sessLib.startShift({ resumeSaved: false });
    const t2Id = sessLib.getState().storyId;
    sessLib.returnToModeSelect();
    sessLib.selectTier(3);
    await sessLib.startShift({ resumeSaved: false });
    const t3FirstId = sessLib.getState().storyId;
    await sessLib.regenerateNewStory();
    const t3SecondId = sessLib.getState().storyId;

    assert.notEqual(t3FirstId, t3SecondId);
    assert.ok(lib.getById(t2Id) && lib.getById(t3FirstId) && lib.getById(t3SecondId), 'All generated Tier 2 and Tier 3 stories must persist together');

    const exportedOne = lib.exportSingleJson(lib.getById(t3FirstId));
    const exportedAll = lib.exportAllJson();
    assert.match(exportedOne.jsonText, /"format": "precinct-84-story"/);
    assert.match(exportedAll.jsonText, /"format": "precinct-84-library"/);

    // Hydrate into a fresh StoryLibraryStore & import standalone JSON cleanly
    const freshLib = new StoryLibraryStore(flakyRuntime);
    await freshLib.load();
    assert.equal(freshLib.list().length, 3, 'APS KV reload must restore all 3 saved stories');
    await assert.rejects(() => freshLib.importFromJsonText('{broken'), /Invalid JSON syntax/);
    const imp = await freshLib.importFromJsonText(exportedOne.jsonText);
    sessLib.loadSavedStoryEntry(imp[0], false);
    assert.equal(sessLib.getState().aiCampaign.outline.caseTitle, lib.getById(t3FirstId).title);
    sessLib.dispose();
    console.log('   PASS: All-stories archive, Export JSON, Import JSON & error validation verified.');
  } finally {
    delete globalThis.localStorage;
  }

  console.log('\nALL SVGA / BLUEPRINT / 300-ASSET E2E TESTS PASSED');
}

main().catch((err) => { console.error('\nE2E FAILURE:', err); process.exit(1); });
