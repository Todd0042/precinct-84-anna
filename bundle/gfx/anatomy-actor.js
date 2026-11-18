import { PAL, SKIN_RAMPS, HAIR_TONES, hexAlpha } from './svga-palette.js';
import { resolveOutfitSpec } from '../assets/outfit-prop-catalog.js';
import { drawHeldProp } from './scene-props.js';

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
 * Renders a proportional multi-joint character anchored at `(x, y)` supporting outfits,
 * 30+ held props, wounds, and full articulated poses (walk, chill, sit, lie_bed, bend_pickup, shoot, down).
 */
export function drawAnatomicalActor(ctx, x, y, spec = {}, opts = {}) {
  const scale = opts.scale || 1;
  const pose = opts.pose || 'stand';
  const facing = opts.facing >= 0 ? 1 : -1;
  const tick = opts.tick || 0;
  const slim = spec.slim ? 0.86 : 1;
  const outfit = resolveOutfitSpec(spec, opts.outfit || spec.outfit || 'default');
  const prop = opts.prop || spec.prop || (opts.rossiBox ? 'rossi_box' : null);
  const [skin, skinShade] = SKIN_RAMPS[spec.skin || 'fair'] || SKIN_RAMPS.fair;

  const coat = outfit.isNaked ? skin : outfit.attireColor;
  const coatShade = outfit.isNaked ? skinShade : outfit.attireShade;
  const pants = outfit.isNaked ? skin : outfit.pantsColor;
  const hipY = pose === 'kneel' || pose === 'crouch' ? -16 : pose === 'sit' || pose === 'sit_relaxed' ? -18 : pose === 'bend_pickup' ? -22 : -27;
  const shoulderY = pose === 'kneel' || pose === 'crouch' ? -37 : pose === 'sit' || pose === 'sit_relaxed' ? -40 : hipY - 22;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Floor contact shadow (wider for horizontal/bed poses)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(0, 0, pose === 'down' || pose === 'lie_bed' ? 28 : 12 * slim, pose === 'down' ? 4.2 : 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose === 'lie_bed') {
    ctx.translate(facing * 8, -4);
    ctx.rotate(Math.PI * 0.47 * -facing);
  } else if (pose === 'down' || pose === 'prone') {
    ctx.translate(facing * 4, -5);
    ctx.rotate(Math.PI * 0.49 * -facing);
  } else if (pose === 'hit') {
    ctx.rotate(-facing * 0.28);
  } else if (pose === 'shoot') {
    ctx.translate(-facing * 2.5, 0);
  }

  if (opts.umbrella || prop === 'umbrella') {
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

  // Legs & feet
  const stridePhase = opts.walkCycle != null ? opts.walkCycle : tick * (pose === 'run' ? 0.85 : 0.45);
  const walkShift = (pose === 'walk' || pose === 'run') ? Math.sin(stridePhase) * (pose === 'run' ? 6 : 4) : 0;
  if (pose === 'sit' || pose === 'sit_relaxed') {
    const ext = pose === 'sit_relaxed' ? 12 : 8;
    drawRoundedLimb(ctx, -3 * slim, hipY, facing * ext, hipY + 3, 5 * slim, pants);
    drawRoundedLimb(ctx, 3 * slim, hipY, facing * ext, hipY + 3, 5 * slim, pants);
    drawRoundedLimb(ctx, facing * ext, hipY + 3, facing * (ext + 1), -2, 4.6 * slim, pants);
  } else {
    const footY = pose === 'kneel' || pose === 'crouch' ? -4 : -2;
    drawRoundedLimb(ctx, -4 * slim, hipY, -4.5 * slim - walkShift, footY, 5.2 * slim, pants);
    drawRoundedLimb(ctx, 4 * slim, hipY, 4.5 * slim + walkShift, -2, 5.2 * slim, pants);
  }
  ctx.fillStyle = outfit.isNaked ? skinShade : '#090b10';
  ctx.beginPath();
  ctx.ellipse(-4.5 * slim - walkShift + facing * 1.5, -1.5, 4, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(4.5 * slim + walkShift + facing * 1.5, -1.5, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (opts.condition === 'wounded_leg' || opts.condition === 'hospitalized') {
    ctx.fillStyle = '#f0f2f8';
    ctx.fillRect(1 * facing, hipY + 6, 7, 4.5);
    ctx.fillStyle = PAL.RED_STROBE;
    ctx.fillRect(3 * facing, hipY + 7, 2.5, 2);
  }

  // Upper torso group (supports bending forward on bend_pickup!)
  ctx.save();
  if (pose === 'bend_pickup') {
    ctx.translate(0, hipY);
    ctx.rotate(facing * 0.68);
    ctx.translate(0, -hipY);
  }

  const sw = 10.5 * slim;
  const ww = 7.4 * slim;
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-sw, shoulderY);
  ctx.quadraticCurveTo(0, shoulderY - 3, sw, shoulderY);
  ctx.lineTo(ww, hipY + 3);
  if (spec.longCoat || outfit.hasGown) {
    ctx.lineTo(ww + 3, hipY + 13);
    ctx.lineTo(-ww - 3, hipY + 13);
  }
  ctx.lineTo(-ww, hipY + 3);
  ctx.closePath();
  ctx.fill();

  // Shading contour (or abdominal contour when naked)
  ctx.fillStyle = coatShade;
  ctx.beginPath();
  ctx.moveTo(0, shoulderY);
  ctx.lineTo(sw, shoulderY);
  ctx.lineTo(ww, hipY + 3);
  ctx.lineTo(0, hipY + 3);
  ctx.closePath();
  ctx.fill();

  if (!outfit.isNaked && outfit.collarColor) {
    ctx.fillStyle = outfit.collarColor;
    ctx.beginPath();
    ctx.moveTo(-3.2, shoulderY - 1);
    ctx.lineTo(3.2, shoulderY - 1);
    ctx.lineTo(0, shoulderY + 7);
    ctx.closePath();
    ctx.fill();
    if (outfit.hasTie) {
      ctx.fillStyle = '#7e1c24';
      ctx.fillRect(-1, shoulderY + 1, 2, 11);
    }
  } else if (outfit.isNaked) {
    ctx.strokeStyle = skinShade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, shoulderY + 5);
    ctx.lineTo(4, shoulderY + 5);
    ctx.stroke();
  }

  if (outfit.badge) {
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.beginPath();
    ctx.arc(facing * 4.5 * slim, shoulderY + 6.5, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (outfit.belt) {
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(-ww, hipY - 1, ww * 2, 3);
    ctx.fillStyle = PAL.CHROME;
    ctx.fillRect(-1.5, hipY - 1, 3, 3);
  }
  if (opts.condition === 'wounded_arm') {
    ctx.fillStyle = '#f0f2f8';
    ctx.fillRect(-sw + 2, shoulderY + 2, sw * 2 - 4, 4);
  }

  // Arms + hand coordinates `(hx, hy)` and mouth target `(mx, my)` for props
  const armY = shoulderY + 3;
  const headCy = shoulderY - 9.5;
  const mx = facing * 3.5;
  const my = headCy + 4.8;
  let hx = sw + facing * 2;
  let hy = armY + 14;

  const backSwing = (pose === 'walk' || pose === 'run') ? walkShift * 0.9 : 0;
  drawRoundedLimb(ctx, -sw, armY, -sw - 2 - backSwing, armY + 14, 4.1 * slim, coat);

  if (pose === 'aim' || pose === 'shoot') {
    hx = sw + facing * 13;
    hy = armY - 1;
    drawRoundedLimb(ctx, sw, armY, hx, hy, 4.0 * slim, coat);
  } else if (pose === 'handsup') {
    hx = sw + 4;
    hy = armY - 14;
    drawRoundedLimb(ctx, -sw, armY, -sw - 4, armY - 14, 4.0 * slim, coat);
    drawRoundedLimb(ctx, sw, armY, hx, hy, 4.0 * slim, coat);
  } else if (pose === 'bend_pickup') {
    hx = facing * 10;
    hy = hipY + 18;
    drawRoundedLimb(ctx, sw * facing, armY, hx, hy, 4.0 * slim, coat);
  } else if (pose === 'smoke' || pose === 'sip' || pose === 'talk_gesture') {
    hx = mx + facing * 4;
    hy = my + 1;
    drawRoundedLimb(ctx, sw * facing, armY, hx, hy, 3.8 * slim, coat);
  } else if (pose === 'flashlight') {
    hx = sw + facing * 11;
    hy = armY + 2;
    drawRoundedLimb(ctx, sw, armY, hx, hy, 4.0 * slim, coat);
  } else if (pose === 'chill' || pose === 'sit' || pose === 'sit_relaxed') {
    hx = facing * 8;
    hy = hipY + 2;
    drawRoundedLimb(ctx, sw * facing, armY, hx, hy, 4.0 * slim, coatShade);
  } else {
    hx = sw * facing + backSwing;
    hy = armY + 14;
    drawRoundedLimb(ctx, sw * facing, armY, hx, hy, 4.1 * slim, coatShade);
  }

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, hy, 1.9, 0, Math.PI * 2);
  ctx.fill();

  const resolvedProp = prop || (pose === 'aim' || pose === 'shoot' ? 'pistol' : pose === 'flashlight' ? 'flashlight' : null);
  drawHeldProp(ctx, resolvedProp, hx, hy, mx, my, facing, tick, pose);

  drawDetailedHead(ctx, 0, headCy, { ...spec, hat: outfit.hat, mood: opts.mood }, facing, opts.rimColor);
  ctx.restore();
  ctx.restore();
}
