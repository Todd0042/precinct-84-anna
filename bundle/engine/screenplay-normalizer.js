import { SCENE_CATALOG } from '../assets/scene-catalog.js';
import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import {
  snapOutfitId,
  snapPropId,
  snapStagePropId,
  snapPoseId,
  resolveLandmark,
  inferActorVisualsFromLines,
} from '../assets/outfit-prop-catalog.js';

const CONSEQUENCE_STATUSES = new Set([
  'intact', 'shaken', 'grazed', 'wounded_arm', 'wounded_leg', 'hospitalized', 'critical', 'dead',
]);

function snapChar(raw, fallback = 'marcus', poolChars = null) {
  const s = String(raw || '').trim();
  if (poolChars?.includes(s)) return s;
  if (CHARACTER_CATALOG[s]) return s;
  const low = s.toLowerCase();
  const hit = Object.keys(CHARACTER_CATALOG).find((id) => low.includes(id.split('_')[0]));
  return hit || fallback;
}

export function normalizeStageActors(rawActors, sceneId, textLines = [], poolChars = null, speakerId = 'claire') {
  const entry = SCENE_CATALOG[sceneId] || SCENE_CATALOG.precinct_briefing;
  const tpl = entry.tpl || 'default';
  const baseList = Array.isArray(rawActors) && rawActors.length
    ? rawActors.slice(0, 4)
    : (Array.isArray(entry.actors) && entry.actors.length
        ? entry.actors.map((a) => ({ id: a[0], x: a[1], y: a[2], facing: a[3], ...(a[4] || {}) }))
        : [{ id: 'marcus' }, { id: speakerId || 'claire' }]);

  const hasSpeaker = baseList.some((a) => (a?.id || a) === speakerId);
  if (speakerId && CHARACTER_CATALOG[speakerId] && !hasSpeaker && baseList.length < 4) {
    baseList.push({ id: speakerId });
  }

  return baseList.map((raw, idx) => {
    const id = snapChar(raw?.id || raw, idx === 0 ? 'marcus' : 'claire', poolChars);
    const charSpec = CHARACTER_CATALOG[id] || {};
    const inferred = inferActorVisualsFromLines(id, charSpec, textLines);
    const outfit = snapOutfitId(raw?.outfit || inferred.outfit, 'default');
    const explicitProp = raw?.prop !== undefined ? snapPropId(raw.prop, null) : null;
    const prop = explicitProp ?? inferred.prop ?? null;
    const desiredPose = raw?.pose || inferred.pose;
    let at = raw?.at || inferred.at || (desiredPose === 'lie_bed' ? 'bed_left' : null);
    if (!at && tpl.includes('bedroom') && desiredPose === 'lie_bed') at = 'bed_left';
    const lm = resolveLandmark(tpl, at, idx);
    const pose = snapPoseId(desiredPose || lm.defaultPose, 'stand');
    return {
      id,
      outfit,
      prop,
      pose,
      at: at || lm.landmark || null,
      x: Math.max(26, Math.min(454, Number(raw?.x ?? lm.x))),
      y: Math.max(130, Math.min(260, Number(raw?.y ?? lm.y))),
      facing: Number(raw?.facing ?? lm.facing ?? (idx % 2 === 0 ? 1 : -1)) >= 0 ? 1 : -1,
      condition: CONSEQUENCE_STATUSES.has(raw?.condition) ? raw.condition : 'intact',
    };
  });
}

export function normalizeStageProps(rawProps, sceneId, textLines = []) {
  const tpl = SCENE_CATALOG[sceneId]?.tpl || 'default';
  const out = [];
  if (Array.isArray(rawProps)) {
    rawProps.slice(0, 8).forEach((p, idx) => {
      if (p && typeof p === 'object') {
        const lm = p.at ? resolveLandmark(tpl, p.at, idx) : resolveLandmark(tpl, 'evidence_spot', idx);
        out.push({
          id: snapStagePropId(p.id, 'evidence_marker'),
          x: Math.max(24, Math.min(456, Number(p.x ?? lm.x))),
          y: Math.max(90, Math.min(260, Number(p.y ?? lm.y))),
        });
      } else if (p) {
        out.push(snapStagePropId(p, 'evidence_marker'));
      }
    });
  }
  const joined = textLines.join(' ').toLowerCase();
  if (!out.length && /\bevidence bag\b/.test(joined)) {
    const spot = resolveLandmark(tpl, 'evidence_spot', 0);
    out.push({ id: 'evidence_bag', x: spot.x, y: spot.y });
  }
  return out;
}

export function normalizeTimeline(rawTimeline, actors, stageProps, textLines = [], speakerId = 'claire', speakerMood = 'calm') {
  if (Array.isArray(rawTimeline) && rawTimeline.length) {
    return rawTimeline.slice(0, 10).map((c) => {
      const type = String(c?.type || 'pose');
      if (type === 'move') return { type: 'move', actorId: snapChar(c.actorId, actors[0]?.id), to: Array.isArray(c.to) ? c.to : null, at: c.at || null, speed: c.speed === 'run' ? 'run' : 'walk', poseAfter: snapPoseId(c.poseAfter, 'stand'), facing: c.facing };
      if (type === 'pickup') return { type: 'pickup', actorId: snapChar(c.actorId, actors[0]?.id), prop: snapPropId(c.prop, 'evidence_bag'), x: c.x, y: c.y };
      if (type === 'speak') return { type: 'speak', speakerId: snapChar(c.speakerId, speakerId), mood: String(c.mood || speakerMood), line: String(c.line || ''), durationMs: Number(c.durationMs || 650) };
      if (type === 'fire') return { type: 'fire', shooterId: snapChar(c.shooterId, 'marcus'), targetId: c.targetId ? snapChar(c.targetId, null) : null, to: Array.isArray(c.to) ? c.to : null, weapon: snapPropId(c.weapon, 'pistol'), outcome: String(c.outcome || 'graze'), sfx: 'shot', durationMs: Number(c.durationMs || 260) };
      if (type === 'fx') return { type: 'fx', kind: String(c.kind || 'flash'), x: c.x, y: c.y, intensity: c.intensity, durationMs: Number(c.durationMs || 220) };
      return { type: 'pose', actorId: snapChar(c.actorId, actors[0]?.id), pose: snapPoseId(c.pose, 'stand'), outfit: c.outfit ? snapOutfitId(c.outfit) : undefined, prop: c.prop !== undefined ? snapPropId(c.prop, null) : undefined, durationMs: Number(c.durationMs || 220) };
    });
  }
  const cues = [];
  if (actors[0]) {
    cues.push({ type: 'pose', actorId: actors[0].id, pose: actors[0].pose, outfit: actors[0].outfit, prop: actors[0].prop, durationMs: 180 });
  }
  const firstProp = stageProps.find((p) => p && typeof p === 'object' && p.id === 'evidence_bag');
  if (firstProp && actors[0]) {
    cues.push({ type: 'pickup', actorId: actors[0].id, prop: firstProp.id, x: firstProp.x, y: firstProp.y });
  }
  const leadLine = textLines[0] || '';
  cues.push({ type: 'speak', speakerId: snapChar(speakerId, actors[0]?.id || 'claire'), mood: speakerMood || 'calm', line: leadLine, durationMs: 650 });
  return cues;
}

export function normalizeActionTimeline(rawAction, actors = []) {
  if (Array.isArray(rawAction?.timeline) && rawAction.timeline.length) {
    return normalizeTimeline(rawAction.timeline, actors, [], [], actors[0]?.id || 'marcus', 'calm');
  }
  const txt = `${rawAction?.command || ''} ${rawAction?.label || ''} ${rawAction?.log || ''}`;
  const lead = actors.find((a) => String(a.id).startsWith('marcus'))?.id || actors[0]?.id || 'marcus';
  const foe = actors.find((a) => !String(a.id).startsWith('marcus') && !String(a.id).startsWith('claire'))?.id || actors[1]?.id || null;
  const cues = [];
  if (/bend|pick\s*up|grab|bag\s+the/i.test(txt)) {
    cues.push({ type: 'pickup', actorId: lead, prop: snapPropId(txt, 'evidence_bag') || 'evidence_bag' });
  }
  if (/fire|shoot|gunshot|opens fire|shot at/i.test(txt)) {
    const outcome = /dead|fatal|kills|headshot/i.test(txt) ? 'fatal' : /leg|knee|hospital/i.test(txt) ? 'wounded_leg' : 'graze';
    cues.push({ type: 'fire', shooterId: lead, targetId: foe, weapon: snapPropId(txt, 'pistol') || 'pistol', outcome, sfx: 'shot', durationMs: 260 });
  } else if (/cuff|arrest/i.test(txt)) {
    cues.push({ type: 'pose', actorId: lead, pose: 'cuff', prop: 'handcuffs', durationMs: 260 });
  }
  return cues.length ? cues : null;
}

export function normalizeActionConsequence(rawAction, actors = []) {
  const c = rawAction?.consequence;
  if (c && typeof c === 'object') {
    return {
      targetId: snapChar(c.targetId, 'marcus'),
      status: CONSEQUENCE_STATUSES.has(c.status) ? c.status : 'intact',
      shooterId: c.shooterId ? snapChar(c.shooterId, null) : null,
      weapon: c.weapon ? snapPropId(c.weapon, 'pistol') : null,
      outfit: c.outfit ? snapOutfitId(c.outfit) : null,
      prop: c.prop !== undefined ? snapPropId(c.prop, null) : undefined,
    };
  }
  const txt = `${rawAction?.log || ''} ${rawAction?.failReason || ''}`;
  const foe = actors.find((a) => !String(a.id).startsWith('marcus') && !String(a.id).startsWith('claire'))?.id || null;
  if (/\b(shot in the leg|knee wound|wounded_leg|hospitalized)\b/i.test(txt) && foe) {
    return { targetId: foe, status: 'wounded_leg' };
  }
  if (/\b(falls fatally|drops dead|killed on the spot)\b/i.test(txt) && foe) {
    return { targetId: foe, status: 'dead' };
  }
  return null;
}
