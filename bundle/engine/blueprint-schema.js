import { SCENE_CATALOG, getSceneIds } from '../assets/scene-catalog.js';
import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import { BGM_CATALOG, getBgmIds, CORE_SFX_LIST } from '../assets/audio-catalog.js';
import { selectRandomStoryAssets, formatChapterAssetPoolPrompt } from './asset-selector.js';
import { sanitizeProseAssetIds, cleanWordLabel, cleanStoryTheme } from './story-bible.js';
import {
  normalizeStageActors,
  normalizeStageProps,
  normalizeTimeline,
  normalizeActionTimeline,
  normalizeActionConsequence,
} from './screenplay-normalizer.js';

const SCENE_IDS = getSceneIds();
const CHAR_IDS = Object.keys(CHARACTER_CATALOG);
const BGM_IDS = getBgmIds();
const SFX_SET = new Set(CORE_SFX_LIST);

function snapCatalogId(raw, catalog, allIds, fallback, poolIds = null) {
  const s = String(raw || '').trim();
  const safeFallback = catalog[fallback] ? fallback : allIds[0];
  if (!s) return safeFallback;
  const inPool = Array.isArray(poolIds) && poolIds.length ? poolIds : null;
  if (inPool?.includes(s)) return s;
  if (catalog[s]) return s;
  const key = s.toLowerCase().replace(/^bgm_/, '');
  if (inPool) {
    const poolExact = inPool.find((id) => id.toLowerCase() === s.toLowerCase());
    if (poolExact) return poolExact;
    const poolFuzzy = inPool.find((id) => id.includes(key) || key.includes(id.split('_')[0]));
    if (poolFuzzy) return poolFuzzy;
  }
  const globalFuzzy = allIds.find((id) => id.includes(key) || key.includes(id.split('_')[0]));
  return globalFuzzy || safeFallback;
}

export function snapSceneId(raw, fallback = 'precinct_briefing', poolIds = null) {
  return snapCatalogId(raw, SCENE_CATALOG, SCENE_IDS, fallback, poolIds);
}

export function snapCharacterId(raw, fallback = 'claire', poolIds = null) {
  return snapCatalogId(raw, CHARACTER_CATALOG, CHAR_IDS, fallback, poolIds);
}

export function snapBgmId(raw, fallback = 'bgm_precinct_rain', poolIds = null) {
  return snapCatalogId(raw, BGM_CATALOG, BGM_IDS, fallback, poolIds);
}

export function snapSfxId(raw, fallback = 'tick') {
  const s = String(raw || '').trim();
  return SFX_SET.has(s) ? s : fallback;
}

export function buildCompactAssetManifestPrompt(assetPool = null) {
  return formatChapterAssetPoolPrompt(assetPool || selectRandomStoryAssets());
}

const TIER2_DEFAULTS = {
  'precinct_yard->crosswalk_redlight': ['diner_midnight', 'bgm_rain_patrol', 'claire'],
  'interrogation_room->motel_exterior': ['parking_garage_drop', 'bgm_dirty_payoff', 'claire'],
  'motel_lab->pier84_exterior': ['marcus_bedroom_night', 'bgm_bedroom_tense', 'raincoat_man'],
};

export function validateSingleIntermission(src = {}, key, fallbackSeed = {}, assetPool = null) {
  const [defScene, defBgm, defSpeaker] = TIER2_DEFAULTS[key] || ['diner_midnight', 'bgm_rain_patrol', 'claire'];
  const actions = Array.isArray(src?.choices) && src.choices.length
    ? src.choices.slice(0, 3).map((c, ci) => ({
        label: cleanWordLabel(c?.label, 24, `Option ${ci + 1}`),
        command: String(c?.command || c?.label || `choice ${ci + 1}`).toLowerCase(),
        reply: sanitizeProseAssetIds(c?.reply || 'Claire nods quietly into the glow of the dashboard.'),
        alignmentDelta: { byTheBook: Number(c?.byTheBook || 0), corruption: Number(c?.corruption || 0), rogue: Number(c?.rogue || 0) },
      }))
    : [
        { label: 'Keep It By The Book', command: 'follow code', reply: 'Claire taps the cruiser dash: "Clean call, Marcus."', alignmentDelta: { byTheBook: 2, corruption: 0, rogue: 0 } },
        { label: 'Bend The Rules', command: 'bend rules', reply: 'Marcus lowers his eyes: "Whatever closes the case tonight."', alignmentDelta: { byTheBook: 0, corruption: 1, rogue: 2 } },
      ];
  const sceneId = snapSceneId(src?.sceneId, defScene, assetPool?.allSceneIds);
  const speakerId = snapCharacterId(src?.speakerId, defSpeaker, assetPool?.allCharacterIds);
  const speakerMood = String(src?.speakerMood || 'calm');
  const cleanLines = Array.isArray(src?.lines) && src.lines.length
    ? src.lines.slice(0, 10).map((l) => sanitizeProseAssetIds(l))
    : ['Rain drums against the roof while Oakridge dispatch crackles over Channel 1.'];
  const actors = normalizeStageActors(src?.actors, sceneId, cleanLines, assetPool?.allCharacterIds, speakerId);
  const stageProps = normalizeStageProps(src?.stageProps || src?.props, sceneId, cleanLines);
  const timeline = normalizeTimeline(src?.timeline, actors, stageProps, cleanLines, speakerId, speakerMood);
  return {
    transitionKey: key,
    title: cleanWordLabel(src?.title || fallbackSeed[key]?.title || 'BETWEEN CALLS DRAMATIZATION', 56),
    sceneId,
    bgmId: snapBgmId(src?.bgmId, defBgm, assetPool?.bgm),
    sfxId: snapSfxId(src?.sfxId, 'squelch'),
    speakerId,
    speakerMood,
    actors,
    stageProps,
    timeline,
    lines: cleanLines,
    choices: actions,
  };
}

export function validateTier2Bundle(raw, fallbackSeed = {}, assetPool = null) {
  if (raw?._mode === 'episodic') {
    const out = { _mode: 'episodic', _theme: cleanStoryTheme(raw._theme), _assetPool: raw._assetPool || assetPool || null };
    for (const key of Object.keys(TIER2_DEFAULTS)) {
      if (raw[key]) out[key] = validateSingleIntermission(raw[key], key, fallbackSeed, out._assetPool);
    }
    return out;
  }
  const list = Array.isArray(raw?.intermissions) ? raw.intermissions : [];
  const keys = Object.keys(TIER2_DEFAULTS);
  const out = {};
  if (raw?._mode) out._mode = raw._mode;
  if (raw?._theme) out._theme = cleanStoryTheme(raw._theme);
  if (raw?._assetPool || assetPool) out._assetPool = raw._assetPool || assetPool;
  keys.forEach((key, idx) => {
    const src = raw?.[key] || list.find((it) => it?.transitionKey === key) || list[idx] || {};
    out[key] = validateSingleIntermission(src, key, fallbackSeed, out._assetPool || assetPool);
  });
  return out;
}

export function validateCaseOutline(raw, continuation = false, assetPool = null) {
  const pool = assetPool || raw?.assetPool || null;
  const poolChars = pool?.allCharacterIds || null;
  const arcs = Array.isArray(raw?.chapterArcs) && raw.chapterArcs.length ? raw.chapterArcs.slice(0, 4) : [
    'Cold-open street lead & suspicious partner alibi',
    'Late-night interrogation / corrupt bribe offer',
    'Harbor finale showdown against the culprit',
  ];
  const rawCast = Array.isArray(raw?.castIds) && raw.castIds.length
    ? raw.castIds.map((id) => snapCharacterId(id, 'claire', poolChars))
    : (Array.isArray(poolChars) && poolChars.length ? poolChars : ['marcus', 'claire', 'lt_malone', 'raincoat_man']);
  const culpritFallback = pool?.characters?.badGuys?.[0] || 'lt_malone';
  return {
    caseTitle: cleanWordLabel(raw?.caseTitle || (continuation ? 'CASE #84-002: CROSSWALK SHADOWS' : 'CASE #84-003: NIGHT WATCH'), 64),
    culpritId: snapCharacterId(raw?.culpritId, culpritFallback, poolChars),
    motive: sanitizeProseAssetIds(raw?.motive || 'Covering up laundered Blue Velvet shipping manifests at the harbor.'),
    twist: sanitizeProseAssetIds(raw?.twist || 'An insider in Precinct 84 feeds patrol timings to the Man in the Beige Raincoat.'),
    storyTheme: cleanStoryTheme(raw?.storyTheme),
    castIds: [...new Set(rawCast)].slice(0, 12),
    chapterArcs: arcs.map((a) => sanitizeProseAssetIds(a)),
    assetPool: pool,
  };
}

export function validateChapterBlueprint(raw, chapterNum = 1, isFinalChapter = false, assetPool = null) {
  const poolScenes = assetPool?.allSceneIds || null;
  const poolChars = assetPool?.allCharacterIds || null;
  const poolBgm = assetPool?.bgm || null;
  const fallbackBeats = [
    {
      id: 'beat_1',
      sceneId: 'precinct_briefing',
      bgmId: 'bgm_precinct_rain',
      sfxId: 'squelch',
      speakerId: 'dooley',
      speakerMood: 'suspicious',
      actors: [{ id: 'dooley', pose: 'stand' }, { id: 'marcus', pose: 'stand' }, { id: 'claire', pose: 'stand' }],
      narrative: ['22:10 HRS — Fresh leads hit your desk as rain lashes Precinct 84.'],
      objectives: ['Inspect the lead dossier or question Claire off-record'],
      actions: [
        { label: 'By The Book', command: 'inspect dossier', nextBeatId: 'beat_2', scoreDelta: 10, alignmentDelta: { byTheBook: 3 }, sfx: 'point', log: 'You log the chain-of-custody stamp carefully.' },
        { label: 'Cut Side Deal', command: 'meet contact', nextBeatId: 'beat_2', scoreDelta: 8, alignmentDelta: { corruption: 3 }, sfx: 'cash_count', log: 'You pocket an unmarked address slip for midnight.' },
      ],
    },
    {
      id: 'beat_2',
      sceneId: 'marcus_bedroom_night',
      bgmId: 'bgm_bedroom_tense',
      sfxId: 'door_knock',
      speakerId: 'claire_offduty',
      speakerMood: 'nervous',
      actors: [{ id: 'marcus_offduty', pose: 'stand' }, { id: 'claire_offduty', pose: 'stand' }],
      narrative: ['03:12 HRS — A sudden knock wakes your apartment as Claire stands soaked in the doorway.'],
      objectives: ['Hear Claire out or press her on the dispatch leak'],
      actions: [
        { label: 'Hear Her Out', command: 'talk claire', endChapter: true, isVictory: isFinalChapter, scoreDelta: 15, alignmentDelta: { byTheBook: 2 }, sfx: 'point', log: 'Claire whispers a name that cracks open the next chapter.' },
        { label: 'Demand Cash Split', command: 'take bribe', endChapter: true, isVictory: isFinalChapter, scoreDelta: 12, alignmentDelta: { corruption: 4 }, sfx: 'cash_count', log: 'Both badges slide under the dresser until morning.' },
      ],
    },
  ];
  let rawBeats = Array.isArray(raw?.beats) && raw.beats.length
    ? [...raw.beats]
    : (raw?.beats && typeof raw.beats === 'object' && Object.keys(raw.beats).length ? Object.values(raw.beats) : fallbackBeats);
  while (rawBeats.length > 2) {
    const tail = rawBeats[rawBeats.length - 1];
    const hasText = Array.isArray(tail?.narrative) && tail.narrative.length > 0;
    const hasActs = Array.isArray(tail?.actions) && tail.actions.length > 0;
    if (!hasText && !hasActs) rawBeats.pop();
    else break;
  }

  const beats = {};
  const orderedIds = rawBeats.map((b, i) => String(b?.id || `beat_${i + 1}`));
  rawBeats.forEach((b, i) => {
    const id = orderedIds[i];
    const nextFallback = i + 1 < orderedIds.length ? orderedIds[i + 1] : null;
    const rawActions = Array.isArray(b?.actions) && b.actions.length ? b.actions.slice(0, 4) : [
      { label: 'Investigate Lead', command: 'investigate', nextBeatId: nextFallback, endChapter: !nextFallback, isVictory: isFinalChapter && !nextFallback, scoreDelta: 10 },
    ];
    const sceneId = snapSceneId(b?.sceneId, poolScenes?.[i % poolScenes.length] || 'precinct_briefing', poolScenes);
    const defaultBgm = SCENE_CATALOG[sceneId]?.bgm || poolBgm?.[0] || 'bgm_precinct_rain';
    const speakerId = snapCharacterId(b?.speakerId, 'claire', poolChars);
    const speakerMood = String(b?.speakerMood || 'calm');
    const cleanNarrative = Array.isArray(b?.narrative) && b.narrative.length
      ? b.narrative.map((l) => sanitizeProseAssetIds(l))
      : ['The night deepens across Oakridge Harbor.'];
    const actors = normalizeStageActors(b?.actors, sceneId, cleanNarrative, poolChars, speakerId);
    const stageProps = normalizeStageProps(b?.stageProps || b?.props, sceneId, cleanNarrative);
    const timeline = normalizeTimeline(b?.timeline, actors, stageProps, cleanNarrative, speakerId, speakerMood);
    beats[id] = {
      id,
      sceneId,
      bgmId: snapBgmId(b?.bgmId, defaultBgm, poolBgm),
      sfxId: snapSfxId(b?.sfxId, 'tick'),
      speakerId,
      speakerMood,
      weather: b?.weather || null,
      props: Array.isArray(b?.props) ? b.props.map((p) => (typeof p === 'object' ? p?.id || 'evidence_marker' : String(p))) : [],
      stageProps,
      actors,
      timeline,
      narrative: cleanNarrative,
      objectives: Array.isArray(b?.objectives) && b.objectives.length
        ? b.objectives.map((o) => sanitizeProseAssetIds(o))
        : ['Follow the active lead'],
      actions: rawActions.map((a, ai) => ({
        label: cleanWordLabel(a?.label, 24, `Choice ${ai + 1}`),
        command: String(a?.command || a?.label || `step ${ai + 1}`).toLowerCase(),
        aliases: Array.isArray(a?.aliases) ? a.aliases.map((x) => String(x).toLowerCase()) : [],
        nextBeatId: (!nextFallback || a?.endChapter) ? null : (a?.nextBeatId && orderedIds.includes(a.nextBeatId) ? a.nextBeatId : nextFallback),
        endChapter: Boolean(a?.endChapter || !nextFallback),
        isVictory: Boolean((a?.isVictory || !nextFallback) && isFinalChapter),
        failCitation: a?.failCitation ? String(a.failCitation) : null,
        failReason: a?.failReason ? sanitizeProseAssetIds(a.failReason) : null,
        scoreDelta: Math.max(0, Math.min(25, Number(a?.scoreDelta ?? 8))),
        alignmentDelta: {
          byTheBook: Number(a?.alignmentDelta?.byTheBook || 0),
          corruption: Number(a?.alignmentDelta?.corruption || 0),
          rogue: Number(a?.alignmentDelta?.rogue || 0),
        },
        sfx: snapSfxId(a?.sfx, 'point'),
        log: sanitizeProseAssetIds(a?.log || 'You act decisively and update your case pad.'),
        timeline: normalizeActionTimeline(a, actors),
        consequence: normalizeActionConsequence(a, actors),
      })),
    };
  });

  return {
    chapterNumber: chapterNum,
    title: cleanWordLabel(raw?.title || `Chapter ${chapterNum}`, 60, `Chapter ${chapterNum}`),
    openingBeatId: orderedIds[0],
    beats,
  };
}
