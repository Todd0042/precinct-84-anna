import { PAL } from './svga-palette.js';
import { drawSvgaCruiser, drawSvgaMonteCarlo, drawSvgaLightbar } from './scene-props.js';

export function drawSkyAndCity(ctx, horizonY, tick) {
  const g = ctx.createLinearGradient(0, 0, 0, horizonY);
  g.addColorStop(0, PAL.NIGHT_TOP);
  g.addColorStop(1, PAL.NIGHT_HORIZON);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, horizonY);

  const bldgs = [
    [0, 38, 62], [62, 56, 48], [110, 26, 70], [180, 48, 52],
    [232, 32, 64], [296, 60, 50], [346, 28, 72], [418, 44, 62],
  ];
  for (const [bx, by, bw] of bldgs) {
    if (by >= horizonY) continue;
    ctx.fillStyle = '#090c17';
    ctx.fillRect(bx, by, bw, horizonY - by);
    for (let wy = by + 8; wy < horizonY - 8; wy += 12) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 11) {
        if ((wx * 7 + wy * 11) % 9 < 3) {
          ctx.fillStyle = (wx + wy) % 6 === 0 && tick % 19 === 0 ? PAL.NIGHT_MID : PAL.AMBER_DIM;
          ctx.fillRect(wx, wy, 5, 6);
        }
      }
    }
  }
}

export function drawWetGround(ctx, yTop, puddleHue = PAL.PUDDLE) {
  const g = ctx.createLinearGradient(0, yTop, 0, 270);
  g.addColorStop(0, PAL.ASPHALT_DARK);
  g.addColorStop(1, PAL.ASPHALT);
  ctx.fillStyle = g;
  ctx.fillRect(0, yTop, 480, 270 - yTop);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, yTop, 480, 2);
  ctx.fillStyle = puddleHue;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(135, yTop + 36, 75, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(360, yTop + 48, 86, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export const TEMPLATES_A = {
  precinct_briefing(ctx) {
    ctx.fillStyle = PAL.WALL_SLATE;
    ctx.fillRect(0, 0, 480, 200);
    ctx.fillStyle = PAL.WOOD_DARK;
    ctx.fillRect(0, 200, 480, 70);
    // Frosted rain window left
    ctx.fillStyle = PAL.NIGHT_MID;
    ctx.fillRect(16, 36, 68, 110);
    ctx.strokeStyle = PAL.STEEL_LIT;
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 36, 68, 110);
    // Huge framed BOLO chalkboard
    ctx.fillStyle = PAL.CHALK_GREEN;
    ctx.fillRect(108, 28, 344, 124);
    ctx.strokeStyle = PAL.WOOD_MID;
    ctx.lineWidth = 6;
    ctx.strokeRect(108, 28, 344, 124);
    ctx.fillStyle = PAL.WHITE_SHIRT;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('BOLO: 4X-8821 MONTE CARLO', 124, 58);
    ctx.fillStyle = PAL.NEON_CYAN;
    ctx.fillText('BLUE VELVET // CASE 84-001', 124, 86);
    // Pinned Polaroid
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(382, 42, 54, 62);
    ctx.fillStyle = '#202430';
    ctx.fillRect(388, 48, 42, 42);
    // Oak podium & foreground table
    ctx.fillStyle = PAL.WOOD_MID;
    ctx.fillRect(88, 162, 54, 62);
    ctx.fillRect(184, 198, 210, 48);
  },

  precinct_locker(ctx, state) {
    ctx.fillStyle = PAL.WALL_SLATE;
    ctx.fillRect(0, 0, 480, 208);
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(0, 208, 480, 62);
    for (let i = 0; i < 6; i++) {
      const lx = 26 + i * 62;
      ctx.fillStyle = PAL.STEEL_MID;
      ctx.fillRect(lx, 36, 56, 164);
      ctx.strokeStyle = PAL.VOID;
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, 36, 56, 164);
      for (let v = 0; v < 4; v++) ctx.fillRect(lx + 10, 48 + v * 6, 36, 2);
    }
    if (state.flags?.openedLocker) {
      ctx.fillStyle = PAL.VOID;
      ctx.fillRect(150, 36, 56, 164);
      ctx.fillStyle = PAL.STEEL_LIT;
      ctx.fillRect(206, 36, 24, 164);
      if (!state.flags?.equippedGear) {
        ctx.fillStyle = PAL.WOOD_LIT;
        ctx.fillRect(158, 66, 40, 10);
        ctx.fillStyle = PAL.NEON_CYAN;
        ctx.fillRect(160, 126, 36, 24);
      }
    }
    ctx.fillStyle = PAL.AMBER;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('LOCKER #84', 138, 24);
    // Key board right
    ctx.fillStyle = PAL.WOOD_MID;
    ctx.fillRect(408, 60, 56, 84);
    if (!state.flags?.hasKeys) {
      ctx.fillStyle = PAL.GOLD_BADGE;
      ctx.beginPath();
      ctx.arc(436, 98, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(434, 104, 4, 16);
    }
    // Bench
    ctx.fillStyle = PAL.WOOD_LIT;
    ctx.fillRect(62, 224, 320, 14);
  },

  precinct_yard(ctx, state, tick) {
    drawSkyAndCity(ctx, 130, tick);
    ctx.fillStyle = PAL.BRICK_MID;
    ctx.fillRect(0, 44, 480, 132);
    ctx.fillStyle = PAL.WALL_SLATE;
    ctx.fillRect(154, 72, 172, 104);
    ctx.fillStyle = PAL.AMBER;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('PRECINCT 84 MOTOR POOL', 152, 62);
    // Floodlight cone
    const fg = ctx.createRadialGradient(74, 38, 4, 74, 140, 130);
    fg.addColorStop(0, 'rgba(255, 200, 100, 0.35)');
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 30, 210, 180);
    drawWetGround(ctx, 176);
    drawSvgaCruiser(ctx, 162, 164, tick, {
      lightsOn: false,
      trunkOpen: Boolean(state.flags?.inspectedTrunk),
      nailAlert: !state.flags?.inspectedTires,
    });
  },

  crosswalk_redlight(ctx, state, tick) {
    drawSkyAndCity(ctx, 118, tick);
    ctx.fillStyle = PAL.BRICK_DARK;
    ctx.fillRect(28, 34, 128, 126);
    ctx.fillStyle = PAL.AMBER_DIM;
    ctx.fillRect(44, 68, 96, 30);
    ctx.fillStyle = PAL.AMBER;
    ctx.font = 'bold 13px monospace';
    ctx.fillText("ROSSI'S", 62, 88);
    drawWetGround(ctx, 136, PAL.RED_DEEP);
    for (let cx = 86; cx < 394; cx += 42) {
      ctx.fillStyle = 'rgba(235, 238, 245, 0.72)';
      ctx.fillRect(cx, 152, 26, 16);
    }
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(272, 26, 26, 46);
    ctx.fillStyle = PAL.RED_STROBE;
    ctx.beginPath();
    ctx.arc(285, 39, 7, 0, Math.PI * 2);
    ctx.fill();
  },

  pursuit_highway(ctx, state, tick) {
    drawSkyAndCity(ctx, 98, tick);
    ctx.fillStyle = PAL.ASPHALT;
    ctx.beginPath();
    ctx.moveTo(0, 186);
    ctx.lineTo(175, 98);
    ctx.lineTo(305, 98);
    ctx.lineTo(480, 186);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const ly = 104 + ((i * 15 + tick * 6) % 78);
      ctx.fillStyle = PAL.AMBER;
      ctx.fillRect(237, ly, 6, 8);
    }
    const stage = state.pursuitStage || 0;
    if (stage === 0) {
      drawSvgaMonteCarlo(ctx, 168, 102, false, tick);
    } else if (stage === 1) {
      ctx.fillStyle = '#e8ecf6';
      ctx.fillRect(190, 88, 196, 68);
      ctx.fillStyle = PAL.NEON_CYAN;
      ctx.fillRect(198, 104, 180, 28);
      ctx.fillStyle = PAL.COP_NAVY;
      ctx.font = 'bold 16px monospace';
      ctx.fillText('FISH CO.', 248, 124);
    } else if (stage === 2) {
      ctx.fillStyle = PAL.STEEL_MID;
      ctx.fillRect(108, 86, 270, 56);
      for (let s = 0; s < 14; s++) {
        ctx.fillStyle = 'rgba(170, 182, 200, 0.52)';
        ctx.beginPath();
        ctx.arc(90 + ((s * 31 + tick * 7) % 300), 86 + (s % 4) * 14, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = PAL.BRICK_DARK;
      ctx.fillRect(0, 20, 118, 166);
      ctx.fillRect(362, 20, 118, 166);
      drawSvgaMonteCarlo(ctx, 174, 108, true, tick);
    }
  },

  felony_railyard(ctx, state, tick) {
    drawSkyAndCity(ctx, 120, tick);
    ctx.strokeStyle = PAL.STEEL_DARK;
    for (let fx = 0; fx < 480; fx += 18) {
      ctx.beginPath();
      ctx.moveTo(fx, 86);
      ctx.lineTo(fx, 152);
      ctx.stroke();
    }
    drawWetGround(ctx, 150);
    drawSvgaMonteCarlo(ctx, 292, 134, true, tick);
    drawSvgaCruiser(ctx, 16, 158, tick, { lightsOn: true, headlights: true });
  },

  interrogation_b(ctx, state, tick) {
    ctx.fillStyle = '#1b202e';
    ctx.fillRect(0, 0, 480, 210);
    ctx.fillStyle = '#252c3f';
    ctx.fillRect(0, 210, 480, 60);
    // Two-way mirror + Dooley silhouette behind glass
    ctx.fillStyle = PAL.BLUE_DEEP;
    ctx.fillRect(114, 26, 252, 82);
    ctx.strokeStyle = PAL.STEEL_LIT;
    ctx.lineWidth = 4;
    ctx.strokeRect(114, 26, 252, 82);
    ctx.fillStyle = 'rgba(7, 10, 20, 0.72)';
    ctx.beginPath();
    ctx.arc(240, 64, 14, 0, Math.PI * 2);
    ctx.fillRect(222, 78, 36, 30);
    ctx.fill();
    // Hanging lamp cone
    ctx.fillStyle = 'rgba(255, 210, 122, 0.14)';
    ctx.beginPath();
    ctx.moveTo(222, 46);
    ctx.lineTo(258, 46);
    ctx.lineTo(368, 184);
    ctx.lineTo(112, 184);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.STEEL_MID;
    ctx.fillRect(108, 174, 264, 16);
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(130, 190, 18, 60);
    ctx.fillRect(332, 190, 18, 60);
    if (tick && state.flags?.lightsOn) drawSvgaLightbar(ctx, 224, 6, 32, tick);
  },

  parking_garage(ctx, state, tick) {
    ctx.fillStyle = '#151924';
    ctx.fillRect(0, 0, 480, 190);
    drawWetGround(ctx, 190);
    for (const px of [58, 220, 386]) {
      ctx.fillStyle = PAL.WALL_LIGHT;
      ctx.fillRect(px, 24, 34, 176);
      ctx.fillStyle = PAL.AMBER_DIM;
      ctx.fillRect(px, 130, 34, 24);
    }
    ctx.fillStyle = 'rgba(255, 220, 140, 0.12)';
    ctx.fillRect(140, 12, 200, 186);
    if (state.flags?.lightsOn) drawSvgaCruiser(ctx, 290, 164, tick, { lightsOn: false });
  },

  diner_booth(ctx) {
    ctx.fillStyle = '#241b1c';
    ctx.fillRect(0, 0, 480, 196);
    ctx.fillStyle = PAL.NIGHT_MID;
    ctx.fillRect(42, 26, 396, 98);
    ctx.fillStyle = PAL.NEON_PINK;
    ctx.fillRect(62, 42, 88, 10);
    ctx.fillStyle = PAL.CRIMSON;
    ctx.fillRect(40, 132, 74, 86);
    ctx.fillRect(366, 132, 74, 86);
    ctx.fillStyle = PAL.WOOD_LIT;
    ctx.fillRect(114, 164, 252, 18);
  },

  brick_alley(ctx, state, tick) {
    drawSkyAndCity(ctx, 104, tick);
    ctx.fillStyle = PAL.BRICK_DARK;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(156, 70);
    ctx.lineTo(156, 180);
    ctx.lineTo(0, 256);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.BRICK_MID;
    ctx.beginPath();
    ctx.moveTo(480, 0);
    ctx.lineTo(324, 70);
    ctx.lineTo(324, 180);
    ctx.lineTo(480, 256);
    ctx.closePath();
    ctx.fill();
    drawWetGround(ctx, 180, PAL.AMBER_DIM);
    if (state.flags?.lightsOn !== false) drawSvgaCruiser(ctx, 164, 146, tick, { lightsOn: true });
  },
};
