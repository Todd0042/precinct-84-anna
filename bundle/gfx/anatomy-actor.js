import { PAL, SKIN_RAMPS, HAIR_TONES, hexAlpha } from './svga-palette.js';

function drawRoundedLimb(ctx, x0, y0, x1, y1, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawDetailedHead(ctx, cx, cy, spec, facing = 1, rimColor = null) {
  const [skin, skinShade, skinHi] = SKIN_RAMPS[spec.skin || 'fair'] || SKIN_RAMPS.fair;
  const [hair, hairHi] = HAIR_TONES[spec.hair || 'black'] || HAIR_TONES.black;

  // Neck + chin shadow
  ctx.fillStyle = skinShade;
  ctx.fillRect(cx - 2.5, cy + 5, 5, 6);

  // Back hair (ponytail or bob before head)
  if (spec.hairStyle === 'ponytail') {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(cx - facing * 6, cy + 1, 3.2, 6.5, facing * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (spec.hairStyle === 'long') {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.roundRect(cx - 7.5, cy - 5, 15, 14, 5);
    ctx.fill();
  }

  // Sculpted cranium & tapered jaw (no rectangular box!)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 6.5, 6.8, 0, Math.PI, 0);
  ctx.lineTo(cx + 6, cy + 3);
  ctx.quadraticCurveTo(cx + facing * 1.5, cy + 8.5, cx - 5.5, cy + 3);
  ctx.closePath();
  ctx.fill();

  // Facial contour shadow & cheekbone highlight
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.ellipse(cx - facing * 3.8, cy + 1, 2.2, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skinHi;
  ctx.fillRect(cx + facing * 1.2, cy - 2.5, 2, 2);

  // Eyes (sclera + dark iris), eyebrows, nose bridge, mouth
  const ex1 = cx + facing * 0.5 - 2.2;
  const ex2 = cx + facing * 0.5 + 2.2;
  ctx.fillStyle = '#f2f4f8';
  ctx.fillRect(ex1 - 1, cy - 1, 2.4, 1.4);
  ctx.fillRect(ex2 - 1, cy - 1, 2.4, 1.4);
  ctx.fillStyle = '#10141e';
  ctx.fillRect(ex1 + (facing > 0 ? 0.2 : -0.4), cy - 1, 1.2, 1.3);
  ctx.fillRect(ex2 + (facing > 0 ? 0.2 : -0.4), cy - 1, 1.2, 1.3);

  ctx.strokeStyle = hair;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(ex1 - 1.2, cy - 2.6);
  ctx.lineTo(ex1 + 1.2, cy - 2.3);
  ctx.moveTo(ex2 - 1.2, cy - 2.3);
  ctx.lineTo(ex2 + 1.2, cy - 2.6);
  ctx.stroke();

  // Nose bridge & mouth
  ctx.fillStyle = skinShade;
  ctx.fillRect(cx + facing * 0.5, cy + 0.5, 1.1, 2.2);
  if (spec.mustache) {
    ctx.fillStyle = hair;
    ctx.fillRect(cx + facing * 0.5 - 2.2, cy + 3.1, 4.6, 1.3);
  }
  ctx.strokeStyle = '#6c3430';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + facing * 0.4 - 1.6, cy + 4.8);
  ctx.lineTo(cx + facing * 0.4 + 1.8, cy + (spec.mood === 'smirk' ? 4.2 : 4.8));
  ctx.stroke();

  if (spec.glasses) {
    ctx.strokeStyle = PAL.CHROME;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(ex1 - 1.4, cy - 1.7, 3, 2.4);
    ctx.strokeRect(ex2 - 1.4, cy - 1.7, 3, 2.4);
    ctx.beginPath();
    ctx.moveTo(ex1 + 1.6, cy - 0.5);
    ctx.lineTo(ex2 - 1.4, cy - 0.5);
    ctx.stroke();
  }

  // Front hair or police cap with curved visor
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5.2, 6.7, 3.6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = hairHi;
  ctx.fillRect(cx - 2, cy - 7.5, 4, 1.3);

  if (spec.hat === 'cop_cap') {
    ctx.fillStyle = PAL.COP_NAVY;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6.6, 7.6, 3.6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PAL.VOID;
    ctx.beginPath();
    ctx.ellipse(cx + facing * 2.2, cy - 4.8, 6.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.fillRect(cx + facing * 0.5 - 1, cy - 7.8, 2, 2);
  } else if (spec.hat === 'fedora') {
    ctx.fillStyle = PAL.TRENCH_SHADE;
    ctx.fillRect(cx - 9, cy - 5.2, 18, 1.8);
    ctx.beginPath();
    ctx.roundRect(cx - 5.8, cy - 10.2, 11.6, 5.5, 2);
    ctx.fill();
  }

  if (rimColor) {
    ctx.strokeStyle = hexAlpha(rimColor, 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 7.2, facing > 0 ? -1.1 : 2.0, facing > 0 ? 1.1 : 4.2);
    ctx.stroke();
  }
}

/**
 * Renders a proportional multi-joint character anchored at foot ground `(x, y)`.
 */
export function drawAnatomicalActor(ctx, x, y, spec = {}, opts = {}) {
  const scale = opts.scale || 1;
  const pose = opts.pose || 'stand';
  const facing = opts.facing || 1;
  const tick = opts.tick || 0;
  const slim = spec.slim ? 0.86 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft floor contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12 * slim, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const coat = spec.attireColor || PAL.COP_NAVY;
  const coatShade = spec.attireShade || PAL.COP_DARK;
  const pants = spec.pantsColor || PAL.SUIT_DARK;
  const [skin] = SKIN_RAMPS[spec.skin || 'fair'] || SKIN_RAMPS.fair;

  // Umbrella overhead if carried
  if (opts.umbrella) {
    ctx.strokeStyle = PAL.WOOD_MID;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(facing * 8, -32);
    ctx.lineTo(facing * 8, -77);
    ctx.stroke();
    ctx.fillStyle = '#12151e';
    ctx.beginPath();
    ctx.moveTo(facing * 8 - 22, -72);
    ctx.quadraticCurveTo(facing * 8, -88, facing * 8 + 22, -72);
    ctx.closePath();
    ctx.fill();
  }

  // Legs & boots
  const kneel = pose === 'kneel';
  const runShift = pose === 'run' ? Math.sin(tick * 0.7) * 5 : 0;
  const hipY = kneel ? -16 : -27;
  drawRoundedLimb(ctx, -4 * slim, hipY, -4.5 * slim - runShift, kneel ? -4 : -2, 5.2 * slim, pants);
  drawRoundedLimb(ctx, 4 * slim, hipY, 4.5 * slim + runShift, -2, 5.2 * slim, pants);
  ctx.fillStyle = '#090b10';
  ctx.beginPath();
  ctx.ellipse(-4.5 * slim - runShift + facing * 1.5, -1.5, 4.2, 2.1, 0, 0, Math.PI * 2);
  ctx.ellipse(4.5 * slim + runShift + facing * 1.5, -1.5, 4.2, 2.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tapered torso + lapels/trench skirt
  const shoulderY = kneel ? -37 : -49;
  const sw = 10.5 * slim;
  const ww = 7.4 * slim;
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-sw, shoulderY);
  ctx.quadraticCurveTo(0, shoulderY - 3, sw, shoulderY);
  ctx.lineTo(ww, hipY + 3);
  if (spec.longCoat) {
    ctx.lineTo(ww + 3, hipY + 13);
    ctx.lineTo(-ww - 3, hipY + 13);
  }
  ctx.lineTo(-ww, hipY + 3);
  ctx.closePath();
  ctx.fill();

  // Tailored torso shadow fold
  ctx.fillStyle = coatShade;
  ctx.beginPath();
  ctx.moveTo(0, shoulderY);
  ctx.lineTo(sw, shoulderY);
  ctx.lineTo(ww, hipY + 3);
  ctx.lineTo(0, hipY + 3);
  ctx.closePath();
  ctx.fill();

  // Shirt collar / tie or Silk robe lapel
  ctx.fillStyle = spec.robe ? PAL.BED_LINEN : PAL.WHITE_SHIRT;
  ctx.beginPath();
  ctx.moveTo(-3.2, shoulderY - 1);
  ctx.lineTo(3.2, shoulderY - 1);
  ctx.lineTo(0, shoulderY + 7);
  ctx.closePath();
  ctx.fill();

  if (spec.badge) {
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.beginPath();
    ctx.arc(facing * 4.5 * slim, shoulderY + 6.5, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (spec.belt !== false && !spec.robe) {
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(-ww, hipY - 1, ww * 2, 3);
    ctx.fillStyle = PAL.CHROME;
    ctx.fillRect(-1.5, hipY - 1, 3, 3);
  }

  // Arms & hands by pose
  const armY = shoulderY + 3;
  drawRoundedLimb(ctx, -sw, armY, -sw - 2, armY + 14, 4.2 * slim, coat);
  if (pose === 'aim') {
    drawRoundedLimb(ctx, sw, armY, sw + facing * 13, armY - 1, 4.0 * slim, coat);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(sw + facing * 14, armY - 1, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.STEEL_LIT;
    ctx.fillRect(sw + facing * 14, armY - 3, facing * 7, 2.4);
  } else if (pose === 'handsup') {
    drawRoundedLimb(ctx, -sw, armY, -sw - 4, armY - 14, 4.0 * slim, coat);
    drawRoundedLimb(ctx, sw, armY, sw + 4, armY - 14, 4.0 * slim, coat);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-sw - 4, armY - 15, 2, 0, Math.PI * 2);
    ctx.arc(sw + 4, armY - 15, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pose === 'flashlight') {
    drawRoundedLimb(ctx, sw, armY, sw + facing * 11, armY + 2, 4.0 * slim, coat);
    ctx.fillStyle = PAL.AMBER;
    ctx.fillRect(sw + facing * 10, armY + 1, facing * 4, 2.5);
    ctx.fillStyle = 'rgba(255, 232, 130, 0.17)';
    ctx.beginPath();
    ctx.moveTo(sw + facing * 14, armY + 2);
    ctx.lineTo(sw + facing * 72, armY - 18);
    ctx.lineTo(sw + facing * 72, armY + 22);
    ctx.closePath();
    ctx.fill();
  } else {
    drawRoundedLimb(ctx, sw, armY, sw + 2, armY + 14, 4.2 * slim, coatShade);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-sw - 2, armY + 15, 1.9, 0, Math.PI * 2);
    ctx.arc(sw + 2, armY + 15, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rossi's Pastries box with red baker's twine if carried
  if (opts.rossiBox) {
    const bx = -10;
    const by = shoulderY + 13;
    ctx.fillStyle = '#f4f2ee';
    ctx.fillRect(bx, by, 12, 8);
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, by + 4);
    ctx.lineTo(bx + 12, by + 4);
    ctx.moveTo(bx + 6, by);
    ctx.lineTo(bx + 6, by + 8);
    ctx.stroke();
  }

  drawDetailedHead(ctx, 0, shoulderY - 9.5, { ...spec, mood: opts.mood }, facing, opts.rimColor);
  ctx.restore();
}
