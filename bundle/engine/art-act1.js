import { EGA } from './palette.js';
import { drawRain, drawPerson, drawMarcus, drawClaire } from './art-primitives.js';
import { drawCruiserSide } from './art-vehicles.js';

export function drawBriefing(fb, state, tick) {
  // Ceiling & fluorescent light panels
  fb.fillRect(0, 0, 128, 46, EGA.WALL_DARK);
  fb.fillRect(0, 0, 128, 8, EGA.WALL_MID);
  fb.fillRect(22, 2, 32, 3, EGA.WHITE);
  fb.fillRect(74, 2, 32, 3, EGA.WHITE);
  // Tile floor
  fb.fillDitherRect(0, 46, 128, 18, EGA.WOOD_DARK, EGA.ASPHALT, 'checker');

  // Rain-streaked frosted basement window (left)
  fb.fillRect(3, 10, 20, 26, EGA.DARK_BLUE);
  fb.drawRect(3, 10, 20, 26, EGA.STEEL);
  fb.drawLine(13, 10, 13, 36, EGA.STEEL);
  fb.drawLine(3, 23, 23, 23, EGA.STEEL);
  drawRain(fb, tick, 14, { x0: 4, y0: 11, x1: 22, y1: 35 });

  // Huge wooden-framed chalkboard: BOLO 4X-8821 + BLUE VELVET + Polaroid
  fb.fillRect(30, 8, 92, 30, EGA.CHALK_GREEN);
  fb.fillDitherRect(30, 8, 92, 30, EGA.CHALK_GREEN, EGA.CHALK_DARK, 'bayer25');
  fb.drawRect(29, 7, 94, 32, EGA.WOOD_MID);
  fb.fillRect(30, 38, 92, 2, EGA.WOOD_LIT);
  fb.drawText5x5(35, 11, 'BOLO: 4X-8821', EGA.WHITE);
  fb.drawText5x5(35, 19, 'BLUE VELVET', EGA.BRIGHT_CYAN);
  // Crown-and-anchor chalk sketch & car sketch
  fb.drawRect(36, 28, 22, 7, EGA.LIGHT_GRAY);
  fb.drawText5x5(64, 28, 'MONTE CARLO', EGA.YELLOW);
  // Suspect Polaroid pinned upper right
  fb.fillRect(102, 10, 16, 16, EGA.WHITE);
  fb.fillRect(104, 12, 12, 10, EGA.SKIN_LIGHT);
  fb.fillRect(104, 12, 12, 3, EGA.BLACK);
  fb.setPixel(110, 10, EGA.BRIGHT_RED);

  // Sgt. Frank Dooley at oak podium
  drawPerson(fb, 26, 26, {
    skin: EGA.SKIN_LIGHT,
    skinShade: EGA.SKIN_LIGHT_DARK,
    hair: EGA.LIGHT_GRAY,
    coat: EGA.COP_NAVY,
    coatShade: EGA.COP_DARK,
    badge: true,
    pose: 'aim',
    scale: 1,
  });
  // Pointer stick & oak podium
  fb.drawLine(38, 33, 48, 25, EGA.WOOD_LIT);
  fb.fillRect(19, 36, 17, 16, EGA.WOOD_MID);
  fb.drawRect(19, 36, 17, 16, EGA.WOOD_DARK);

  // Seated officers Marcus Mercer & Claire Bellamy in foreground row
  drawMarcus(fb, 58, 34, { scale: 1.05 });
  drawClaire(fb, 84, 34, { scale: 1.05 });
  // Briefing desk & Claire's white styrofoam coffee cup
  fb.fillRect(50, 48, 52, 14, EGA.WOOD_MID);
  fb.fillRect(50, 48, 52, 2, EGA.WOOD_LIT);
  fb.fillRect(72, 43, 5, 5, EGA.WHITE);
  fb.fillRect(73, 43, 3, 1, EGA.WOOD_DARK);
  if (tick % 4 < 2) fb.setPixel(74, 41, EGA.LIGHT_GRAY);
}

export function drawLockerRoom(fb, state) {
  fb.fillRect(0, 0, 128, 48, EGA.WALL_DARK);
  fb.fillDitherRect(0, 48, 128, 16, EGA.WALL_MID, EGA.STEEL_DARK, 'checker');
  // Overhead industrial lamp & bold #84 banner
  fb.fillRect(34, 0, 60, 4, EGA.WALL_MID);
  fb.fillRect(50, 2, 28, 2, EGA.WHITE);
  fb.drawText5x5(53, 6, 'LOCKER 84', EGA.YELLOW);

  // Row of 5 detailed louvered steel lockers
  for (let i = 0; i < 5; i++) {
    const lx = 8 + i * 19;
    fb.fillRect(lx, 12, 17, 36, EGA.STEEL);
    fb.drawRect(lx, 12, 17, 36, EGA.BLACK);
    fb.fillRect(lx + 1, 13, 1, 34, EGA.STEEL_LIT);
    for (let v = 0; v < 3; v++) {
      fb.drawLine(lx + 3, 16 + v * 2, lx + 13, 16 + v * 2, EGA.BLACK);
    }
    fb.fillRect(lx + 13, 29, 2, 4, EGA.CHROME);
  }

  // Locker #84 is index 2 (lx = 46)
  if (state.flags?.openedLocker) {
    fb.fillRect(46, 12, 17, 36, EGA.BLACK);
    fb.fillRect(63, 12, 8, 36, EGA.STEEL_DARK);
    fb.drawRect(63, 12, 8, 36, EGA.STEEL_LIT);
    if (!state.flags?.equippedGear) {
      // Coiled Duty Belt + .38 holster + Motorola HT-220 + Field Evidence Kit
      fb.fillRect(49, 17, 11, 3, EGA.WOOD_DARK);
      fb.fillRect(54, 17, 3, 2, EGA.GOLD_BADGE);
      fb.fillRect(51, 22, 4, 6, EGA.STEEL_DARK);
      fb.fillRect(57, 21, 3, 6, EGA.BLACK);
      fb.setPixel(58, 20, EGA.CHROME);
      fb.fillRect(49, 32, 11, 7, EGA.DARK_BLUE);
      fb.drawRect(49, 32, 11, 7, EGA.BRIGHT_CYAN);
      fb.fillRect(53, 31, 3, 1, EGA.CHROME);
    }
  }

  // Key Pegboard on right wall with Unit 84 ignition & trunk keys
  fb.fillRect(102, 16, 22, 22, EGA.WOOD_MID);
  fb.drawRect(102, 16, 22, 22, EGA.WOOD_DARK);
  fb.drawText5x5(105, 18, 'KEYS', EGA.WHITE);
  if (!state.flags?.hasKeys) {
    fb.fillRect(111, 26, 4, 3, EGA.GOLD_BADGE);
    fb.fillRect(112, 29, 2, 5, EGA.CHROME);
    fb.setPixel(114, 32, EGA.CHROME);
  }

  // Foreground wooden bench & Officer Marcus Mercer
  fb.fillRect(14, 52, 80, 4, EGA.WOOD_MID);
  fb.fillRect(20, 56, 4, 8, EGA.WOOD_DARK);
  fb.fillRect(82, 56, 4, 8, EGA.WOOD_DARK);
  drawMarcus(fb, 34, 31, { scale: 1.15 });
}

export function drawMotorPoolYard(fb, state, tick) {
  fb.fillDitherRect(0, 0, 128, 42, EGA.SKY_TOP, EGA.SKY_HORIZON, 'vgrad');
  // Red-brick precinct motor pool facade & bay doors
  fb.fillDitherRect(0, 12, 128, 30, EGA.BRICK_RED, EGA.BRICK_DARK, 'hstripe');
  fb.fillRect(42, 18, 44, 24, EGA.WALL_DARK);
  fb.drawRect(42, 18, 44, 24, EGA.BLACK);
  fb.drawText5x5(49, 13, 'MOTOR POOL', EGA.YELLOW);

  // Warm sodium floodlight fixture & dithered amber light cone
  fb.fillRect(14, 7, 10, 4, EGA.SODIUM_AMBER);
  fb.fillPolygon([[15, 11], [23, 11], [44, 44], [2, 44]], EGA.AMBER_GLOW);

  // Rain-slicked asphalt yard
  fb.fillDitherRect(0, 42, 128, 22, EGA.WET_ASPHALT, EGA.ASPHALT_DARK, 'checker');
  fb.fillDitherRect(34, 56, 56, 5, EGA.ASPHALT, EGA.AMBER_GLOW, 'checker');

  // Detailed Patrol Cruiser #84
  drawCruiserSide(fb, 38, 35, tick, false, {
    trunkOpen: Boolean(state.flags?.inspectedTrunk),
    showNailWarning: !state.flags?.inspectedTires,
  });

  // Marcus & Claire doing the walk-around
  drawMarcus(fb, 24, 33, { scale: 1.05 });
  drawClaire(fb, 96, 33, { scale: 1.05 });
  // Claire's two clipboards
  fb.fillRect(92, 42, 5, 6, EGA.WOOD_MID);
  fb.fillRect(93, 41, 3, 1, EGA.CHROME);
  drawRain(fb, tick, 54);
}
