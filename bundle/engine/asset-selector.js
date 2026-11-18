import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import { SCENE_CATALOG, getSceneIds } from '../assets/scene-catalog.js';
import { getBgmIds, CORE_SFX_LIST } from '../assets/audio-catalog.js';

const BAD_GUY_IDS = new Set([
  'raincoat_man', 'eddie', 'marco', 'castellano', 'attorney_kane', 'enforcer_gallo',
  'courier_miles', 'broker_stein', 'bouncer_tank', 'fixer_julian', 'chemist_eva',
  'snitch_pip', 'dealer_brick', 'driver_tony', 'boss_shadow', 'lt_malone', 'rival_det',
]);
const LEISURE_CHAR_IDS = new Set(['marcus_offduty', 'claire_offduty', 'lounge_veronica', 'model_celeste']);
const EXTRA_OFFICER_IDS = new Set(['ia_vance', 'judge_sterling', 'forensic_chen', 'coroner_graves', 'paramedic_ruth', 'tech_norman', 'lawyer_shaw', 'photographer_lee']);

const SCENE_BUCKET_TPLS = {
  police: new Set(['precinct_briefing', 'precinct_locker', 'precinct_yard', 'interrogation_b', 'epilogue_stage']),
  street: new Set(['crosswalk_redlight', 'pursuit_highway', 'felony_railyard', 'brick_alley', 'parking_garage', 'motel_exterior']),
  harbor: new Set(['motel_lab', 'pier_exterior', 'pier_floor', 'pier_office', 'pier_tracks']),
  leisure: new Set(['marcus_bedroom', 'claire_bedroom', 'penthouse_bedroom', 'diner_booth']),
};

function classifyCharacters() {
  const buckets = { officers: [], civilians: [], badGuys: [], leisure: [] };
  for (const id of Object.keys(CHARACTER_CATALOG)) {
    if (LEISURE_CHAR_IDS.has(id)) buckets.leisure.push(id);
    else if (BAD_GUY_IDS.has(id)) buckets.badGuys.push(id);
    else if (CHARACTER_CATALOG[id].badge || EXTRA_OFFICER_IDS.has(id)) buckets.officers.push(id);
    else buckets.civilians.push(id);
  }
  return buckets;
}

function classifyScenes() {
  const buckets = { police: [], street: [], harbor: [], leisure: [] };
  for (const id of getSceneIds()) {
    const tpl = SCENE_CATALOG[id]?.tpl;
    if (SCENE_BUCKET_TPLS.leisure.has(tpl)) buckets.leisure.push(id);
    else if (SCENE_BUCKET_TPLS.police.has(tpl)) buckets.police.push(id);
    else if (SCENE_BUCKET_TPLS.harbor.has(tpl)) buckets.harbor.push(id);
    else buckets.street.push(id);
  }
  return buckets;
}

function shuffleWithRng(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickUnique(pool, count, seen, rng = Math.random, requiredIds = []) {
  const picked = [];
  for (const id of requiredIds) {
    if (picked.length < count && pool.includes(id) && !seen.has(id)) {
      seen.add(id);
      picked.push(id);
    }
  }
  for (const id of shuffleWithRng(pool, rng)) {
    if (picked.length >= count) break;
    if (!seen.has(id)) {
      seen.add(id);
      picked.push(id);
    }
  }
  return picked;
}

function pickUniqueScenes(pool, count, seenIds, seenTpls, rng = Math.random) {
  const shuffled = shuffleWithRng(pool, rng);
  const picked = [];
  for (const id of shuffled) {
    if (picked.length >= count) break;
    const tpl = SCENE_CATALOG[id]?.tpl;
    if (!seenIds.has(id) && (!tpl || !seenTpls.has(tpl))) {
      seenIds.add(id);
      if (tpl) seenTpls.add(tpl);
      picked.push(id);
    }
  }
  for (const id of shuffled) {
    if (picked.length >= count) break;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      picked.push(id);
    }
  }
  return picked;
}

export function selectRandomStoryAssets(opts = {}) {
  const rng = typeof opts.rng === 'function' ? opts.rng : Math.random;
  const q = {
    officers: 4, civilians: 3, badGuys: 3, leisureChars: 2,
    policeScenes: 2, streetScenes: 3, harborScenes: 3, leisureScenes: 2,
    bgm: 8, sfx: 10,
    ...(opts.counts || {}),
  };

  const charBuckets = classifyCharacters();
  const sceneBuckets = classifyScenes();
  const seenChars = new Set();
  const seenScenes = new Set();
  const seenTpls = new Set();
  const seenBgm = new Set();
  const seenSfx = new Set();

  const characters = {
    officers: pickUnique(charBuckets.officers, q.officers, seenChars, rng, ['marcus', 'claire']),
    civilians: pickUnique(charBuckets.civilians, q.civilians, seenChars, rng),
    badGuys: pickUnique(charBuckets.badGuys, q.badGuys, seenChars, rng),
    leisure: pickUnique(charBuckets.leisure, q.leisureChars, seenChars, rng),
  };

  const scenes = {
    police: pickUniqueScenes(sceneBuckets.police, q.policeScenes, seenScenes, seenTpls, rng),
    street: pickUniqueScenes(sceneBuckets.street, q.streetScenes, seenScenes, seenTpls, rng),
    harbor: pickUniqueScenes(sceneBuckets.harbor, q.harborScenes, seenScenes, seenTpls, rng),
    leisure: pickUniqueScenes(sceneBuckets.leisure, q.leisureScenes, seenScenes, seenTpls, rng),
  };

  const bgm = pickUnique(getBgmIds(), q.bgm, seenBgm, rng);
  const sfx = pickUnique(CORE_SFX_LIST, q.sfx, seenSfx, rng);

  return {
    characters,
    scenes,
    bgm,
    sfx,
    allCharacterIds: [...characters.officers, ...characters.civilians, ...characters.badGuys, ...characters.leisure],
    allSceneIds: [...scenes.police, ...scenes.street, ...scenes.harbor, ...scenes.leisure],
  };
}

function describeChar(id) {
  const c = CHARACTER_CATALOG[id];
  const name = c?.name || id;
  const role = c?.role?.split(';')[0] || 'character';
  return `${id}="${name}" (${role.slice(0, 28)})`;
}

export function formatOutlineAssetPoolPrompt(pool) {
  const c = pool.characters;
  const s = pool.scenes;
  return [
    'RANDOMLY CAST ASSETS FOR THIS STORY (use ONLY these IDs):',
    `- Officers (${c.officers.length}): ${c.officers.map(describeChar).join(', ')}`,
    `- Civilians (${c.civilians.length}): ${c.civilians.map(describeChar).join(', ')}`,
    `- Bad Guys (${c.badGuys.length}): ${c.badGuys.map(describeChar).join(', ')}`,
    `- Leisure/Off-Duty (${c.leisure.length}): ${c.leisure.map(describeChar).join(', ')}`,
    `- Key Scenes (${pool.allSceneIds.length}): police[${s.police.join(', ')}] | street[${s.street.join(', ')}] | harbor[${s.harbor.join(', ')}] | leisure[${s.leisure.join(', ')}]`,
  ].join('\n');
}

export function formatChapterAssetPoolPrompt(pool) {
  const s = pool.scenes;
  return [
    'STORY ASSET POOL (use ONLY these IDs):',
    `CAST: ${pool.allCharacterIds.map(describeChar).join(', ')}`,
    `SCENES police: ${s.police.join(', ')} | street: ${s.street.join(', ')} | harbor: ${s.harbor.join(', ')} | leisure: ${s.leisure.join(', ')}`,
    `BGM: ${pool.bgm.join(', ')}`,
    `SFX: ${pool.sfx.join(', ')}`,
  ].join('\n');
}
