import { addLog, cloneState } from '../game/state.js';
import { INTERMISSION_TRANSITIONS } from './case-context.js';
import { invokeAnnaLlm, extractJsonObject, hasLlmSupport } from './anna-ai.js';
import {
  buildCompactAssetManifestPrompt,
  validateTier2Bundle,
  validateSingleIntermission,
  validateCaseOutline,
  validateChapterBlueprint,
} from './blueprint-schema.js';
import { selectRandomStoryAssets, formatOutlineAssetPoolPrompt, formatChapterAssetPoolPrompt } from './asset-selector.js';
import { buildStoryBiblePrompt, cleanStoryTheme, formatThemeDirective } from './story-bible.js';
import { enterBlueprintBeat } from './blueprint-runner.js';
import { buildDirectorErrorInfo as buildErrorInfo, runClaireHint, runNpcQuestion, generateIaDebrief, chooseAutoPlayOption } from './case-assistants.js';

export { runClaireHint, runNpcQuestion, generateIaDebrief, chooseAutoPlayOption };

function selectTier2AssetPool() {
  return selectRandomStoryAssets({
    counts: {
      officers: 3, civilians: 2, badGuys: 2, leisureChars: 2,
      policeScenes: 1, streetScenes: 2, harborScenes: 2, leisureScenes: 2, bgm: 6, sfx: 8,
    },
  });
}

export async function compileTier2Intermissions({ anna, state, onProgress = null }) {
  const next = cloneState(state);
  next.phase = 'playing';
  next.intermission = null;
  const out = [];
  const tier2Pool = selectTier2AssetPool();
  const fullMode = (next.storyGenMode || 'episodic') === 'full';

  const theme = cleanStoryTheme(next.storyTheme);
  if (!fullMode) {
    next.tier2Script = { _mode: 'episodic', _theme: theme, _assetPool: tier2Pool };
    addLog(next, out, 'SYSTEM', 'Tier 2 (1-by-1): each between-calls dramatization compiles when you reach it.');
    return { state: next, sfx: 'squelch' };
  }
  if (!hasLlmSupport(anna)) {
    next.tier2Script = { _mode: 'full', _theme: theme, _assetPool: tier2Pool, ...validateTier2Bundle({}, INTERMISSION_TRANSITIONS, tier2Pool) };
    addLog(next, out, 'SYSTEM', 'Tier 2 started offline using built-in dramatic intermissions.');
    return { state: next, sfx: 'squelch' };
  }

  const manifest = formatChapterAssetPoolPrompt(tier2Pool);
  const themeLine = formatThemeDirective(theme);
  const sys = [
    'Compile a consistent JSON bundle of 3 "between calls" noir dramatizations for Precinct 84 Tier 2 (Marcus Mercer #084 & Claire Bellamy #089).',
    `Allowed assets ONLY:\n${manifest}`,
    ...(themeLine ? [themeLine] : []),
    'Transitions: precinct_yard->crosswalk_redlight, interrogation_room->motel_exterior, motel_lab->pier84_exterior.',
    'Keep choice labels 2-3 short words (<=20 chars); use display names never snake_case IDs in prose.',
    'Return ONLY JSON: {"intermissions":[{"transitionKey":"...","title":"...","sceneId":"...","bgmId":"...","sfxId":"...","speakerId":"...","speakerMood":"calm|smirk|nervous|angry|flirt","lines":["...","..."],"choices":[{"label":"...","command":"...","reply":"...","byTheBook":0,"corruption":0,"rogue":0}]}]}',
  ].join('\n');

  let raw = '';
  try {
    raw = await invokeAnnaLlm(anna, {
      systemPrompt: sys,
      messages: [{ role: 'user', content: 'Compile a cohesive 3-intermission noir arc bridging Acts I->II, II->III, and III->IV.' }],
      selectedModel: next.aiModel,
      maxTokens: 1600,
      temperature: 0.72,
      stage: 'Compile Tier 2 Intermissions',
      onProgress,
    });
    const parsed = extractJsonObject(raw);
    if (!parsed) throw new Error('Invalid JSON returned by LLM for Tier 2 intermissions.');
    next.tier2Script = { _mode: 'full', _theme: theme, _assetPool: tier2Pool, ...validateTier2Bundle(parsed, INTERMISSION_TRANSITIONS, tier2Pool) };
    addLog(next, out, 'SYSTEM', `Tier 2 Full Script compiled (${next.aiModel}) and saved to active Tier 2 file.`);
    return { state: next, sfx: 'squelch' };
  } catch (err) {
    const error = buildErrorInfo(err, 'Compile Tier 2 Intermissions', next.aiModel, raw || null);
    next.tier2Script = { _mode: 'full', _theme: theme, _assetPool: tier2Pool, ...validateTier2Bundle({}, INTERMISSION_TRANSITIONS, tier2Pool) };
    addLog(next, out, 'ALERT', `[ERROR] ${error.headline}: ${error.summary} (loaded safe fallback intermissions)`);
    return { state: next, sfx: 'hazard', error };
  }
}

export async function compileSingleTier2Intermission({ anna, state, transitionKey, onProgress = null }) {
  const next = cloneState(state);
  const baseScript = next.tier2Script && typeof next.tier2Script === 'object' ? { ...next.tier2Script } : { _mode: 'episodic' };
  const pool = baseScript._assetPool || selectTier2AssetPool();
  const theme = cleanStoryTheme(next.storyTheme || baseScript._theme);
  baseScript._assetPool = pool;
  baseScript._theme = theme;
  const out = [];

  let inter = validateSingleIntermission({}, transitionKey, INTERMISSION_TRANSITIONS, pool);
  let lastErr = null;
  if (hasLlmSupport(anna)) {
    const prior = Object.entries(baseScript).filter(([k]) => !k.startsWith('_')).map(([, v]) => v.title).join(' -> ');
    const themeLine = formatThemeDirective(theme);
    const sys = [
      `Compile ONE "between calls" noir dramatization for Precinct 84 (${transitionKey}) featuring Marcus Mercer (#084) & Claire Bellamy (#089).`,
      formatChapterAssetPoolPrompt(pool),
      ...(themeLine ? [themeLine] : []),
      `Prior Intermissions: ${prior || 'None yet'} | Alignment: ${JSON.stringify(next.alignment || {})}`,
      'Return ONLY JSON: {"title":"...","sceneId":"...","bgmId":"...","sfxId":"...","speakerId":"...","speakerMood":"calm|smirk|nervous|angry|flirt","lines":["...","..."],"choices":[{"label":"Short Label","command":"cmd","reply":"...","byTheBook":0,"corruption":0,"rogue":0}]}',
    ].join('\n');
    let raw = '';
    try {
      raw = await invokeAnnaLlm(anna, {
        systemPrompt: sys,
        messages: [{ role: 'user', content: `Generate single between-calls scene for ${transitionKey}.` }],
        selectedModel: next.aiModel,
        maxTokens: 700,
        temperature: 0.72,
        stage: 'Compile Act Dramatization',
        onProgress,
      });
      const parsed = extractJsonObject(raw);
      if (!parsed) throw new Error(`Invalid JSON returned for ${transitionKey}.`);
      inter = validateSingleIntermission(parsed, transitionKey, INTERMISSION_TRANSITIONS, pool);
    } catch (err) {
      lastErr = buildErrorInfo(err, 'Compile Act Dramatization', next.aiModel, raw || null);
    }
  }
  baseScript[transitionKey] = inter;
  next.tier2Script = baseScript;
  next.intermission = inter;
  addLog(next, out, 'RADIO', `--- ${inter.title} ---`);
  for (const l of inter.lines) addLog(next, out, 'DIALOG', l);
  if (lastErr) addLog(next, out, 'ALERT', `[ERROR] ${lastErr.headline}: ${lastErr.summary}`);
  return { state: next, sfx: lastErr ? 'hazard' : inter.sfxId || 'squelch', error: lastErr };
}

function buildChapterCompilerSystemPrompt({ manifest, biblePrompt, includeCaseFields = false }) {
  const schema = includeCaseFields
    ? '{"caseTitle":"...","culpritId":"...","motive":"...","twist":"...","title":"Ch.1: ...","beats":[{"id":"beat_1","sceneId":"...","bgmId":"...","sfxId":"...","speakerId":"...","speakerMood":"calm|smirk|angry|nervous|flirt","actors":[{"id":"...","pose":"stand|aim|kneel|run|handsup"}],"narrative":["..."],"objectives":["..."],"actions":[{"label":"Bag Ledger","command":"bag_ledger","nextBeatId":"beat_2","endChapter":false,"isVictory":false,"scoreDelta":10,"alignmentDelta":{"byTheBook":1,"corruption":0,"rogue":0},"sfx":"point","log":"..."}]}]}'
    : '{"title":"...","beats":[{"id":"beat_1","sceneId":"...","bgmId":"...","sfxId":"...","speakerId":"...","speakerMood":"calm|smirk|angry|nervous|flirt","actors":[{"id":"...","pose":"stand|aim|kneel|run|handsup"}],"narrative":["..."],"objectives":["..."],"actions":[{"label":"Bag Ledger","command":"bag_ledger","nextBeatId":"beat_2","endChapter":false,"isVictory":false,"scoreDelta":10,"alignmentDelta":{"byTheBook":1,"corruption":0,"rogue":0},"sfx":"point","log":"..."}]}]}';
  return [
    'You are the Precinct 84 Story Compiler. Generate ONE self-contained playable noir Chapter JSON using ONLY the asset IDs below.',
    manifest,
    biblePrompt,
    'RULES: Strictly 3 to 4 linked beats (mix duty scenes with deviate/corrupt/rogue or bedroom/diner beats). Each beat has 2-3 actions. Keep each action "label" to 2-3 short words (max 20 chars) and "title" <= 48 chars. Use character display names in narrative/log prose, NEVER raw snake_case IDs. Set endChapter:true on the final beat.',
    `Return ONLY JSON: ${schema}`,
  ].join('\n');
}

async function compileChapterWithOutline({ anna, campaignStub, chapterNum, alignment, awarded = {}, isFinal, selectedModel, stageLabel = null, onProgress }) {
  const outline = campaignStub?.outline || {};
  const assetPool = outline?.assetPool || selectRandomStoryAssets();
  if (!hasLlmSupport(anna)) return { chapter: validateChapterBlueprint({}, chapterNum, isFinal, assetPool), error: null };
  const manifest = buildCompactAssetManifestPrompt(assetPool);
  const biblePrompt = buildStoryBiblePrompt(campaignStub, alignment, awarded);
  const sys = buildChapterCompilerSystemPrompt({ manifest, biblePrompt, includeCaseFields: false });
  const arcHint = outline.chapterArcs?.[chapterNum - 1] || `Continue the investigation faithfully into Chapter ${chapterNum}`;
  const stage = stageLabel || `Compile Chapter ${chapterNum} Blueprint`;

  let raw = '';
  try {
    raw = await invokeAnnaLlm(anna, {
      systemPrompt: sys,
      messages: [{ role: 'user', content: `Compile Chapter ${chapterNum}${isFinal ? ' (FINAL SHOWDOWN EPISODE)' : ''}: ${arcHint}` }],
      selectedModel,
      maxTokens: 3200,
      temperature: 0.72,
      stage,
      onProgress,
    });
    const parsed = extractJsonObject(raw);
    if (!parsed) throw new Error(`Invalid JSON returned while compiling Chapter ${chapterNum}.`);
    return { chapter: validateChapterBlueprint(parsed, chapterNum, isFinal, assetPool), error: null };
  } catch (err) {
    const error = buildErrorInfo(err, stage, selectedModel, raw || null);
    return { chapter: validateChapterBlueprint({}, chapterNum, isFinal, assetPool), error };
  }
}

export async function compileNewAiCampaign({ anna, state, continuation = false, onProgress = null }) {
  const next = cloneState(state);
  next.phase = 'playing';
  next.intermission = null;
  next.gameOver = null;
  next.victory = false;
  const out = [];
  const fullMode = (next.storyGenMode || 'episodic') === 'full';
  const assetPool = selectRandomStoryAssets();

  const theme = cleanStoryTheme(next.storyTheme);
  let outline = validateCaseOutline({ storyTheme: theme }, continuation, assetPool);
  let chapters = [];
  let lastErr = null;

  if (!fullMode) {
    let ch1 = validateChapterBlueprint({}, 1, false, assetPool);
    if (hasLlmSupport(anna)) {
      const manifest = formatChapterAssetPoolPrompt(assetPool);
      const biblePrompt = buildStoryBiblePrompt({ outline, chapters: [] }, next.alignment, next.awarded);
      const sys = buildChapterCompilerSystemPrompt({ manifest, biblePrompt, includeCaseFields: true });
      let rawEp = '';
      try {
        rawEp = await invokeAnnaLlm(anna, {
          systemPrompt: sys,
          messages: [{ role: 'user', content: continuation ? 'Create episodic Chapter 1 of Case #84-002 sequel with Marcus Mercer (#084) & Claire Bellamy (#089).' : 'Create a gritty 1984 Oakridge noir episodic Chapter 1 with dirty-cop/rogue temptations and a sharp cliffhanger.' }],
          selectedModel: next.aiModel,
          maxTokens: 3200,
          temperature: 0.75,
          stage: 'Compile Episodic Ch.1',
          onProgress,
        });
        const parsed = extractJsonObject(rawEp);
        if (!parsed) throw new Error('Invalid JSON returned for Episodic Ch.1.');
        outline = validateCaseOutline({ ...parsed, storyTheme: theme, caseTitle: parsed.caseTitle || parsed.title }, continuation, assetPool);
        ch1 = validateChapterBlueprint(parsed, 1, false, assetPool);
      } catch (err) {
        lastErr = buildErrorInfo(err, 'Compile Episodic Ch.1', next.aiModel, rawEp || null);
      }
    }
    chapters = [ch1];
  } else {
    if (hasLlmSupport(anna)) {
      const manifest = formatOutlineAssetPoolPrompt(assetPool);
      const themeLine = formatThemeDirective(theme);
      let rawOut = '';
      try {
        rawOut = await invokeAnnaLlm(anna, {
          systemPrompt: [
            'Create a compact, coherent 1984 Oakridge noir 3-chapter Case Outline JSON using ONLY the pre-selected cast & scenes below.',
            manifest,
            ...(themeLine ? [themeLine] : []),
            'Keep motive, twist, and each of 3 chapterArcs to 1 crisp sentence.',
            'Return ONLY JSON: {"caseTitle":"...","culpritId":"...","motive":"...","twist":"...","castIds":[...],"chapterArcs":["Ch1...","Ch2...","Ch3..."]}',
          ].join('\n'),
          messages: [{ role: 'user', content: continuation ? 'Generate full 3-chapter sequel outline.' : 'Generate full 3-chapter dark Precinct 84 noir case with crooked cops & midnight intrigue.' }],
          selectedModel: next.aiModel,
          maxTokens: 1000,
          temperature: 0.78,
          stage: 'Compile Full Case Outline',
          onProgress,
        });
        const parsedOut = extractJsonObject(rawOut);
        if (!parsedOut) throw new Error('Invalid JSON returned for Case Outline.');
        outline = validateCaseOutline({ ...parsedOut, storyTheme: theme }, continuation, assetPool);
      } catch (err) {
        lastErr = buildErrorInfo(err, 'Compile Full Case Outline', next.aiModel, rawOut || null);
      }
    }
    const total = Math.max(1, Math.min(3, outline.chapterArcs?.length || 3));
    for (let num = 1; num <= total; num++) {
      const chRes = await compileChapterWithOutline({
        anna,
        campaignStub: { outline, chapters },
        chapterNum: num,
        alignment: next.alignment || { byTheBook: 0, corruption: 0, rogue: 0 },
        awarded: next.awarded || {},
        isFinal: num === total,
        selectedModel: next.aiModel,
        stageLabel: `Compile Full Case (${num}/${total})`,
        onProgress,
      });
      if (chRes.error && !lastErr) lastErr = chRes.error;
      chapters.push(chRes.chapter);
    }
  }

  const opening = chapters[0];
  next.aiCampaign = {
    active: true,
    storyGenMode: fullMode ? 'full' : 'episodic',
    outline,
    chapters,
    chapterIdx: 0,
    currentBeatId: opening.openingBeatId,
    awaitingNextChapter: false,
  };
  next.log = [];
  addLog(next, out, 'SCENE', `=== ${outline.caseTitle} (${fullMode ? `${chapters.length} CH FULL CASE` : 'CH.1 EPISODE'}) ===`);
  if (lastErr) addLog(next, out, 'ALERT', `[ERROR] ${lastErr.headline}: ${lastErr.summary} (using safe fallback chapter)`);
  enterBlueprintBeat(next, opening.beats[opening.openingBeatId], out);
  return { state: next, sfx: lastErr ? 'hazard' : opening.beats[opening.openingBeatId]?.sfxId || 'squelch', bgmId: opening.beats[opening.openingBeatId]?.bgmId, error: lastErr };
}

export async function compileNextBlueprintChapter({ anna, state, onProgress = null }) {
  const next = cloneState(state);
  const camp = next.aiCampaign;
  if (!camp?.active) return compileNewAiCampaign({ anna, state, continuation: true, onProgress });
  if (!camp.outline?.assetPool) camp.outline = { ...(camp.outline || {}), assetPool: selectRandomStoryAssets() };

  const nextNum = (camp.chapters?.length || 0) + 1;
  const chRes = await compileChapterWithOutline({
    anna,
    campaignStub: camp,
    chapterNum: nextNum,
    alignment: next.alignment || { byTheBook: 0, corruption: 0, rogue: 0 },
    awarded: next.awarded || {},
    isFinal: false,
    selectedModel: next.aiModel,
    stageLabel: `Compile Chapter ${nextNum}`,
    onProgress,
  });
  const ch = chRes.chapter;
  const out = [];
  if (chRes.error) {
    camp.awaitingNextChapter = true;
    addLog(next, out, 'ALERT', `[ERROR] ${chRes.error.headline}: ${chRes.error.summary}`);
    return { state: next, sfx: 'hazard', error: chRes.error };
  }

  next.victory = false;
  camp.chapters.push(ch);
  camp.chapterIdx = camp.chapters.length - 1;
  camp.awaitingNextChapter = false;
  enterBlueprintBeat(next, ch.beats[ch.openingBeatId], out);
  return { state: next, sfx: ch.beats[ch.openingBeatId]?.sfxId || 'squelch', bgmId: ch.beats[ch.openingBeatId]?.bgmId, error: null };
}
