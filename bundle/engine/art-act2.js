import { EGA } from './palette.js';
import {
  drawNightSkyAndSkyline,
  drawWetStreet,
  drawRain,
  drawPerson,
  drawMarcus,
  drawClaire,
  drawRaincoatMan,
} from './art-primitives.js';
import {
  drawCruiserSide,
  drawMonteCarloSide,
  drawCockpitOverlay,
} from './art-vehicles.js';

export function drawCrosswalkRedlight(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 28, tick);
  // Storefronts framing 4th & Union (kept clear of A-pillars)
  fb.fillDitherRect(8, 10, 34, 22, EGA.BRICK_RED, EGA.BRICK_DARK, 'hstripe');
  fb.fillRect(15, 17, 24, 8, EGA.AMBER_GLOW);
  fb.drawText5x5(17, 19, 'ROSSI', EGA.YELLOW);
  fb.fillDitherRect(88, 8, 34, 24, EGA.WALL_DARK, EGA.BLACK, 'bayer25');
  fb.fillRect(92, 17, 20, 8, EGA.DARK_CYAN);

  // Wet asphalt & zebra crosswalk stripes
  drawWetStreet(fb, 30, 14, EGA.DARK_RED);
  for (let x = 24; x < 104; x += 12) {
    fb.fillRect(x, 35, 8, 4, EGA.LIGHT_GRAY);
  }

  // Hanging red traffic light signal clear of rearview mirror + wet reflection
  fb.drawLine(0, 11, 128, 11, EGA.BLACK);
  fb.fillRect(72, 9, 9, 13, EGA.BLACK);
  fb.drawCircle(76, 13, 2, EGA.BRIGHT_RED, true);
  fb.drawCircle(76, 18, 2, EGA.WALL_DARK, true);
  fb.fillDitherRect(72, 31, 8, 11, EGA.DARK_RED, EGA.WET_ASPHALT, 'checker');

  // The Man in the Beige Raincoat crossing calmly with Rossi's Pastries box & umbrella
  const px = 58 + Math.round(Math.sin(tick * 0.22) * 8);
  drawRaincoatMan(fb, px, 21, tick, { scale: 0.9, hasBox: true, umbrella: true });

  drawRain(fb, tick, 44, { x0: 0, y0: 0, x1: 128, y1: 42 });
  drawCockpitOverlay(fb, tick, state);
}

export function drawPursuit(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 20, tick);
  const stage = state.pursuitStage || 0;

  // Perspective wet avenue scrolling under cruiser headlights
  fb.fillPolygon([[0, 42], [44, 20], [84, 20], [128, 42]], EGA.ASPHALT);
  for (let i = 0; i < 6; i++) {
    const ry = 21 + ((i * 4 + tick * 2) % 20);
    fb.fillRect(63, ry, 2, 2, EGA.YELLOW);
  }

  if (stage === 0) {
    // Fleeing black '83 Chevy Monte Carlo 4X-8821 ahead
    fb.fillRect(48, 22, 32, 10, EGA.CAR_BLACK);
    fb.fillPolygon([[52, 22], [56, 17], [72, 17], [76, 22]], EGA.CAR_GLASS);
    fb.fillRect(49, 28, 7, 3, EGA.BRIGHT_RED);
    fb.fillRect(72, 28, 7, 3, EGA.BRIGHT_RED);
    fb.fillRect(59, 29, 10, 3, EGA.CHROME);
    fb.drawText5x5(50, 7, '4X-8821', EGA.YELLOW);
  } else if (stage === 1) {
    // 7th & Market: spinning Fish Delivery Van blocking center & right lanes
    fb.fillRect(48, 16, 62, 20, EGA.WHITE);
    fb.fillRect(50, 18, 58, 16, EGA.BRIGHT_CYAN);
    fb.fillRect(48, 28, 62, 4, EGA.COP_NAVY);
    fb.drawText5x5(54, 20, 'FISH CO', EGA.DARK_BLUE);
    fb.drawCircle(58, 36, 4, EGA.BLACK, true);
    fb.drawCircle(96, 36, 4, EGA.BLACK, true);
    if (tick % 4 < 2) {
      fb.drawText5x5(18, 24, '<<', EGA.BRIGHT_GREEN);
    }
  } else if (stage === 2) {
    // Harbor Expressway viaduct girders + jackknifed 18-wheeler diesel smoke
    fb.fillRect(0, 6, 128, 12, EGA.STEEL_DARK);
    for (let gx = 10; gx < 120; gx += 16) {
      fb.drawLine(gx, 6, gx + 8, 18, EGA.STEEL);
    }
    fb.fillRect(28, 18, 74, 15, EGA.STEEL);
    fb.fillRect(30, 20, 70, 9, EGA.CHROME);
    for (let s = 0; s < 14; s++) {
      const sx = 20 + ((s * 11 + tick * 3) % 88);
      const sy = 16 + ((s * 5 + tick) % 18);
      fb.drawCircle(sx, sy, 5, s % 2 === 0 ? EGA.FOG_GRAY : EGA.LIGHT_GRAY, true);
    }
  } else {
    // Foundry alleys: brick tunnel walls, chain-link fence & muddy ruts + steam
    fb.fillDitherRect(0, 4, 34, 38, EGA.BRICK_RED, EGA.BRICK_DARK, 'hstripe');
    fb.fillDitherRect(94, 4, 34, 38, EGA.BRICK_RED, EGA.BRICK_DARK, 'hstripe');
    fb.drawLine(46, 41, 56, 26, EGA.WOOD_DARK);
    fb.drawLine(82, 41, 72, 26, EGA.WOOD_DARK);
    for (let fx = 36; fx < 92; fx += 5) {
      fb.drawLine(fx, 14, fx, 28, EGA.STEEL);
    }
    fb.fillRect(52, 23, 24, 9, EGA.CAR_BLACK);
    const sy = 16 - (tick % 4);
    fb.drawCircle(64, sy, 4, EGA.WHITE, true);
    fb.drawCircle(69, sy - 2, 3, EGA.LIGHT_GRAY, true);
  }

  drawRain(fb, tick, 52, { x0: 0, y0: 0, x1: 128, y1: 42 });
  drawCockpitOverlay(fb, tick, state);
}

export function drawFelonyStop(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 26, tick);
  // Chain-link rail yard fence
  for (let fx = 0; fx < 128; fx += 6) {
    fb.drawLine(fx, 20, fx, 36, EGA.STEEL_DARK);
  }
  fb.fillRect(0, 20, 128, 1, EGA.STEEL);
  drawWetStreet(fb, 36, 28, EGA.PUDDLE_BLUE);

  // Wrecked Monte Carlo into rail fence + Cruiser #84 with takedown spotlight
  drawMonteCarloSide(fb, 78, 28, true, tick);
  if (state.flags?.trunkSearched) {
    fb.drawLine(78, 34, 83, 26, EGA.CHROME);
    fb.fillRect(80, 31, 4, 3, EGA.BRIGHT_CYAN);
  }
  drawCruiserSide(fb, 4, 35, tick, true, { headlights: true });

  // Officers behind door cover & flashlight beam
  drawMarcus(fb, 42, 30, {
    pose: state.flags?.weaponDrawn ? 'aim' : 'stand',
    scale: 1.05,
  });
  drawClaire(fb, 24, 32, { pose: 'flashlight', scale: 1.0 });

  // Eddie Rourke (defiant, kneeling with hands up, or cuffed beside Unit 84)
  if (state.flags?.eddieCuffed) {
    drawPerson(fb, 54, 34, {
      skin: EGA.SKIN_LIGHT,
      skinShade: EGA.SKIN_LIGHT_DARK,
      coat: EGA.WOOD_DARK,
      pants: EGA.CAR_BLACK,
      pose: 'kneel',
      belt: false,
    });
  } else {
    drawPerson(fb, 70, state.flags?.suspectCompliant ? 34 : 30, {
      skin: EGA.SKIN_LIGHT,
      skinShade: EGA.SKIN_LIGHT_DARK,
      coat: EGA.WOOD_DARK,
      pants: EGA.CAR_BLACK,
      pose: state.flags?.suspectCompliant ? 'kneel' : 'handsup',
      belt: false,
    });
  }
  drawRain(fb, tick, 44);
}

export function drawInterrogationRoom(fb, state, tick) {
  // Dark cinderblock room & two-way mirror with Sgt. Dooley silhouette
  fb.fillDitherRect(0, 0, 128, 48, EGA.WALL_DARK, EGA.BLACK, 'bayer25');
  fb.fillDitherRect(0, 48, 128, 16, EGA.WALL_MID, EGA.ASPHALT_DARK, 'checker');
  fb.fillRect(32, 6, 64, 20, EGA.DARK_BLUE);
  fb.drawRect(31, 5, 66, 22, EGA.STEEL);
  // Subtle Sgt. Dooley watching behind observation glass
  fb.fillRect(60, 12, 8, 13, EGA.NIGHT_SKY);
  fb.drawCircle(64, 10, 3, EGA.SKY_HORIZON, true);

  // Chiaroscuro pendant lamp & dramatic cone light beam
  fb.drawLine(64, 0, 64, 8, EGA.BLACK);
  fb.fillPolygon([[56, 13], [72, 13], [67, 8], [61, 8]], EGA.CHROME);
  fb.fillPolygon([[54, 13], [74, 13], [102, 42], [26, 42]], EGA.AMBER_GLOW);

  // Characters: Marcus left, Eddie sweating opposite, Claire standing guard right
  drawMarcus(fb, 34, 24, { scale: 1.05 });
  drawPerson(fb, 84, 24, {
    skin: EGA.SKIN_LIGHT,
    skinShade: EGA.SKIN_LIGHT_DARK,
    coat: EGA.WOOD_DARK,
    pants: EGA.CAR_BLACK,
    belt: false,
  });
  drawClaire(fb, 110, 22, { scale: 1.1 });

  // Steel interrogation table
  fb.fillRect(30, 42, 68, 6, EGA.STEEL);
  fb.fillRect(30, 42, 68, 1, EGA.CHROME);
  fb.fillRect(38, 48, 5, 16, EGA.STEEL_DARK);
  fb.fillRect(85, 48, 5, 16, EGA.STEEL_DARK);

  // Dual-reel tape recorder on table
  fb.fillRect(36, 35, 18, 7, EGA.CAR_BLACK);
  fb.drawCircle(41, 38, 2, EGA.CHROME, tick % 2 === 0);
  fb.drawCircle(49, 38, 2, EGA.CHROME, tick % 2 !== 0);
  fb.setPixel(52, 36, state.flags?.recorderOn && tick % 2 === 0 ? EGA.BRIGHT_RED : EGA.DARK_RED);

  // Evidence props as interrogated
  if (state.flags?.showedDrugs) {
    fb.fillRect(58, 37, 12, 5, EGA.BRIGHT_CYAN);
    fb.drawRect(58, 37, 12, 5, EGA.WHITE);
  }
  if (state.flags?.showedPager) {
    fb.fillRect(73, 38, 7, 4, EGA.BLACK);
    fb.setPixel(76, 39, tick % 2 === 0 ? EGA.BRIGHT_RED : EGA.YELLOW);
  }
}
