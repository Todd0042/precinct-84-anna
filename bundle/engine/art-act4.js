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
import { drawCruiserSide } from './art-vehicles.js';

export function drawPierExterior(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 20, tick);
  // Harbor water & gantry crane silhouette
  fb.fillDitherRect(0, 42, 128, 22, EGA.HARBOR_DEEP, EGA.HARBOR_MID, 'checker');
  for (let w = 0; w < 14; w++) {
    fb.fillRect((w * 11 + tick * 2) % 120, 45 + (w % 5) * 3, 7, 1, EGA.PUDDLE_BLUE);
  }
  fb.drawLine(10, 42, 16, 6, EGA.STEEL_DARK);
  fb.drawLine(16, 6, 40, 12, EGA.STEEL_DARK);

  // Corrugated steel Pier 84 Cannery facade & upper catwalk
  fb.fillDitherRect(24, 12, 98, 30, EGA.STEEL_DARK, EGA.WALL_MID, 'vstripe');
  fb.drawRect(24, 12, 98, 30, EGA.BLACK);
  fb.fillRect(49, 15, 33, 9, EGA.BLACK);
  fb.drawText5x5(52, 17, 'PIER 84', EGA.BRIGHT_CYAN);
  fb.fillRect(24, 24, 98, 2, EGA.BLACK);
  // Lookouts on catwalk + exterior alarm box
  fb.fillRect(66, 20, 3, 4, EGA.CAR_BLACK);
  fb.fillRect(92, 20, 3, 4, EGA.CAR_BLACK);
  fb.fillRect(29, 31, 6, 7, state.flags?.alarmDisabled ? EGA.STEEL : EGA.BRIGHT_RED);
  if (!state.flags?.alarmDisabled && tick % 2 === 0) {
    fb.setPixel(31, 33, EGA.YELLOW);
  }

  // Metro SWAT van + crimson sniper laser dots when called
  if (state.flags?.swatCalled) {
    fb.fillRect(2, 34, 26, 12, EGA.CAR_BLACK);
    fb.drawText5x5(6, 37, 'SWAT', EGA.WHITE);
    fb.drawCircle(7, 46, 3, EGA.TIRE_RUBBER, true);
    fb.drawCircle(22, 46, 3, EGA.TIRE_RUBBER, true);
    fb.setPixel(67, 21, EGA.BRIGHT_RED);
    fb.setPixel(93, 21, EGA.BRIGHT_RED);
    fb.drawLine(18, 34, 67, 21, EGA.DARK_RED);
  }
  drawMarcus(fb, 42, 30, { scale: 0.92, pose: 'aim' });
  drawClaire(fb, 34, 31, { scale: 0.92 });
  drawRain(fb, tick, 38);
}

export function drawPierInterior(fb, state, tick) {
  fb.fillDitherRect(0, 0, 128, 64, EGA.BLACK, EGA.ASPHALT_DARK, 'bayer25');
  // Steel overhead rafters & upper catwalk
  for (let rx = 8; rx < 128; rx += 24) {
    fb.drawLine(rx, 0, rx + 12, 12, EGA.WALL_DARK);
    fb.drawLine(rx + 12, 0, rx, 12, EGA.WALL_DARK);
  }
  fb.fillRect(0, 15, 128, 3, EGA.STEEL);

  // Chemical vats & halibut crates right side
  fb.fillRect(72, 26, 20, 24, EGA.DARK_BLUE);
  fb.fillRect(74, 28, 16, 5, EGA.BRIGHT_CYAN);
  fb.fillRect(96, 26, 20, 24, EGA.DARK_CYAN);
  fb.fillRect(70, 50, 52, 14, EGA.WALL_DARK);
  fb.fillRect(54, 42, 14, 12, EGA.WOOD_MID);

  // Bright yellow forklift in foreground left
  fb.fillRect(10, 34, 28, 18, EGA.YELLOW);
  fb.fillRect(16, 22, 14, 12, EGA.BLACK);
  fb.drawRect(16, 22, 14, 12, EGA.STEEL);
  fb.fillRect(6, 22, 3, 30, EGA.STEEL_DARK);
  fb.drawCircle(15, 52, 4, EGA.TIRE_RUBBER, true);
  fb.drawCircle(33, 52, 4, EGA.TIRE_RUBBER, true);

  // Upper catwalk gunman + muzzle flash until neutralized
  if (!state.flags?.enforcerDown) {
    drawPerson(fb, 94, 1, {
      skin: EGA.SKIN_LIGHT,
      coat: EGA.CAR_BLACK,
      pants: EGA.CAR_BLACK,
      pose: 'aim',
      scale: 0.72,
      belt: false,
    });
    if (tick % 3 === 0) {
      fb.fillRect(104, 7, 5, 3, EGA.YELLOW);
      fb.setPixel(109, 8, EGA.FIRE_ORANGE);
    }
  }
  if (state.flags?.announcedPolice) {
    drawPerson(fb, 66, 35, { skin: EGA.SKIN_LIGHT, coat: EGA.WHITE, pose: 'handsup', scale: 0.82, belt: false });
  }
  drawMarcus(fb, state.flags?.pierCover ? 26 : 44, 34, { pose: 'aim', scale: 0.98 });
  drawClaire(fb, 40, 36, { pose: 'kneel', scale: 0.95 });
}

export function drawPierOffice(fb, state, tick) {
  fb.fillRect(0, 0, 128, 46, EGA.WALL_DARK);
  fb.fillDitherRect(0, 46, 128, 18, EGA.WOOD_DARK, EGA.BLACK, 'checker');
  // Multi-pane rain window overlooking harbor
  fb.fillDitherRect(6, 5, 68, 25, EGA.SKY_TOP, EGA.DARK_BLUE, 'vgrad');
  fb.drawRect(6, 5, 68, 25, EGA.STEEL);
  fb.drawLine(40, 5, 40, 30, EGA.STEEL);
  drawRain(fb, tick, 20, { x0: 7, y0: 6, x1: 73, y1: 29 });

  // Roaring 55-gallon incinerator drum with animated flames
  fb.fillRect(98, 29, 20, 24, EGA.CAR_BLACK);
  fb.drawRect(98, 29, 20, 24, EGA.STEEL_DARK);
  const fOff = tick % 2;
  fb.fillPolygon([[100, 29], [104, 17 - fOff], [108, 25], [112, 16 + fOff], [116, 29]], EGA.FIRE_ORANGE);
  fb.fillPolygon([[103, 29], [107, 21 - fOff], [113, 29]], EGA.FLAME_YELLOW);

  // Victor "The Viper" Castellano in pinstripe suit beside incinerator
  drawPerson(fb, 80, 24, {
    skin: EGA.SKIN_LIGHT,
    skinShade: EGA.SKIN_LIGHT_DARK,
    hair: EGA.LIGHT_GRAY,
    coat: EGA.CAR_BLACK,
    coatShade: EGA.WALL_DARK,
    pants: EGA.CAR_BLACK,
    pose: state.flags?.castellanoCuffed ? 'handsup' : 'stand',
    belt: false,
  });

  // Mahogany boss desk: second steaming teacup, Rossi's Pastries box & Master Ledger
  fb.fillRect(28, 41, 60, 13, EGA.WOOD_MID);
  fb.fillRect(28, 41, 60, 2, EGA.WOOD_LIT);
  // White Rossi's box with untied red twine
  fb.fillRect(34, 36, 11, 5, EGA.WHITE);
  fb.drawLine(33, 39, 46, 38, EGA.BRIGHT_RED);
  // Steaming porcelain teacup
  fb.fillRect(51, 37, 5, 4, EGA.WHITE);
  fb.setPixel(53, 34 - (tick % 2), EGA.LIGHT_GRAY);
  fb.setPixel(54, 32 - ((tick + 1) % 2), EGA.FOG_GRAY);
  if (!state.flags?.hasMasterLedger) {
    fb.fillRect(62, 37, 14, 4, EGA.BRIGHT_RED);
    fb.drawRect(62, 37, 14, 4, EGA.GOLD_BADGE);
  }
  drawMarcus(fb, 14, 28, { pose: state.flags?.weaponDrawn ? 'aim' : 'stand', scale: 1.02 });
  drawClaire(fb, 3, 29, { scale: 0.98 });
}

export function drawPierStreetTwist(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 28, tick);
  drawWetStreet(fb, 34, 30, EGA.PUDDLE_BLUE);
  // Railroad tracks & streetlamp amber cone across tracks
  fb.drawLine(0, 38, 128, 38, EGA.STEEL);
  fb.drawLine(0, 41, 128, 41, EGA.STEEL);
  for (let tx = 4; tx < 128; tx += 8) {
    fb.drawLine(tx, 37, tx + 2, 42, EGA.WOOD_DARK);
  }
  fb.fillRect(98, 8, 3, 28, EGA.STEEL_DARK);
  fb.fillRect(94, 7, 11, 3, tick % 7 === 0 ? EGA.DIM_AMBER : EGA.SODIUM_AMBER);
  fb.fillPolygon([[95, 10], [104, 10], [118, 36], [82, 36]], EGA.AMBER_GLOW);

  // Flashing Unit 84 + yellow POLICE LINE tape + railroad crossbuck
  drawCruiserSide(fb, 2, 34, tick, true);
  for (let x = 2; x < 74; x += 6) {
    fb.fillRect(x, 49, 3, 2, EGA.YELLOW);
    fb.fillRect(x + 3, 49, 3, 2, EGA.BLACK);
  }
  fb.fillRect(118, 22, 2, 20, EGA.WOOD_MID);
  fb.drawLine(114, 22, 124, 28, EGA.WHITE);
  fb.drawLine(124, 22, 114, 28, EGA.WHITE);
  // Storm drain & red twine glint
  fb.fillRect(64, 56, 12, 4, EGA.BLACK);
  fb.drawLine(66, 57, 73, 58, EGA.BRIGHT_RED);

  // The exact same Man in the Beige Raincoat standing calmly beneath the lamp
  drawRaincoatMan(fb, 92, 20, tick, { scale: 0.88, hasBox: false, umbrella: true });
  drawMarcus(fb, 48, 33, { scale: 1.05 });
  drawClaire(fb, 60, 34, { scale: 1.02 });
  drawRain(fb, tick, 50);
}

export function drawEpilogue(fb, state, tick) {
  // Morning assembly hall & detective bullpen
  fb.fillDitherRect(0, 0, 128, 44, EGA.DARK_BLUE, EGA.SKY_HORIZON, 'vgrad');
  fb.fillDitherRect(0, 44, 128, 20, EGA.WOOD_MID, EGA.WOOD_DARK, 'checker');
  // US & Precinct flags left
  fb.fillRect(8, 10, 26, 16, EGA.DARK_RED);
  fb.fillRect(8, 10, 11, 8, EGA.BRIGHT_BLUE);
  fb.fillRect(38, 6, 82, 13, EGA.BLACK);
  fb.drawRect(38, 6, 82, 13, EGA.GOLD_BADGE);
  fb.drawText5x5(46, 10, 'DETECTIVE 084', EGA.YELLOW);

  // Sgt. Dooley, newly promoted Detective Marcus Mercer (gold shield!), and Claire
  drawPerson(fb, 38, 25, { skin: EGA.SKIN_LIGHT, hair: EGA.LIGHT_GRAY, coat: EGA.COP_NAVY, badge: true, scale: 1.02 });
  drawMarcus(fb, 60, 24, { suit: true, scale: 1.1 });
  fb.fillRect(64, 33, 3, 3, tick % 2 === 0 ? EGA.GOLD_BADGE : EGA.WHITE);
  drawClaire(fb, 82, 25, { scale: 1.04 });

  // Forefront detective desk: Rossi's cannoli bag + CASE FILE #84-002 with red twine
  fb.fillRect(18, 48, 92, 16, EGA.WOOD_MID);
  fb.fillRect(18, 48, 92, 2, EGA.WOOD_LIT);
  fb.fillRect(24, 41, 10, 7, EGA.WHITE);
  fb.drawLine(25, 44, 32, 44, EGA.BRIGHT_RED);
  fb.fillRect(72, 42, 34, 16, EGA.BEIGE_LIGHT);
  fb.drawRect(72, 42, 34, 16, EGA.BEIGE_SHADOW);
  fb.drawText5x5(75, 45, '84-002', EGA.BLACK);
  fb.drawLine(75, 53, 102, 53, EGA.BRIGHT_RED);
}
