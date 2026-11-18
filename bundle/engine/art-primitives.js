import { EGA } from './palette.js';

export function drawNightSkyAndSkyline(fb, horizonY = 30, tick = 0) {
  fb.fillDitherRect(0, 0, 128, horizonY, EGA.SKY_TOP, EGA.SKY_HORIZON, 'vgrad');
  const towers = [
    [0, 12, 16], [16, 17, 13], [29, 9, 18], [47, 15, 14],
    [61, 11, 15], [76, 18, 13], [89, 8, 20], [109, 14, 19],
  ];
  for (const [tx, ty, tw] of towers) {
    if (ty >= horizonY) continue;
    fb.fillRect(tx, ty, tw, horizonY - ty, EGA.BLACK);
    for (let wy = ty + 3; wy < horizonY - 3; wy += 4) {
      for (let wx = tx + 2; wx < tx + tw - 2; wx += 4) {
        const litHash = (wx * 7 + wy * 13) % 11;
        if (litHash < 3) {
          const winColor = litHash === 0 && tick % 19 === 0 ? EGA.DARK_BLUE : EGA.SODIUM_AMBER;
          fb.fillRect(wx, wy, 2, 2, winColor);
        } else if (litHash === 4) {
          fb.fillRect(wx, wy, 2, 2, EGA.WALL_DARK);
        }
      }
    }
  }
}

export function drawWetStreet(fb, yTop = 36, height = 28, puddleColor = EGA.PUDDLE_BLUE) {
  fb.fillDitherRect(0, yTop, 128, height, EGA.ASPHALT, EGA.ASPHALT_DARK, 'bayer25');
  fb.fillRect(0, yTop, 128, 1, EGA.WALL_MID);
  fb.fillDitherRect(14, yTop + 6, 36, 4, EGA.WET_ASPHALT, puddleColor, 'checker');
  fb.fillDitherRect(72, yTop + 12, 42, 5, EGA.WET_ASPHALT, puddleColor, 'checker');
}

export function drawRain(fb, tick, count = 48, area = { x0: 0, y0: 0, x1: 128, y1: 64 }) {
  const spanX = Math.max(1, area.x1 - area.x0);
  const spanY = Math.max(1, area.y1 - area.y0);
  for (let i = 0; i < count; i++) {
    const rx = area.x0 + ((i * 23 + tick * 5) % spanX);
    const ry = area.y0 + ((i * 17 + tick * 7) % spanY);
    fb.setPixel(rx, ry, EGA.RAIN_STREAK);
    fb.setPixel(rx - 1, ry + 1, EGA.FOG_GRAY);
    if (i % 4 === 0 && ry + 2 < area.y1) {
      fb.setPixel(rx - 2, ry + 2, EGA.WALL_DARK);
    }
    if (ry > area.y1 - 8 && (i + tick) % 5 === 0) {
      fb.setPixel(rx - 1, area.y1 - 2, EGA.PUDDLE_BLUE);
      fb.setPixel(rx + 1, area.y1 - 2, EGA.PUDDLE_BLUE);
    }
  }
}

export function drawLightbar(fb, x, y, tick, width = 12) {
  const half = Math.floor(width / 2);
  const redHot = tick % 4 < 2;
  const leftColor = redHot ? EGA.BRIGHT_RED : EGA.DARK_RED;
  const rightColor = redHot ? EGA.DARK_BLUE : EGA.BRIGHT_BLUE;
  fb.fillRect(x, y, half, 2, leftColor);
  fb.fillRect(x + half, y, width - half, 2, rightColor);
  fb.fillRect(x + half - 1, y, 2, 2, EGA.CHROME);
  if (redHot) {
    fb.setPixel(x - 1, y, EGA.BRIGHT_RED);
    fb.setPixel(x - 2, y + 1, EGA.DARK_RED);
    fb.setPixel(x + 2, y - 2, EGA.BRIGHT_RED);
    fb.setPixel(x + 2, y - 3, EGA.WHITE);
  } else {
    fb.setPixel(x + width, y, EGA.BRIGHT_BLUE);
    fb.setPixel(x + width + 1, y + 1, EGA.DARK_BLUE);
    fb.setPixel(x + width - 3, y - 2, EGA.BRIGHT_BLUE);
    fb.setPixel(x + width - 3, y - 3, EGA.WHITE);
  }
}

export function drawPerson(fb, x, y, opts = {}) {
  const s = opts.scale || 1;
  const p = (dx, dy, w, h, c) =>
    fb.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), c);
  const skin = opts.skin || EGA.SKIN_MARCUS;
  const skinShade = opts.skinShade || EGA.SKIN_MARCUS_DARK;
  const hair = opts.hair || EGA.HAIR_DARK;
  const top = opts.coat || EGA.COP_NAVY;
  const topShade = opts.coatShade || EGA.COP_DARK;
  const pants = opts.pants || EGA.COP_DARK;
  const pose = opts.pose || 'stand';

  // Head & cap or hair
  p(1, 2, 5, 5, skin);
  p(5, 3, 1, 4, skinShade);
  p(2, 3, 1, 1, EGA.BLACK);
  p(4, 3, 1, 1, EGA.BLACK);
  if (opts.cap) {
    p(0, 0, 7, 2, opts.cap);
    p(0, 2, 7, 1, EGA.BLACK);
    p(3, 1, 1, 1, EGA.GOLD_BADGE);
  } else {
    p(1, 0, 5, 2, hair);
    if (opts.glasses) {
      p(1, 3, 5, 1, EGA.CHROME);
    }
  }
  if (opts.ponytail) {
    p(6, 2, 2, 5, hair);
  }

  // Torso, badge, duty belt
  const slim = opts.slim ? 1 : 0;
  p(slim, 7, 7 - slim * 2, 8, top);
  p(5 - slim, 8, 2, 7, topShade);
  if (opts.badge) {
    p(4 - slim, 9, 1, 2, EGA.GOLD_BADGE);
  }
  if (opts.belt !== false) {
    p(slim, 13, 7 - slim * 2, 2, EGA.BLACK);
    p(3, 13, 1, 2, EGA.CHROME);
  }

  // Arms based on pose
  if (pose === 'aim') {
    p(7 - slim, 8, 5, 2, top);
    p(12 - slim, 8, 2, 1, skin);
    p(14 - slim, 7, 3, 1, EGA.STEEL_LIT);
    p(14 - slim, 8, 1, 2, EGA.WOOD_DARK);
  } else if (pose === 'handsup') {
    p(-2, 4, 2, 5, top);
    p(7 - slim, 4, 2, 5, top);
    p(-2, 2, 2, 2, skin);
    p(7 - slim, 2, 2, 2, skin);
  } else if (pose === 'flashlight') {
    p(-2, 8, 2, 5, top);
    p(7 - slim, 8, 4, 2, top);
    p(11 - slim, 8, 2, 1, EGA.YELLOW);
    fb.fillPolygon(
      [
        [Math.round(x + 13 * s), Math.round(y + 8 * s)],
        [Math.round(x + 28 * s), Math.round(y + 3 * s)],
        [Math.round(x + 28 * s), Math.round(y + 14 * s)],
      ],
      EGA.HEADLIGHT_CONE
    );
  } else {
    p(-1 + slim, 8, 1, 6, top);
    p(7 - slim, 8, 2, 6, topShade);
    p(-1 + slim, 14, 1, 1, skin);
    p(7 - slim, 14, 2, 1, skin);
  }

  // Legs
  if (pose === 'kneel') {
    p(0, 15, 6, 3, pants);
    p(0, 18, 3, 2, EGA.BLACK);
    p(5, 17, 3, 2, EGA.BLACK);
  } else if (pose === 'run') {
    p(0, 15, 3, 5, pants);
    p(4, 14, 3, 4, pants);
    p(-1, 20, 3, 2, EGA.BLACK);
    p(6, 18, 3, 2, EGA.BLACK);
  } else {
    p(1, 15, 2, 6, pants);
    p(4, 15, 2, 6, pants);
    p(0, 21, 3, 2, EGA.BLACK);
    p(4, 21, 3, 2, EGA.BLACK);
  }
}

export function drawMarcus(fb, x, y, opts = {}) {
  drawPerson(fb, x, y, {
    skin: EGA.SKIN_MARCUS,
    skinShade: EGA.SKIN_MARCUS_DARK,
    hair: EGA.BLACK,
    cap: opts.suit ? null : EGA.COP_NAVY,
    coat: opts.suit ? EGA.STEEL_DARK : EGA.COP_NAVY,
    coatShade: opts.suit ? EGA.WALL_DARK : EGA.COP_DARK,
    pants: opts.suit ? EGA.STEEL_DARK : EGA.COP_DARK,
    badge: true,
    belt: !opts.suit,
    ...opts,
  });
}

export function drawClaire(fb, x, y, opts = {}) {
  drawPerson(fb, x, y, {
    skin: EGA.SKIN_CLAIRE,
    skinShade: EGA.SKIN_CLAIRE_DARK,
    hair: EGA.HAIR_DARK,
    cap: EGA.COP_NAVY,
    ponytail: true,
    slim: true,
    coat: EGA.COP_NAVY,
    coatShade: EGA.COP_DARK,
    pants: EGA.COP_DARK,
    badge: true,
    belt: true,
    ...opts,
  });
}

export function drawRaincoatMan(fb, x, y, tick, opts = {}) {
  const s = opts.scale || 1;
  if (opts.umbrella !== false) {
    const ux = Math.round(x - 4 * s);
    const uy = Math.round(y - 7 * s);
    const uw = Math.round(16 * s);
    fb.fillPolygon(
      [
        [ux, uy + Math.round(4 * s)],
        [Math.round(ux + uw * 0.25), uy],
        [Math.round(ux + uw * 0.75), uy],
        [ux + uw, uy + Math.round(4 * s)],
      ],
      EGA.CAR_BLACK
    );
    fb.drawLine(Math.round(x + 4 * s), uy, Math.round(x + 4 * s), Math.round(y + 9 * s), EGA.WOOD_DARK);
  }
  drawPerson(fb, x, y, {
    skin: EGA.SKIN_LIGHT,
    skinShade: EGA.SKIN_LIGHT_DARK,
    hair: EGA.LIGHT_GRAY,
    coat: EGA.BEIGE_COAT,
    coatShade: EGA.BEIGE_SHADOW,
    pants: EGA.BEIGE_SHADOW,
    glasses: true,
    belt: true,
    scale: s,
  });
  if (opts.hasBox) {
    const bx = Math.round(x - 6 * s);
    const by = Math.round(y + 10 * s);
    const bw = Math.max(4, Math.round(6 * s));
    const bh = Math.max(3, Math.round(4 * s));
    fb.fillRect(bx, by, bw, bh, EGA.WHITE);
    fb.drawLine(bx, by + Math.floor(bh / 2), bx + bw - 1, by + Math.floor(bh / 2), EGA.BRIGHT_RED);
    fb.drawLine(bx + Math.floor(bw / 2), by, bx + Math.floor(bw / 2), by + bh - 1, EGA.BRIGHT_RED);
  }
  if (tick % 6 < 3) {
    fb.setPixel(Math.round(x + 6 * s), Math.round(y + 11 * s), EGA.GOLD_BADGE);
  }
}
