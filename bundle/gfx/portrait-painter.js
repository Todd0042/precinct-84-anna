import { PAL, SKIN_RAMPS, HAIR_TONES, hexAlpha } from './svga-palette.js';
import { resolveOutfitSpec } from '../assets/outfit-prop-catalog.js';
import { drawHeldProp } from './scene-props.js';

/**
 * Renders a detailed 112x112 1990s Neo-Noir Talking Portrait Card onto the canvas
 * with sculpted facial anatomy, mood expressions, outfits, smoking props, glasses, hair & rim lighting.
 */
export function drawPortraitCutIn(ctx, x, y, size, charSpec, mood = 'calm', tick = 0, opts = {}) {
  if (!charSpec) return;
  const cx = x + size / 2;
  const cy = y + size * 0.49;
  const [skin, skinShade, skinHi] = SKIN_RAMPS[charSpec.skin || 'fair'] || SKIN_RAMPS.fair;
  const [hair, hairHi] = HAIR_TONES[charSpec.hair || 'black'] || HAIR_TONES.black;
  const outfit = resolveOutfitSpec(charSpec, opts.outfit || charSpec.outfit || 'default');
  const activeProp = opts.prop || charSpec.prop || null;

  ctx.save();
  // Card frame with noir backdrop + Venetian blind light streaks
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(x, y, size, size);
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, 'rgba(30, 56, 118, 0.35)');
  grad.addColorStop(1, 'rgba(10, 12, 22, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  ctx.beginPath();
  ctx.rect(x + 2, y + 2, size - 4, size - 4);
  ctx.clip();

  for (let by = y + 6; by < y + size; by += 14) {
    ctx.fillStyle = 'rgba(255, 220, 150, 0.05)';
    ctx.fillRect(x, by, size, 5);
  }

  // Shoulders & tailored outfit (supports naked, formal, casual, bad_guy, police_uniform)
  const attire = outfit.isNaked ? skin : outfit.attireColor;
  ctx.fillStyle = attire;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + size);
  ctx.quadraticCurveTo(cx, y + size - 36, x + size - 8, y + size);
  ctx.closePath();
  ctx.fill();

  if (outfit.isNaked) {
    ctx.strokeStyle = skinShade;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 16, y + size - 14);
    ctx.quadraticCurveTo(cx, y + size - 10, cx + 16, y + size - 14);
    ctx.stroke();
  } else if (outfit.collarColor) {
    ctx.fillStyle = outfit.collarColor;
    ctx.beginPath();
    ctx.moveTo(cx - 11, y + size - 25);
    ctx.lineTo(cx + 11, y + size - 25);
    ctx.lineTo(cx, y + size - 6);
    ctx.closePath();
    ctx.fill();
    if (outfit.hasTie) {
      ctx.fillStyle = '#7e1c24';
      ctx.fillRect(cx - 2.5, y + size - 22, 5, 16);
    }
  } else if (outfit.hasGown) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(cx - 13, y + size - 26);
    ctx.lineTo(cx + 13, y + size - 26);
    ctx.lineTo(cx, y + size - 11);
    ctx.closePath();
    ctx.fill();
  }

  if (outfit.badge) {
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.beginPath();
    ctx.arc(cx + 17, y + size - 13, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neck & back hair layers
  ctx.fillStyle = skinShade;
  ctx.fillRect(cx - 8, cy + 16, 16, 20);
  if (charSpec.hairStyle === 'ponytail' || charSpec.hairStyle === 'long') {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 27, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted head silhouette
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 20, 22, 0, Math.PI, 0);
  ctx.lineTo(cx + 19, cy + 10);
  ctx.quadraticCurveTo(cx, cy + 29, cx - 19, cy + 10);
  ctx.closePath();
  ctx.fill();

  // Cheekbone shadow + nose bridge + brow highlight
  ctx.fillStyle = hexAlpha(skinShade, 0.72);
  ctx.beginPath();
  ctx.moveTo(cx - 19, cy - 2);
  ctx.quadraticCurveTo(cx - 10, cy + 16, cx - 3, cy + 25);
  ctx.lineTo(cx - 16, cy + 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hexAlpha(skinHi, 0.55);
  ctx.beginPath();
  ctx.ellipse(cx + 7, cy - 1, 6, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (blinks briefly every 32 ticks)
  const blinking = tick % 32 === 0;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * 8;
    const ey = cy - 4;
    if (blinking) {
      ctx.strokeStyle = '#18141c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ex - 4, ey);
      ctx.lineTo(ex + 4, ey);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f2f4fa';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 4.4, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = charSpec.eyeColor || '#261e1c';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 0.6, ey - 1.2, 1.2, 1.2);
    }

    // Mood-aware eyebrows
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const innerDrop = mood === 'angry' || mood === 'suspicious' ? 2.5 : mood === 'nervous' || mood === 'sad' ? -2.2 : 0;
    ctx.moveTo(ex - dir * 4.5, ey - 5.5 + innerDrop);
    ctx.lineTo(ex + dir * 4.5, ey - 6.2 - innerDrop * 0.4);
    ctx.stroke();
  }

  // Sculpted nose & mustache
  ctx.strokeStyle = skinShade;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, cy - 4);
  ctx.lineTo(cx + 2, cy + 5);
  ctx.lineTo(cx - 1.5, cy + 6.5);
  ctx.stroke();

  if (charSpec.mustache) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10.5, 9, 2.6, 0, Math.PI, 0);
    ctx.fill();
  }

  // Expressive mouth (smirk, shout, calm, flirt, nervous)
  ctx.strokeStyle = '#733131';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const my = cy + 13.5;
  if (mood === 'smirk' || mood === 'flirt') {
    ctx.moveTo(cx - 5.5, my + 0.5);
    ctx.quadraticCurveTo(cx + 1, my + 2.5, cx + 6.5, my - 2);
  } else if (mood === 'angry' || mood === 'shout') {
    ctx.fillStyle = '#2a0d12';
    ctx.fillRect(cx - 5, my - 1.5, 10, 4);
    ctx.strokeRect(cx - 5, my - 1.5, 10, 4);
  } else if (mood === 'nervous' || mood === 'terrified') {
    ctx.moveTo(cx - 5, my + 1.5);
    ctx.quadraticCurveTo(cx, my - 1.5, cx + 5, my + 1.5);
  } else {
    ctx.moveTo(cx - 5, my);
    ctx.quadraticCurveTo(cx, my + 1, cx + 5, my);
  }
  ctx.stroke();

  if (charSpec.glasses) {
    ctx.strokeStyle = PAL.CHROME;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(cx - 13.5, cy - 8, 11, 7.5);
    ctx.strokeRect(cx + 2.5, cy - 8, 11, 7.5);
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, cy - 4.5);
    ctx.lineTo(cx + 2.5, cy - 4.5);
    ctx.stroke();
  }

  if (activeProp === 'cigarette' || activeProp === 'cigar') {
    drawHeldProp(ctx, activeProp, cx + 10, cy + 18, cx + 4, cy + 14, 1, tick, 'smoke', { portrait: true });
  }

  // Top hair & cap/fedora
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 17, 20.5, 9.5, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = hairHi;
  ctx.fillRect(cx - 8, cy - 23, 14, 2.5);

  if (outfit.hat === 'cop_cap') {
    ctx.fillStyle = PAL.COP_NAVY;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 23, 9.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PAL.VOID;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 17, 22, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.fillRect(cx - 3, cy - 26, 6, 5);
  } else if (outfit.hat === 'fedora') {
    ctx.fillStyle = PAL.TRENCH_SHADE;
    ctx.fillRect(cx - 26, cy - 19, 52, 4);
    ctx.beginPath();
    ctx.roundRect(cx - 16, cy - 32, 32, 13, 3);
    ctx.fill();
  }

  // Frame border + name tag bar
  ctx.restore();
  ctx.strokeStyle = mood === 'angry' ? PAL.RED_STROBE : mood === 'corrupt' ? PAL.NEON_PINK : PAL.NEON_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(7, 9, 18, 0.86)';
  ctx.fillRect(x + 2, y + size - 16, size - 4, 14);
  ctx.fillStyle = PAL.AMBER;
  ctx.font = 'bold 9px monospace';
  ctx.fillText(String(charSpec.shortName || charSpec.name || 'NPC').toUpperCase().slice(0, 15), x + 6, y + size - 6);
}
