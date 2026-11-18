import { SCENE_CATALOG } from '../assets/scene-catalog.js';
import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import { resolveLandmark } from '../assets/outfit-prop-catalog.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function normalizeStageProp(p, idx, tpl) {
  if (p && typeof p === 'object') {
    const spot = p.at ? resolveLandmark(tpl, p.at, idx) : null;
    return { id: String(p.id || 'evidence_marker'), x: clamp(Number(p.x ?? spot?.x ?? 240), 24, 456), y: clamp(Number(p.y ?? spot?.y ?? 240), 80, 260) };
  }
  return { id: String(p), x: null, y: null };
}

function normalizeStageActor(raw, idx, tpl, storyState) {
  const isArr = Array.isArray(raw);
  const id = isArr ? raw[0] : (raw?.id || raw);
  const lm = !isArr && raw?.at ? resolveLandmark(tpl, raw.at, idx) : resolveLandmark(tpl, null, idx);
  const extra = isArr ? (raw[4] || {}) : (raw || {});
  const x = clamp(Number(isArr ? raw[1] : (raw?.x ?? lm.x)), 26, 454);
  const y = clamp(Number(isArr ? raw[2] : (raw?.y ?? lm.y)), 130, 260);
  const facing = Number(isArr ? (raw[3] ?? 1) : (raw?.facing ?? lm.facing ?? (idx % 2 === 0 ? 1 : -1))) >= 0 ? 1 : -1;
  const deadInStory = storyState?.casualties?.includes(id);
  const injury = storyState?.injuries?.[id] || extra.condition || 'intact';
  return {
    id,
    x,
    y,
    facing,
    pose: deadInStory ? 'down' : (extra.pose || lm.defaultPose || 'stand'),
    outfit: extra.outfit || storyState?.outfits?.[id] || 'default',
    prop: extra.prop || storyState?.props?.[id] || (extra.rossiBox ? 'rossi_box' : extra.umbrella ? 'umbrella' : null),
    scale: Number(extra.scale || 1),
    mood: extra.mood || 'calm',
    condition: deadInStory ? 'dead' : injury,
    walkCycle: 0,
    umbrella: Boolean(extra.umbrella),
  };
}

export function createStageDirector() {
  let lastBeatKey = null;
  let lastActionKey = null;
  let actors = [];
  let stageProps = [];
  let timeline = [];
  let cueIdx = 0;
  let cueElapsedMs = 0;
  let cueState = null;
  let projectiles = [];
  let particles = [];
  let cameraShake = { ms: 0, intensity: 0 };
  let activeSpeaker = null;
  let activeTpl = 'default';

  function applyFireImpact(targetId, outcome, tx, ty) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        kind: outcome === 'cover_hit' || outcome === 'miss' ? 'spark' : 'flash',
        x: tx,
        y: ty,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -Math.random() * 0.1,
        life: 0,
        maxLife: 260,
        color: outcome === 'cover_hit' || outcome === 'miss' ? '#ffe07d' : '#ff4c58',
      });
    }
    const target = actors.find((a) => a.id === targetId);
    if (!target) return;
    if (outcome === 'fatal' || outcome === 'dead') {
      target.pose = 'down';
      target.condition = 'dead';
    } else if (outcome === 'wounded_leg' || outcome === 'wounded_arm' || outcome === 'hospitalized') {
      target.pose = 'kneel';
      target.condition = outcome;
    } else if (outcome === 'graze') {
      target.pose = 'hit';
      target.condition = 'grazed';
    } else {
      target.pose = 'crouch';
    }
  }

  function advanceCue() {
    cueIdx += 1;
    cueElapsedMs = 0;
    cueState = null;
  }

  function stepCue(cue, dtMs, onSfx) {
    if (!cue) return;
    if (!cueState) cueState = {};
    cueElapsedMs += dtMs;

    if (cue.type === 'move') {
      const actor = actors.find((a) => a.id === cue.actorId);
      if (!actor) return advanceCue();
      const lm = cue.at ? resolveLandmark(activeTpl, cue.at, 0) : null;
      const toX = clamp(Number(cue.to?.[0] ?? lm?.x ?? actor.x), 26, 454);
      const toY = clamp(Number(cue.to?.[1] ?? lm?.y ?? actor.y), 130, 260);
      const dx = toX - actor.x;
      const dy = toY - actor.y;
      const dist = Math.hypot(dx, dy);
      const spd = (cue.speed === 'run' ? 0.22 : 0.12) * dtMs;
      if (dist <= spd + 1.5) {
        actor.x = toX;
        actor.y = toY;
        if (cue.facing) actor.facing = cue.facing >= 0 ? 1 : -1;
        actor.pose = cue.poseAfter || (lm?.defaultPose || 'stand');
        return advanceCue();
      }
      if (Math.abs(dx) > 1) actor.facing = dx >= 0 ? 1 : -1;
      actor.pose = cue.speed === 'run' ? 'run' : 'walk';
      actor.walkCycle += dtMs * (cue.speed === 'run' ? 0.025 : 0.015);
      actor.x += (dx / dist) * spd;
      actor.y += (dy / dist) * spd;
    } else if (cue.type === 'pickup') {
      const actor = actors.find((a) => a.id === cue.actorId);
      if (!actor) return advanceCue();
      const idx = stageProps.findIndex((p) => !cue.prop || p.id === cue.prop);
      const propObj = idx >= 0 ? stageProps[idx] : null;
      const tx = Number(cue.x ?? propObj?.x ?? actor.x + actor.facing * 24);
      const ty = Number(cue.y ?? propObj?.y ?? actor.y);
      const dx = tx - actor.x;
      if (!cueState.picking && Math.abs(dx) > 18) {
        actor.facing = dx >= 0 ? 1 : -1;
        actor.pose = 'walk';
        actor.walkCycle += dtMs * 0.015;
        actor.x += Math.sign(dx) * Math.min(Math.abs(dx), 0.13 * dtMs);
        return;
      }
      if (!cueState.picking) {
        cueState.picking = true;
        cueState.pickMs = 0;
      }
      actor.pose = 'bend_pickup';
      cueState.pickMs += dtMs;
      if (cueState.pickMs >= 280) {
        if (idx >= 0) stageProps.splice(idx, 1);
        if (cue.prop) actor.prop = cue.prop;
        actor.pose = 'stand';
        advanceCue();
      }
    } else if (cue.type === 'pose') {
      const actor = actors.find((a) => a.id === cue.actorId);
      if (actor) {
        if (cue.pose) actor.pose = cue.pose;
        if (cue.outfit) actor.outfit = cue.outfit;
        if (cue.prop !== undefined) actor.prop = cue.prop;
        if (cue.facing) actor.facing = cue.facing >= 0 ? 1 : -1;
      }
      if (cueElapsedMs >= Number(cue.durationMs ?? 220)) advanceCue();
    } else if (cue.type === 'speak') {
      const spk = actors.find((a) => a.id === cue.speakerId);
      activeSpeaker = { id: cue.speakerId, mood: cue.mood || 'calm' };
      if (spk && cueElapsedMs <= dtMs) {
        spk.mood = cue.mood || spk.mood;
        if (spk.prop === 'cigarette' || spk.prop === 'cigar') spk.pose = 'smoke';
        else if (spk.prop === 'coffee_cup' || spk.prop === 'whiskey_glass') spk.pose = 'sip';
        else if (spk.pose === 'stand') spk.pose = 'talk_gesture';
      }
      if (cueElapsedMs >= Number(cue.durationMs ?? 700)) advanceCue();
    } else if (cue.type === 'fire') {
      if (!cueState.fired) {
        cueState.fired = true;
        const shooter = actors.find((a) => a.id === cue.shooterId) || actors[0];
        const target = actors.find((a) => a.id === cue.targetId);
        const tx = Number(target?.x ?? cue.to?.[0] ?? (shooter ? shooter.x + shooter.facing * 140 : 320));
        const outcome = cue.outcome || 'graze';
        const ty = Number(target ? target.y - (outcome === 'wounded_leg' ? 14 : 38) : (cue.to?.[1] ?? 210));
        if (shooter) {
          shooter.facing = tx >= shooter.x ? 1 : -1;
          shooter.pose = 'shoot';
          shooter.prop = cue.weapon || shooter.prop || 'pistol';
          const mx = shooter.x + shooter.facing * 22;
          const my = shooter.y - 42;
          particles.push({ kind: 'muzzle', x: mx, y: my, vx: 0, vy: 0, life: 0, maxLife: 140, color: '#fff080' });
          particles.push({ kind: 'casing', x: shooter.x + shooter.facing * 6, y: my, vx: -shooter.facing * 0.04, vy: -0.07, life: 0, maxLife: 360, color: '#e6b84c' });
          projectiles.push({ x0: mx, y0: my, x1: tx, y1: ty, progress: 0, weapon: cue.weapon || 'pistol', targetId: target?.id || null, outcome });
        }
        cameraShake = { ms: 220, intensity: 3.2 };
        if (typeof onSfx === 'function') onSfx(cue.sfx || 'shot');
      }
      if (cueElapsedMs >= Number(cue.durationMs ?? 260)) advanceCue();
    } else if (cue.type === 'fx') {
      if (!cueState.triggered) {
        cueState.triggered = true;
        if (cue.kind === 'shake') cameraShake = { ms: 260, intensity: Number(cue.intensity || 3.5) };
        else particles.push({ kind: cue.kind || 'flash', x: Number(cue.x ?? 240), y: Number(cue.y ?? 200), vx: 0, vy: 0, life: 0, maxLife: 240, color: '#ffe484' });
      }
      if (cueElapsedMs >= Number(cue.durationMs ?? 200)) advanceCue();
    } else {
      advanceCue();
    }
  }

  function syncBeatStage(state, activeBeat = null) {
    if (!state) return;
    const sceneId = activeBeat?.sceneId || state.intermission?.sceneId || state.scene || 'precinct_briefing';
    const entry = SCENE_CATALOG[sceneId] || SCENE_CATALOG.precinct_briefing;
    activeTpl = entry.tpl || 'default';
    const beatKey = `${sceneId}|${activeBeat?.id || ''}|${state.intermission?.transitionKey || ''}|${state.aiCampaign?.chapterIdx || 0}|${state.turn || 0 === 0 ? '0' : 'p'}`;
    const baseBeatKey = `${sceneId}|${activeBeat?.id || ''}|${state.intermission?.transitionKey || ''}|${state.aiCampaign?.chapterIdx || 0}`;

    if (baseBeatKey !== lastBeatKey) {
      lastBeatKey = baseBeatKey;
      const storyState = state.aiCampaign?.storyState || {};
      const inter = state.intermission;
      const rawActors = (Array.isArray(inter?.actors) && inter.actors.length && inter.actors)
        || (Array.isArray(activeBeat?.actors) && activeBeat.actors.length && activeBeat.actors)
        || entry.actors
        || [['marcus', 136, 238, 1], ['claire', 260, 238, -1]];
      actors = rawActors
        .map((a, idx) => normalizeStageActor(a, idx, activeTpl, storyState))
        .filter((a) => CHARACTER_CATALOG[a.id]);
      const rawProps = [...(entry.props || []), ...(activeBeat?.stageProps || activeBeat?.props || []), ...(inter?.stageProps || [])];
      stageProps = rawProps.map((p, idx) => normalizeStageProp(p, idx, activeTpl));
      timeline = Array.isArray(activeBeat?.timeline) ? [...activeBeat.timeline] : Array.isArray(inter?.timeline) ? [...inter.timeline] : [];
      cueIdx = 0;
      cueElapsedMs = 0;
      cueState = null;
      projectiles = [];
      particles = [];
      cameraShake = { ms: 0, intensity: 0 };
      const spkId = activeBeat?.speakerId || inter?.speakerId || actors[0]?.id || null;
      activeSpeaker = spkId ? { id: spkId, mood: activeBeat?.speakerMood || inter?.speakerMood || 'calm' } : null;
    }

    if (state.lastActionTimelineId && state.lastActionTimelineId !== lastActionKey && Array.isArray(state.lastActionTimeline)) {
      lastActionKey = state.lastActionTimelineId;
      timeline = [...state.lastActionTimeline];
      cueIdx = 0;
      cueElapsedMs = 0;
      cueState = null;
    }
    return beatKey;
  }

  function stepOne(dt, onSfx = null) {
    if (cameraShake.ms > 0) cameraShake.ms = Math.max(0, cameraShake.ms - dt);
    const keepProj = [];
    for (const p of projectiles) {
      p.progress += dt / 130;
      if (p.progress >= 1) applyFireImpact(p.targetId, p.outcome, p.x1, p.y1);
      else keepProj.push(p);
    }
    projectiles = keepProj;

    const keepPart = [];
    for (const pt of particles) {
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'casing') pt.vy += 0.0004 * dt;
      if (pt.life < pt.maxLife) keepPart.push(pt);
    }
    particles = keepPart;

    if (cueIdx < timeline.length) stepCue(timeline[cueIdx], dt, onSfx);
  }

  function step(dtMs = 45, onSfx = null) {
    let rem = Math.max(8, Math.min(250, Number(dtMs) || 45));
    while (rem > 0) {
      const slice = Math.min(40, rem);
      stepOne(slice, onSfx);
      rem -= slice;
    }
  }

  function skipToEnd() {
    let guard = 0;
    while ((cueIdx < timeline.length || projectiles.length > 0) && guard < 120) {
      step(100, null);
      guard += 1;
    }
  }

  return {
    syncBeatStage,
    step,
    skipToEnd,
    getActors: () => actors,
    getStageProps: () => stageProps,
    getProjectiles: () => projectiles,
    getParticles: () => particles,
    getCameraShake: () => cameraShake,
    getActiveSpeaker: () => activeSpeaker,
  };
}

export const defaultStageDirector = createStageDirector();
