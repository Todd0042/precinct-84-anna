import { PAL } from './svga-palette.js';
import { drawSkyAndCity, drawWetGround } from './scene-templates-a.js';
import { drawSvgaCruiser, drawPropLayer } from './scene-props.js';

function drawBedroomBase(ctx, { wallColor, windowSky, lampHue, linenColor, blanketColor, clockStr, mirror }) {
  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 480, 198);
  ctx.fillStyle = PAL.WOOD_DARK;
  ctx.fillRect(0, 198, 480, 72);

  // Venetian-blind window with atmospheric moonlight / skyline
  const wx = mirror ? 316 : 36;
  ctx.fillStyle = windowSky;
  ctx.fillRect(wx, 24, 128, 106);
  ctx.strokeStyle = PAL.WOOD_MID;
  ctx.lineWidth = 4;
  ctx.strokeRect(wx, 24, 128, 106);
  for (let by = 32; by < 126; by += 10) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.fillRect(wx + 2, by, 124, 3);
  }

  // Headboard & rumpled bed foreground-mid
  const bx = mirror ? 40 : 196;
  ctx.fillStyle = PAL.WOOD_MID;
  ctx.fillRect(bx, 118, 224, 46);
  ctx.fillStyle = blanketColor;
  ctx.beginPath();
  ctx.roundRect(bx - 6, 152, 236, 72, 6);
  ctx.fill();
  ctx.fillStyle = linenColor;
  ctx.fillRect(bx + 14, 134, 86, 26);
  ctx.fillRect(bx + 122, 134, 86, 26);

  // Nightstand + warm bedside lamp + digital alarm clock
  const nx = mirror ? 278 : 132;
  ctx.fillStyle = PAL.WOOD_MID;
  ctx.fillRect(nx, 156, 52, 54);
  const lg = ctx.createRadialGradient(nx + 26, 132, 2, nx + 26, 146, 95);
  lg.addColorStop(0, lampHue);
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(nx - 60, 72, 172, 140);
  ctx.fillStyle = PAL.CREAM_LIGHT;
  ctx.beginPath();
  ctx.moveTo(nx + 16, 138);
  ctx.lineTo(nx + 36, 138);
  ctx.lineTo(nx + 30, 120);
  ctx.lineTo(nx + 22, 120);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAL.STEEL_DARK;
  ctx.fillRect(nx + 24, 138, 4, 18);
  if (clockStr) {
    ctx.fillStyle = '#090b10';
    ctx.fillRect(nx + 6, 149, 26, 9);
    ctx.fillStyle = PAL.RED_STROBE;
    ctx.font = 'bold 7px monospace';
    ctx.fillText(clockStr, nx + 8, 156);
  }
}

export const TEMPLATES_B = {
  motel_exterior(ctx, state, tick) {
    drawSkyAndCity(ctx, 98, tick);
    ctx.fillStyle = PAL.WALL_SLATE;
    ctx.fillRect(118, 56, 352, 144);
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(118, 118, 352, 10);
    // Room 209 door & amber window
    ctx.fillStyle = PAL.WOOD_MID;
    ctx.fillRect(260, 72, 52, 50);
    ctx.fillStyle = PAL.AMBER;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('209', 274, 62);
    ctx.fillStyle = PAL.WARM_LAMP;
    ctx.fillRect(344, 72, 74, 38);
    // Buzzing neon Starlight Motel sign
    const pink = tick % 6 !== 0 ? PAL.NEON_PINK : '#5c144a';
    const cyan = tick % 4 !== 0 ? PAL.NEON_CYAN : '#125a6a';
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(48, 86, 10, 124);
    ctx.fillStyle = PAL.VOID;
    ctx.fillRect(12, 24, 96, 68);
    ctx.strokeStyle = pink;
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 24, 96, 68);
    ctx.fillStyle = cyan;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('STARLIGHT', 22, 48);
    ctx.fillStyle = pink;
    ctx.fillText('MOTEL', 36, 74);
    drawWetGround(ctx, 200);
  },

  motel_lab(ctx, state) {
    ctx.fillStyle = PAL.WOOD_DARK;
    ctx.fillRect(0, 0, 480, 198);
    ctx.fillStyle = '#332012';
    ctx.fillRect(0, 198, 480, 72);
    ctx.fillStyle = PAL.STEEL_LIT;
    ctx.fillRect(34, 152, 212, 16);
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(50, 168, 12, 76);
    ctx.fillRect(216, 168, 12, 76);
    // Flasks & condenser
    ctx.fillStyle = PAL.NEON_CYAN;
    ctx.beginPath();
    ctx.moveTo(64, 152);
    ctx.lineTo(82, 108);
    ctx.lineTo(94, 108);
    ctx.lineTo(112, 152);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.BLUE_STROBE;
    ctx.fillRect(126, 114, 28, 38);
    // Wall safe or crooked velvet painting
    if (state.flags?.foundSafe || state.flags?.dustedSafe || state.flags?.openedSafe) {
      ctx.fillStyle = PAL.STEEL_DARK;
      ctx.fillRect(320, 44, 112, 92);
      ctx.strokeStyle = PAL.CHROME;
      ctx.lineWidth = 3;
      ctx.strokeRect(320, 44, 112, 92);
      ctx.beginPath();
      ctx.arc(376, 90, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(374, 88);
      ctx.rotate(0.06);
      ctx.fillStyle = PAL.SILK_PLUM;
      ctx.fillRect(-54, -42, 108, 84);
      ctx.strokeStyle = PAL.GOLD_BADGE;
      ctx.lineWidth = 4;
      ctx.strokeRect(-54, -42, 108, 84);
      ctx.restore();
    }
  },

  pier_exterior(ctx, state, tick) {
    drawSkyAndCity(ctx, 100, tick);
    ctx.fillStyle = '#0b1c3c';
    ctx.fillRect(0, 184, 480, 86);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(110, 160, 220, 0.25)';
      ctx.fillRect((i * 39 + tick * 4) % 460, 194 + (i % 5) * 14, 28, 2);
    }
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(102, 54, 354, 130);
    ctx.fillStyle = PAL.VOID;
    ctx.fillRect(198, 66, 132, 34);
    ctx.fillStyle = PAL.NEON_CYAN;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('PIER 84', 220, 90);
    ctx.fillStyle = PAL.VOID;
    ctx.fillRect(102, 110, 354, 8);
    if (state.flags?.swatCalled) {
      ctx.fillStyle = '#0e111a';
      ctx.fillRect(14, 148, 98, 48);
      ctx.fillStyle = PAL.WHITE_SHIRT;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('SWAT', 42, 178);
      ctx.strokeStyle = PAL.RED_STROBE;
      ctx.beginPath();
      ctx.moveTo(88, 152);
      ctx.lineTo(270, 98);
      ctx.stroke();
    }
  },

  pier_floor(ctx, state, tick) {
    ctx.fillStyle = '#0c101b';
    ctx.fillRect(0, 0, 480, 270);
    ctx.strokeStyle = PAL.STEEL_DARK;
    ctx.lineWidth = 2;
    for (let x = 20; x < 480; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, 56);
      ctx.lineTo(x + 80, 0);
      ctx.stroke();
    }
    ctx.fillStyle = PAL.STEEL_MID;
    ctx.fillRect(0, 62, 480, 12);
    // Chemical vats & yellow forklift
    ctx.fillStyle = PAL.BLUE_DEEP;
    ctx.fillRect(280, 112, 74, 96);
    ctx.fillStyle = PAL.NEON_CYAN;
    ctx.fillRect(368, 112, 74, 96);
    ctx.fillStyle = PAL.AMBER;
    ctx.fillRect(34, 144, 108, 72);
    ctx.fillStyle = PAL.VOID;
    ctx.fillRect(54, 94, 58, 50);
    if (tick % 3 === 0 && !state.flags?.enforcerDown) {
      ctx.fillStyle = PAL.AMBER;
      ctx.beginPath();
      ctx.arc(366, 34, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  pier_office(ctx, state, tick) {
    ctx.fillStyle = PAL.WALL_SLATE;
    ctx.fillRect(0, 0, 480, 200);
    ctx.fillStyle = PAL.WOOD_DARK;
    ctx.fillRect(0, 200, 480, 70);
    ctx.fillStyle = PAL.NIGHT_MID;
    ctx.fillRect(24, 22, 260, 112);
    ctx.strokeStyle = PAL.STEEL_MID;
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 22, 260, 112);
    ctx.fillStyle = PAL.WOOD_MID;
    ctx.fillRect(102, 174, 226, 62);
    drawPropLayer(ctx, 'incinerator_fire', tick, state);
    drawPropLayer(ctx, 'rossi_box', tick, state);
  },

  pier_tracks(ctx, state, tick) {
    drawSkyAndCity(ctx, 118, tick);
    drawWetGround(ctx, 144);
    ctx.strokeStyle = PAL.STEEL_LIT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 172);
    ctx.lineTo(480, 172);
    ctx.moveTo(0, 186);
    ctx.lineTo(480, 186);
    ctx.stroke();
    // Streetlamp glow right
    const lg = ctx.createRadialGradient(356, 46, 4, 356, 130, 135);
    lg.addColorStop(0, 'rgba(255, 200, 100, 0.36)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(220, 32, 260, 200);
    ctx.fillStyle = PAL.STEEL_DARK;
    ctx.fillRect(352, 42, 8, 128);
    drawSvgaCruiser(ctx, 14, 152, tick, { lightsOn: true });
    drawPropLayer(ctx, 'police_tape', tick, state);
    drawPropLayer(ctx, 'red_twine_clue', tick, state);
  },

  marcus_bedroom(ctx) {
    drawBedroomBase(ctx, {
      wallColor: '#1a2030',
      windowSky: '#0e1730',
      lampHue: 'rgba(245, 175, 80, 0.34)',
      linenColor: '#b9bfd2',
      blanketColor: '#263452',
      clockStr: '03:12',
      mirror: false,
    });
  },

  claire_bedroom(ctx) {
    drawBedroomBase(ctx, {
      wallColor: '#281d2c',
      windowSky: '#161c3a',
      lampHue: 'rgba(255, 165, 140, 0.34)',
      linenColor: '#e4dbe4',
      blanketColor: '#4e243e',
      clockStr: '01:45',
      mirror: true,
    });
  },

  penthouse_bedroom(ctx, state, tick) {
    drawSkyAndCity(ctx, 124, tick);
    drawBedroomBase(ctx, {
      wallColor: '#1b1624',
      windowSky: 'rgba(15, 22, 48, 0.55)',
      lampHue: 'rgba(255, 195, 110, 0.32)',
      linenColor: '#ece7ef',
      blanketColor: '#5c182c',
      clockStr: null,
      mirror: false,
    });
    drawPropLayer(ctx, 'cash_briefcase', tick, state);
    drawPropLayer(ctx, 'whiskey_glasses', tick, state);
  },

  epilogue_stage(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 194);
    bg.addColorStop(0, '#162f6c');
    bg.addColorStop(1, '#264488');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 480, 194);
    ctx.fillStyle = PAL.WOOD_MID;
    ctx.fillRect(0, 194, 480, 76);
    ctx.fillStyle = PAL.VOID;
    ctx.fillRect(138, 22, 260, 52);
    ctx.strokeStyle = PAL.GOLD_BADGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(138, 22, 260, 52);
    ctx.fillStyle = PAL.AMBER;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('NARCOTICS DET. #084', 158, 54);
    ctx.fillStyle = PAL.WOOD_LIT;
    ctx.fillRect(68, 200, 344, 56);
    drawPropLayer(ctx, 'rossi_box', 0, {});
  },
};
