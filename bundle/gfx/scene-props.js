import { PAL } from './svga-palette.js';

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

export function drawPropLayer(ctx, propId, tick = 0, state = {}) {
  if (propId === 'police_tape') {
    ctx.fillStyle = PAL.AMBER;
    ctx.fillRect(0, 224, 480, 7);
    ctx.fillStyle = '#101218';
    for (let x = 0; x < 480; x += 28) ctx.fillRect(x, 224, 12, 7);
    ctx.font = 'bold 6px monospace';
    for (let x = 14; x < 460; x += 84) ctx.fillText('POLICE LINE', x, 230);
  } else if (propId === 'cash_briefcase') {
    ctx.fillStyle = '#382214';
    ctx.fillRect(202, 162, 58, 24);
    ctx.fillStyle = '#246838';
    ctx.fillRect(206, 165, 22, 14);
    ctx.fillRect(232, 165, 22, 14);
    ctx.strokeStyle = PAL.GOLD_BADGE;
    ctx.strokeRect(202, 162, 58, 24);
  } else if (propId === 'whiskey_glasses') {
    for (const gx of [172, 186]) {
      ctx.fillStyle = 'rgba(220, 235, 250, 0.35)';
      ctx.fillRect(gx, 168, 9, 12);
      ctx.fillStyle = PAL.AMBER;
      ctx.fillRect(gx + 1, 174, 7, 5);
    }
  } else if (propId === 'rossi_box') {
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(142, 166, 28, 16);
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(142, 174);
    ctx.lineTo(170, 174);
    ctx.moveTo(156, 166);
    ctx.lineTo(156, 182);
    ctx.stroke();
  } else if (propId === 'incinerator_fire') {
    ctx.fillStyle = '#181b22';
    ctx.fillRect(365, 138, 62, 92);
    const flicker = (tick % 3) * 4;
    ctx.fillStyle = PAL.FIRE_ORANGE;
    ctx.beginPath();
    ctx.moveTo(372, 138);
    ctx.lineTo(386, 94 - flicker);
    ctx.lineTo(398, 118);
    ctx.lineTo(412, 90 + flicker);
    ctx.lineTo(422, 138);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.FLAME_YELLOW;
    ctx.beginPath();
    ctx.moveTo(382, 138);
    ctx.lineTo(397, 108 - flicker);
    ctx.lineTo(414, 138);
    ctx.closePath();
    ctx.fill();
  } else if (propId === 'red_twine_clue') {
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, 245);
    ctx.quadraticCurveTo(234, 240, 246, 248);
    ctx.stroke();
  } else if (propId === 'tape_recorder') {
    ctx.fillStyle = '#141822';
    ctx.fillRect(184, 152, 46, 24);
    ctx.strokeStyle = PAL.STEEL_LIT;
    ctx.strokeRect(184, 152, 46, 24);
    for (const rx of [197, 217]) {
      ctx.fillStyle = PAL.CHROME;
      ctx.beginPath();
      ctx.arc(rx, 164, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = state.flags?.recorderOn && tick % 2 === 0 ? PAL.RED_STROBE : PAL.RED_DEEP;
    ctx.fillRect(223, 155, 4, 4);
  }
}
