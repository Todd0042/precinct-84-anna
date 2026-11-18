import { PAL, hexAlpha } from './svga-palette.js';
import { drawAnatomicalActor } from './anatomy-actor.js';
import { drawPortraitCutIn } from './portrait-painter.js';
import { drawPropLayer, drawSvgaLightbar } from './scene-props.js';
import { TEMPLATES_A } from './scene-templates-a.js';
import { TEMPLATES_B } from './scene-templates-b.js';
import { SCENE_CATALOG } from '../assets/scene-catalog.js';
import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import { TIER_OPTIONS } from '../engine/mode-select.js';
import { getModelShortLabel } from '../engine/anna-ai.js';
import { defaultStageDirector } from './stage-director.js';

const ALL_TEMPLATES = { ...TEMPLATES_A, ...TEMPLATES_B };

function drawWeatherOverlay(ctx, weather, tick) {
  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(130, 175, 235, 0.48)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 65; i++) {
      const rx = (i * 37 + tick * 9) % 480;
      const ry = (i * 29 + tick * 17) % 268;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 5, ry + 11);
    }
    ctx.stroke();
  } else if (weather === 'fog' || weather === 'smoke') {
    ctx.fillStyle = weather === 'smoke' ? 'rgba(40, 48, 62, 0.28)' : 'rgba(92, 114, 150, 0.2)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 86 + tick * 2) % 520 - 20, 196 + (i % 3) * 18, 72, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCockpitFrame(ctx, state, tick) {
  const wiper = Math.sin(tick * 0.55);
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, 480, 12);
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(36, 12);
  ctx.lineTo(58, 178);
  ctx.lineTo(0, 178);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(444, 12);
  ctx.lineTo(480, 12);
  ctx.lineTo(480, 178);
  ctx.lineTo(422, 178);
  ctx.closePath();
  ctx.fill();

  // Rearview mirror & strobes
  ctx.fillStyle = '#0e1118';
  ctx.fillRect(200, 14, 80, 16);
  ctx.strokeStyle = PAL.STEEL_LIT;
  ctx.strokeRect(200, 14, 80, 16);
  if (state.flags?.lightsOn) {
    drawSvgaLightbar(ctx, 218, 4, 44, tick);
    ctx.fillStyle = tick % 4 < 2 ? PAL.RED_STROBE : PAL.BLUE_STROBE;
    ctx.fillRect(208, 18, 64, 7);
  }

  // Wipers
  ctx.strokeStyle = '#0b0d14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(132, 178);
  ctx.lineTo(164 + wiper * 58, 92);
  ctx.moveTo(286, 178);
  ctx.lineTo(318 + wiper * 58, 92);
  ctx.stroke();

  // Dashboard
  ctx.fillStyle = '#11141e';
  ctx.fillRect(0, 176, 480, 94);
  ctx.fillStyle = PAL.STEEL_DARK;
  ctx.fillRect(0, 176, 480, 5);

  // Speedometer binnacle + Motorola Radio
  ctx.fillStyle = PAL.VOID;
  ctx.fillRect(74, 190, 134, 44);
  ctx.strokeStyle = PAL.STEEL_MID;
  ctx.strokeRect(74, 190, 134, 44);
  const spd = state.scene !== 'pursuit_active' ? '00' : state.pursuitStage === 0 ? '75' : state.pursuitStage === 1 ? '85' : state.pursuitStage === 2 ? '95' : '25';
  ctx.fillStyle = PAL.EMERALD;
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`${spd} MPH`, 92, 218);

  ctx.fillStyle = PAL.WALL_LIGHT;
  ctx.fillRect(236, 192, 128, 50);
  ctx.fillStyle = PAL.VOID;
  ctx.fillRect(244, 198, 112, 36);
  ctx.fillStyle = PAL.NEON_CYAN;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(state.flags?.called1080 ? 'CH-1: 10-80' : 'CH-1: 10-8', 252, 222);

  // Steering wheel rim & Claire passenger figure foreground
  ctx.strokeStyle = PAL.STEEL_LIT;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(140, 266, 36, Math.PI, 0);
  ctx.stroke();
  drawAnatomicalActor(ctx, 418, 286, CHARACTER_CATALOG.claire, { scale: 1.35, facing: -1, tick });
}

function drawBallisticsOverlay(ctx, director) {
  for (const pt of director.getParticles()) {
    const alpha = Math.max(0.1, 1 - pt.life / pt.maxLife);
    ctx.fillStyle = pt.color || PAL.FLAME_YELLOW;
    ctx.globalAlpha = alpha;
    if (pt.kind === 'muzzle') {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7 * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.kind === 'casing') {
      ctx.fillRect(pt.x, pt.y, 3, 1.5);
    } else {
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  for (const proj of director.getProjectiles()) {
    const x = proj.x0 + (proj.x1 - proj.x0) * proj.progress;
    const y = proj.y0 + (proj.y1 - proj.y0) * proj.progress;
    const tx = proj.x0 + (proj.x1 - proj.x0) * Math.max(0, proj.progress - 0.25);
    const ty = proj.y0 + (proj.y1 - proj.y0) * Math.max(0, proj.progress - 0.25);
    ctx.strokeStyle = PAL.FLAME_YELLOW;
    ctx.lineWidth = proj.weapon === 'shotgun' ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = PAL.WHITE_SHIRT;
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
}

export function drawSvgaScene(ctx, state, tick = 0, opts = {}) {
  const beat = opts.activeBeat || null;
  const director = opts.director || defaultStageDirector;
  director.syncBeatStage(state, beat);

  const sceneId = beat?.sceneId || state.intermission?.sceneId || state.scene || 'precinct_briefing';
  const entry = SCENE_CATALOG[sceneId] || SCENE_CATALOG.precinct_briefing;
  const renderFn = ALL_TEMPLATES[entry.tpl] || TEMPLATES_A.precinct_briefing;

  const shake = director.getCameraShake();
  const sx = shake.ms > 0 ? (Math.sin(tick * 3.1) * shake.intensity) : 0;
  const sy = shake.ms > 0 ? (Math.cos(tick * 2.7) * shake.intensity * 0.6) : 0;

  ctx.clearRect(0, 0, 480, 270);
  ctx.save();
  ctx.translate(sx, sy);
  renderFn(ctx, state, tick);

  for (const p of director.getStageProps()) {
    drawPropLayer(ctx, p, tick, state);
  }

  const stageActors = [...director.getActors()].sort((a, b) => a.y - b.y);
  for (const act of stageActors) {
    const spec = CHARACTER_CATALOG[act.id];
    if (!spec) continue;
    drawAnatomicalActor(ctx, act.x, act.y, spec, { ...act, tick });
  }

  drawBallisticsOverlay(ctx, director);
  drawWeatherOverlay(ctx, beat?.weather || entry.weather, tick);
  if (entry.cockpit) drawCockpitFrame(ctx, state, tick);
  ctx.restore();

  // Expressive 96x96 Talking-Head Portrait Cut-in with matching outfit & smoking prop
  const spk = director.getActiveSpeaker();
  const speakerId = beat?.speakerId || state.intermission?.speakerId || spk?.id || opts.lastSpeakerId;
  if (speakerId && CHARACTER_CATALOG[speakerId]) {
    const stageSpeaker = stageActors.find((a) => a.id === speakerId);
    drawPortraitCutIn(ctx, 372, 10, 96, CHARACTER_CATALOG[speakerId], beat?.speakerMood || spk?.mood || 'calm', tick, {
      outfit: stageSpeaker?.outfit,
      prop: stageSpeaker?.prop,
    });
  }

  // Game Over Overlay Banner
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(18, 4, 8, 0.82)';
    ctx.fillRect(36, 46, 408, 178);
    ctx.strokeStyle = tick % 4 < 2 ? PAL.AMBER : PAL.WHITE_SHIRT;
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 46, 408, 178);
    ctx.fillStyle = PAL.RED_DEEP;
    ctx.fillRect(42, 52, 396, 36);
    ctx.fillStyle = PAL.WHITE_SHIRT;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`PROCEDURAL VIOLATION — ${state.gameOver.citation || 'CODE 84'}`, 56, 76);
    ctx.fillStyle = PAL.AMBER;
    ctx.font = '13px monospace';
    ctx.fillText(String(state.gameOver.reason || '').slice(0, 52), 56, 128);
    ctx.fillStyle = PAL.NEON_CYAN;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('PRESS [F9] OR TYPE "UNDO" TO REWIND CLEANLY', 56, 188);
  }
  if (opts.aiProgress?.active) drawSvgaProgressOverlay(ctx, opts.aiProgress, tick);
}

export function drawSvgaProgressOverlay(ctx, prog, tick = 0) {
  ctx.fillStyle = 'rgba(7, 10, 22, 0.9)';
  ctx.fillRect(44, 198, 392, 56);
  ctx.strokeStyle = PAL.NEON_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 198, 392, 56);
  ctx.fillStyle = PAL.NEON_CYAN;
  ctx.font = 'bold 12px monospace';
  const sec = ((prog.elapsedMs || 0) / 1000).toFixed(1);
  ctx.fillText(`ANNA AI: ${String(prog.stage || 'WORKING').toUpperCase()} (${sec}s • ${prog.chars || 0}B)`, 58, 218);
  ctx.fillStyle = PAL.STEEL_DARK;
  ctx.fillRect(58, 228, 364, 12);
  const scanX = 58 + ((tick * 24) % 284);
  ctx.fillStyle = PAL.AMBER;
  ctx.fillRect(scanX, 228, 80, 12);
}

export function drawSvgaModeSelect(ctx, state, tick, { coverImg = null, catalog = null, tierSaves = {}, aiProgress = null } = {}) {
  ctx.clearRect(0, 0, 480, 270);
  if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
    ctx.drawImage(coverImg, 0, 0, 480, 270);
    ctx.fillStyle = 'rgba(7, 9, 18, 0.62)';
    ctx.fillRect(0, 0, 480, 270);
  } else {
    drawSkyAndCity(ctx, 130, tick);
  }

  // Title Header
  ctx.fillStyle = 'rgba(7, 9, 18, 0.88)';
  ctx.fillRect(0, 0, 480, 34);
  ctx.fillStyle = PAL.AMBER;
  ctx.font = 'bold 15px monospace';
  ctx.fillText('PRECINCT 84: SELECT AI TIER & MODEL', 74, 22);

  // 3 Portrait Cards (click rects returned cleanly)
  const hitboxes = [];
  const activeTier = state.aiTier || 1;
  const xs = [16, 168, 320];
  const portraits = ['claire', 'eddie', 'raincoat_man'];

  for (let i = 0; i < TIER_OPTIONS.length; i++) {
    const opt = TIER_OPTIONS[i];
    const x = xs[i];
    const selected = opt.tier === activeTier;
    ctx.fillStyle = selected ? 'rgba(18, 40, 92, 0.92)' : 'rgba(11, 15, 28, 0.85)';
    ctx.fillRect(x, 46, 144, 158);
    ctx.strokeStyle = selected ? (tick % 4 < 2 ? PAL.AMBER : PAL.WHITE_SHIRT) : PAL.STEEL_MID;
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeRect(x, 46, 144, 158);

    ctx.fillStyle = PAL.WHITE_SHIRT;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`TIER ${opt.tier}: ${opt.title}`, x + 10, 64);

    drawPortraitCutIn(ctx, x + 32, 72, 80, CHARACTER_CATALOG[portraits[i]], selected ? 'smirk' : 'calm', tick);

    if (opt.tier >= 2) {
      const fullMode = state.storyGenMode === 'full';
      ctx.fillStyle = fullMode ? 'rgba(56, 220, 120, 0.2)' : 'rgba(56, 240, 255, 0.16)';
      ctx.fillRect(x + 12, 162, 120, 15);
      ctx.strokeStyle = fullMode ? PAL.EMERALD : PAL.NEON_CYAN;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 12, 162, 120, 15);
      ctx.fillStyle = fullMode ? PAL.EMERALD : PAL.NEON_CYAN;
      ctx.font = 'bold 9px monospace';
      const label = opt.tier === 2
        ? (fullMode ? 'GEN: FULL 3-ACT' : 'GEN: 1-BY-1')
        : (fullMode ? 'GEN: FULL CASE' : 'GEN: 1-CH EPISODE');
      ctx.fillText(label, x + 19, 173);
      hitboxes.push({ x0: x + 12, y0: 162, x1: x + 132, y1: 177, action: `toggle_gen_mode:${opt.tier}` });
    }

    const saveMeta = tierSaves[opt.tier];
    ctx.fillStyle = saveMeta?.hasProgress ? PAL.EMERALD : saveMeta?.hasVault ? PAL.NEON_CYAN : PAL.STEEL_LIT;
    ctx.font = 'bold 10px monospace';
    const statusStr = saveMeta?.hasProgress
      ? `SAVE: ${saveMeta.score || 0} PTS`
      : saveMeta?.hasVault
        ? 'STORY READY'
        : 'NEW SHIFT READY';
    ctx.fillText(statusStr, x + 16, 192);
    hitboxes.push({ x0: x, y0: 46, x1: x + 144, y1: 204, action: `tier:${opt.tier}` });
  }

  // Delete Save (left of LLM selector) + Model selector strip + Start/Resume button
  const activeSave = tierSaves[activeTier] || null;
  ctx.fillStyle = activeSave ? 'rgba(72, 18, 28, 0.94)' : 'rgba(14, 18, 30, 0.78)';
  ctx.fillRect(16, 218, 78, 34);
  ctx.strokeStyle = activeSave ? PAL.CRIMSON : PAL.STEEL_DARK;
  ctx.lineWidth = activeSave ? 2 : 1;
  ctx.strokeRect(16, 218, 78, 34);
  ctx.fillStyle = activeSave ? '#ff949e' : PAL.STEEL_MID;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(activeSave ? 'DEL SAVE' : 'NO SAVE', activeSave ? 27 : 29, 239);
  ctx.lineWidth = 1;
  if (activeSave) hitboxes.push({ x0: 16, y0: 218, x1: 94, y1: 252, action: 'delete_save' });

  ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
  ctx.fillRect(98, 218, 26, 34);
  ctx.strokeStyle = PAL.NEON_CYAN;
  ctx.strokeRect(98, 218, 26, 34);
  ctx.fillStyle = PAL.WHITE_SHIRT;
  ctx.font = 'bold 16px monospace';
  ctx.fillText('<', 106, 240);
  hitboxes.push({ x0: 98, y0: 218, x1: 124, y1: 252, action: 'prev_model' });

  ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
  ctx.fillRect(128, 218, 174, 34);
  ctx.strokeStyle = PAL.STEEL_MID;
  ctx.strokeRect(128, 218, 174, 34);
  ctx.fillStyle = PAL.NEON_CYAN;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`MODEL: ${getModelShortLabel(catalog, state.aiModel)}`.slice(0, 22), 134, 239);
  hitboxes.push({ x0: 128, y0: 218, x1: 302, y1: 252, action: 'next_model' });

  ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
  ctx.fillRect(306, 218, 26, 34);
  ctx.strokeStyle = PAL.NEON_CYAN;
  ctx.strokeRect(306, 218, 26, 34);
  ctx.fillStyle = PAL.WHITE_SHIRT;
  ctx.font = 'bold 16px monospace';
  ctx.fillText('>', 314, 240);
  hitboxes.push({ x0: 306, y0: 218, x1: 332, y1: 252, action: 'next_model' });

  ctx.fillStyle = activeSave?.hasProgress ? PAL.EMERALD : activeSave?.hasVault ? PAL.NEON_CYAN : PAL.EMERALD;
  ctx.fillRect(340, 218, 124, 34);
  ctx.fillStyle = PAL.VOID;
  ctx.font = 'bold 12px monospace';
  const goLabel = activeSave?.hasProgress ? 'RESUME [ENTER]' : activeSave?.hasVault ? 'REPLAY [ENTER]' : 'START [ENTER]';
  ctx.fillText(goLabel, activeSave ? 348 : 352, 239);
  hitboxes.push({ x0: 340, y0: 218, x1: 464, y1: 252, action: 'start_shift' });

  if (aiProgress?.active) drawSvgaProgressOverlay(ctx, aiProgress, tick);
  return hitboxes;
}
