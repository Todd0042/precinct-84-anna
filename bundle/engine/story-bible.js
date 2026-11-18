import { CHARACTER_CATALOG } from '../assets/character-catalog.js';

const CHAR_ID_KEYS = Object.keys(CHARACTER_CATALOG);

export function cleanStoryTheme(raw) {
  return String(raw || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function formatThemeDirective(theme) {
  const t = cleanStoryTheme(theme);
  return t ? `Theme Suggestion (blend into 1984 Oakridge using ONLY allowed assets): "${t}"` : '';
}

export function sanitizeProseAssetIds(text) {
  let out = String(text || '');
  if (!out) return out;
  for (const id of CHAR_ID_KEYS) {
    if (!id.includes('_')) continue;
    if (!out.includes(id)) continue;
    const name = CHARACTER_CATALOG[id]?.name || id;
    out = out.replace(new RegExp(`\\b${id}\\b`, 'g'), name);
  }
  return out;
}

export function cleanWordLabel(raw, maxLen = 24, fallback = 'Action') {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return fallback;
  if (s.length <= maxLen) return s;
  const slice = s.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace >= Math.floor(maxLen * 0.45) ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,:\-—]+$/g, '').trim() || fallback;
}

export function summarizeChapterOutcome(chapter, chIdx, awarded = {}) {
  const title = chapter?.title || `Chapter ${chapter?.chapterNumber || chIdx + 1}`;
  const prefix = `bp_${chIdx}_`;
  const chosenActions = [];
  for (const [beatId, beat] of Object.entries(chapter?.beats || {})) {
    for (const act of beat?.actions || []) {
      const key = `${prefix}${beatId}_${act.command}`;
      if (awarded[key]) {
        chosenActions.push(`${beat.sceneId}: ${act.command} -> ${cleanWordLabel(act.log, 90, act.command)}`);
      }
    }
  }
  const tail = chosenActions.length
    ? chosenActions.slice(-2).join(' | ')
    : `Opened at ${chapter?.openingBeatId || 'beat_1'} (${Object.keys(chapter?.beats || {}).length} beats)`;
  return `${title}: ${tail}`;
}

export function createInitialStoryState() {
  return { casualties: [], injuries: {}, outfits: {}, props: {} };
}

export function recordStoryConsequence(storyState, consequence) {
  const st = storyState && typeof storyState === 'object' ? storyState : createInitialStoryState();
  if (!Array.isArray(st.casualties)) st.casualties = [];
  if (!st.injuries || typeof st.injuries !== 'object') st.injuries = {};
  if (!st.outfits || typeof st.outfits !== 'object') st.outfits = {};
  if (!st.props || typeof st.props !== 'object') st.props = {};
  if (!consequence || typeof consequence !== 'object') return st;

  const tid = consequence.targetId ? String(consequence.targetId) : null;
  if (tid) {
    if (consequence.status === 'dead' && tid !== 'marcus') {
      if (!st.casualties.includes(tid)) st.casualties.push(tid);
      delete st.injuries[tid];
    } else if (consequence.status && consequence.status !== 'intact') {
      st.injuries[tid] = String(consequence.status);
    }
    if (consequence.outfit) st.outfits[tid] = String(consequence.outfit);
    if (consequence.prop !== undefined) st.props[tid] = consequence.prop;
  }
  return st;
}

export function buildStoryBiblePrompt(aiCampaign, alignment = {}, awarded = {}) {
  const outline = aiCampaign?.outline || {};
  const culprit = CHARACTER_CATALOG[outline.culpritId];
  const culpritLabel = culprit ? `${culprit.name} [id:${culprit.id}]` : (outline.culpritId || 'lt_malone');
  const chapters = Array.isArray(aiCampaign?.chapters) ? aiCampaign.chapters : [];
  const recaps = chapters.map((ch, idx) => `- ${summarizeChapterOutcome(ch, idx, awarded)}`);
  const align = alignment || { byTheBook: 0, corruption: 0, rogue: 0 };
  const storyState = aiCampaign?.storyState || {};
  const casualties = Array.isArray(storyState.casualties) ? storyState.casualties : [];
  const injuries = Object.entries(storyState.injuries || {});

  const themeLine = formatThemeDirective(outline.storyTheme);
  return [
    'CANON STORY BIBLE (LOCKED CONTINUITY — DO NOT CONTRADICT):',
    `- Case: "${outline.caseTitle || 'Precinct 84 Mystery'}" | Culprit: ${culpritLabel}`,
    `- Motive: ${outline.motive || 'Covert dockside smuggling operation.'}`,
    `- Twist: ${outline.twist || 'Inside leak at Precinct 84.'}`,
    ...(themeLine ? [`- ${themeLine}`] : []),
    `- Lead Officers: Officer Marcus Mercer (#084) & Officer Claire Bellamy (#089)`,
    `- Player Alignment: byTheBook=${align.byTheBook || 0}, corruption=${align.corruption || 0}, rogue=${align.rogue || 0}`,
    ...(casualties.length ? [`- Casualties (DECEASED — NEVER REAPPEAR ALIVE): ${casualties.map((id) => CHARACTER_CATALOG[id]?.name || id).join(', ')}`] : []),
    ...(injuries.length ? [`- Active Wounds / Hospitalizations (ZERO HP — REALISTIC INJURIES): ${injuries.map(([id, st]) => `${CHARACTER_CATALOG[id]?.name || id}=${st}`).join(', ')}`] : []),
    recaps.length ? `- Prior Chapters & Player Choices:\n${recaps.join('\n')}` : '- Opening Episode: Start directly in Chapter 1.',
    'STRICT RULE: Never rename Marcus Mercer/Claire Bellamy, never write snake_case IDs in prose, never use health bars/HP, and continue faithfully from prior casualties/wounds/arrests.',
  ].join('\n');
}
