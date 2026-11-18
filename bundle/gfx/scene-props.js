import { PAL } from './svga-palette.js';
export { drawHeldProp } from './held-props.js';

export function drawSvgaLightbar(ctx, x, y, width, tick) {
  const half = width / 2;
  const redHot = tick % 4 < 2;
  ctx.fillStyle = redHot ? PAL.RED_STROBE : PAL.RED_DEEP;
  ctx.fillRect(x, y, half - 1, 5);
  ctx.fillStyle = redHot ? PAL.BLUE_DEEP : PAL.BLUE_STROBE;
  ctx.fillRect(x + half + 1, y, half - 1, 5);
  ctx.fillStyle = PAL.CHROME;
  ctx.fillRect(x + half - 1, y, 2, 5);

  const glowX = redHot ? x + half * 0.45 : x + width - half * 0.45;
  const glowColor = redHot ? 'rgba(255, 52, 68, 0.34)' : 'rgba(52, 136, 255, 0.34)';
  const g = ctx.createRadialGradient(glowX, y + 2, 1, glowX, y + 2, 34);
  g.addColorStop(0, glowColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(glowX - 34, y - 32, 68, 68);
}

export function drawSvgaCruiser(ctx, x, y, tick, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(76, 42, 74, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (1984 Oakridge B&W sedan)
  ctx.fillStyle = '#12151f';
  ctx.beginPath();
  ctx.roundRect(4, 15, 144, 21, 3);
  ctx.fill();
  ctx.fillStyle = '#eceef4';
  ctx.fillRect(46, 15, 62, 21);
  // Cabin roof
  ctx.beginPath();
  ctx.moveTo(34, 15);
  ctx.lineTo(50, 2);
  ctx.lineTo(100, 2);
  ctx.lineTo(116, 15);
  ctx.closePath();
  ctx.fill();
  // Tinted glass
  ctx.fillStyle = '#1b4866';
  ctx.beginPath();
  ctx.moveTo(41, 14);
  ctx.lineTo(53, 4);
  ctx.lineTo(74, 4);
  ctx.lineTo(74, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(78, 4);
  ctx.lineTo(97, 4);
  ctx.lineTo(109, 14);
  ctx.lineTo(78, 14);
  ctx.closePath();
  ctx.fill();

  // Gold crest "84" & bumpers
  ctx.fillStyle = PAL.COP_NAVY;
  ctx.fillRect(70, 20, 14, 10);
  ctx.fillStyle = PAL.GOLD_BADGE;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('84', 72, 28);
  ctx.fillStyle = PAL.CHROME;
  ctx.fillRect(0, 29, 8, 5);
  ctx.fillRect(144, 29, 8, 5);

  // Headlight cone
  if (opts.headlights) {
    const hg = ctx.createLinearGradient(148, 22, 270, 22);
    hg.addColorStop(0, 'rgba(255, 240, 180, 0.45)');
    hg.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(148, 20);
    ctx.lineTo(270, 2);
    ctx.lineTo(270, 48);
    ctx.lineTo(148, 28);
    ctx.closePath();
    ctx.fill();
  }
  if (opts.trunkOpen) {
    ctx.strokeStyle = PAL.CHROME;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 15);
    ctx.lineTo(22, 2);
    ctx.stroke();
  }

  // Wheels + hubcaps
  for (const wx of [30, 120]) {
    ctx.fillStyle = '#0b0d12';
    ctx.beginPath();
    ctx.arc(wx, 36, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.CHROME;
    ctx.beginPath();
    ctx.arc(wx, 36, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (opts.nailAlert && tick % 6 < 3) {
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(120, 36, 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (opts.lightsOn) drawSvgaLightbar(ctx, 56, -4, 38, tick);
  else {
    ctx.fillStyle = PAL.RED_DEEP;
    ctx.fillRect(59, -3, 14, 4);
    ctx.fillStyle = PAL.BLUE_DEEP;
    ctx.fillRect(77, -3, 14, 4);
  }
  ctx.restore();
}

export function drawSvgaMonteCarlo(ctx, x, y, wrecked = false, tick = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#11131c';
  ctx.beginPath();
  ctx.roundRect(2, 13, 138, 20, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(36, 13);
  ctx.lineTo(54, 1);
  ctx.lineTo(98, 1);
  ctx.lineTo(116, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c425e';
  ctx.fillRect(54, 3, 42, 9);
  ctx.fillStyle = PAL.RED_STROBE;
  ctx.fillRect(2, 19, 6, 5);
  ctx.fillStyle = PAL.CHROME;
  ctx.fillRect(0, 27, 8, 4);
  ctx.fillRect(136, 27, 8, 4);
  for (const wx of [28, 112]) {
    ctx.fillStyle = '#090a0e';
    ctx.beginPath();
    ctx.arc(wx, 34, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.CHROME;
    ctx.beginPath();
    ctx.arc(wx, 34, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (wrecked) {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(200, 210, 225, 0.35)';
      ctx.beginPath();
      ctx.arc(128 + i * 5, 4 - ((tick * 2 + i * 6) % 18), 7 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawPropLayer(ctx, propInput, tick = 0, state = {}) {
  const isObj = propInput && typeof propInput === 'object';
  const propId = isObj ? propInput.id : String(propInput || '');
  const px = isObj && typeof propInput.x === 'number' ? propInput.x : null;
  const py = isObj && typeof propInput.y === 'number' ? propInput.y : null;

  if (propId === 'police_tape') {
    const ty = py ?? 224;
    ctx.fillStyle = PAL.AMBER;
    ctx.fillRect(0, ty, 480, 7);
    ctx.fillStyle = '#101218';
    for (let x = 0; x < 480; x += 28) ctx.fillRect(x, ty, 12, 7);
    ctx.font = 'bold 6px monospace';
    for (let x = 14; x < 460; x += 84) ctx.fillText('POLICE LINE', x, ty + 6);
  } else if (propId === 'cash_briefcase') {
    const x = px ?? 202;
    const y = py ?? 162;
    ctx.fillStyle = '#382214';
    ctx.fillRect(x, y, 58, 24);
    ctx.fillStyle = '#246838';
    ctx.fillRect(x + 4, y + 3, 22, 14);
    ctx.fillRect(x + 30, y + 3, 22, 14);
    ctx.strokeStyle = PAL.GOLD_BADGE;
    ctx.strokeRect(x, y, 58, 24);
  } else if (propId === 'whiskey_glasses') {
    const base = px ?? 172;
    const y = py ?? 168;
    for (const gx of [base, base + 14]) {
      ctx.fillStyle = 'rgba(220, 235, 250, 0.35)';
      ctx.fillRect(gx, y, 9, 12);
      ctx.fillStyle = PAL.AMBER;
      ctx.fillRect(gx + 1, y + 6, 7, 5);
    }
  } else if (propId === 'rossi_box') {
    const x = px ?? 142;
    const y = py ?? 166;
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(x, y, 28, 16);
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 28, y + 8);
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + 14, y + 16);
    ctx.stroke();
  } else if (propId === 'incinerator_fire' || propId === 'burn_barrel') {
    const x = px ?? 365;
    const y = py ?? 138;
    ctx.fillStyle = propId === 'burn_barrel' ? '#2c221e' : '#181b22';
    ctx.fillRect(x, y, propId === 'burn_barrel' ? 32 : 62, propId === 'burn_barrel' ? 44 : 92);
    const flicker = (tick % 3) * 4;
    ctx.fillStyle = PAL.FIRE_ORANGE;
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 16, y - 34 - flicker);
    ctx.lineTo(x + 28, y - 16);
    ctx.lineTo(x + 42, y - 36 + flicker);
    ctx.lineTo(x + (propId === 'burn_barrel' ? 28 : 54), y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.FLAME_YELLOW;
    ctx.fillRect(x + 12, y - 18 - flicker * 0.5, 12, 18);
  } else if (propId === 'red_twine_clue') {
    const x = px ?? 220;
    const y = py ?? 245;
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 14, y - 5, x + 26, y + 3);
    ctx.stroke();
  } else if (propId === 'tape_recorder' || propId === 'wiretap_deck') {
    const x = px ?? 184;
    const y = py ?? 152;
    ctx.fillStyle = '#141822';
    ctx.fillRect(x, y, 46, 24);
    ctx.strokeStyle = PAL.STEEL_LIT;
    ctx.strokeRect(x, y, 46, 24);
    for (const rx of [x + 13, x + 33]) {
      ctx.fillStyle = PAL.CHROME;
      ctx.beginPath();
      ctx.arc(rx, y + 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = state.flags?.recorderOn && tick % 2 === 0 ? PAL.RED_STROBE : PAL.RED_DEEP;
    ctx.fillRect(x + 39, y + 3, 4, 4);
  } else {
    drawExtendedStageProp(ctx, propId, px ?? 244, py ?? 240, tick);
  }
}

function drawExtendedStageProp(ctx, propId, x, y, tick) {
  if (propId === 'shell_casings') {
    ctx.fillStyle = PAL.GOLD_BADGE;
    for (const [dx, dy] of [[-8, 2], [-1, 5], [7, 1], [12, 4]]) ctx.fillRect(x + dx, y + dy, 4, 1.8);
  } else if (propId === 'blood_stain') {
    ctx.fillStyle = '#4e0a12';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (propId === 'chalk_outline') {
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x - 18, y - 5, 36, 12);
    ctx.beginPath();
    ctx.arc(x - 22, y + 1, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (propId === 'evidence_marker' || propId === 'barricade_cone') {
    ctx.fillStyle = propId === 'barricade_cone' ? PAL.FIRE_ORANGE : PAL.AMBER;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x + 5, y + 4);
    ctx.closePath();
    ctx.fill();
  } else if (propId === 'broken_glass') {
    ctx.fillStyle = 'rgba(180, 224, 255, 0.58)';
    for (const dx of [-8, -2, 4, 9]) ctx.fillRect(x + dx, y + (dx % 3), 4, 2.5);
  } else if (propId === 'cigarette_butt') {
    ctx.fillStyle = '#eee8df';
    ctx.fillRect(x - 3, y, 6, 2);
    ctx.fillStyle = tick % 4 < 2 ? PAL.FIRE_ORANGE : '#585858';
    ctx.fillRect(x + 3, y, 2, 2);
  } else if (propId === 'dropped_pistol') {
    ctx.fillStyle = PAL.STEEL_LIT;
    ctx.fillRect(x - 6, y, 11, 3);
    ctx.fillStyle = '#181a22';
    ctx.fillRect(x - 6, y + 2, 4, 5);
  } else if (propId === 'evidence_bag' || propId === 'case_dossier' || propId === 'syringe_vial' || propId === 'motel_key') {
    ctx.fillStyle = propId === 'case_dossier' ? '#b89464' : propId === 'motel_key' ? PAL.GOLD_BADGE : 'rgba(185,235,255,0.55)';
    ctx.fillRect(x - 6, y - 4, 12, 8);
    ctx.strokeStyle = PAL.NEON_CYAN;
    ctx.strokeRect(x - 6, y - 4, 12, 8);
  } else if (propId === 'coffee_mug') {
    ctx.fillStyle = '#ece8df';
    ctx.fillRect(x - 4, y - 6, 8, 8);
  } else if (propId === 'open_safe') {
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(x - 16, y - 24, 32, 26);
    ctx.fillStyle = '#07090e';
    ctx.fillRect(x - 12, y - 20, 24, 18);
  } else if (propId === 'corpse_sheet') {
    ctx.fillStyle = '#d4d8e2';
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
