import { EGA } from './palette.js';
import { drawLightbar } from './art-primitives.js';

export function drawCruiserSide(fb, x, y, tick, lightsOn = false, opts = {}) {
  // Body: black-and-white 1984 Oakland/Oakridge police cruiser silhouette (48x18)
  fb.fillRect(x + 2, y + 6, 44, 8, EGA.CAR_BLACK);
  fb.fillRect(x + 14, y + 6, 20, 8, EGA.WHITE);
  fb.fillPolygon(
    [
      [x + 11, y + 6],
      [x + 16, y + 1],
      [x + 31, y + 1],
      [x + 36, y + 6],
    ],
    EGA.WHITE
  );
  // Cabin windows
  fb.fillPolygon(
    [
      [x + 13, y + 6],
      [x + 17, y + 2],
      [x + 23, y + 2],
      [x + 23, y + 6],
    ],
    EGA.CAR_GLASS
  );
  fb.fillPolygon(
    [
      [x + 25, y + 2],
      [x + 30, y + 2],
      [x + 34, y + 6],
      [x + 25, y + 6],
    ],
    EGA.CAR_GLASS
  );
  // Door badge #84, trim, chrome bumpers & grille/lights
  fb.drawText5x5(x + 19, y + 7, '84', EGA.COP_NAVY);
  fb.fillRect(x, y + 11, 3, 2, EGA.CHROME);
  fb.fillRect(x + 45, y + 11, 3, 2, EGA.CHROME);
  fb.fillRect(x + 1, y + 8, 2, 2, EGA.DARK_RED);
  fb.fillRect(x + 45, y + 8, 2, 2, EGA.YELLOW);
  if (opts.headlights) {
    fb.fillPolygon(
      [
        [x + 47, y + 8],
        [x + 76, y + 3],
        [x + 76, y + 16],
        [x + 47, y + 10],
      ],
      EGA.HEADLIGHT_CONE
    );
  }
  if (opts.trunkOpen) {
    fb.drawLine(x + 2, y + 6, x + 7, y + 1, EGA.CHROME);
    fb.fillRect(x + 4, y + 4, 4, 2, EGA.FIRE_ORANGE);
  }

  // Wheels & hubcaps
  for (const wx of [x + 10, x + 37]) {
    fb.drawCircle(wx, y + 14, 4, EGA.TIRE_RUBBER, true);
    fb.drawCircle(wx, y + 14, 2, EGA.CHROME, true);
    fb.setPixel(wx, y + 14, EGA.DARK_GRAY);
  }
  if (opts.showNailWarning && tick % 6 < 3) {
    fb.setPixel(x + 37, y + 17, EGA.BRIGHT_RED);
    fb.setPixel(x + 38, y + 18, EGA.YELLOW);
    fb.setPixel(x + 36, y + 18, EGA.YELLOW);
  }

  // AeroDynic Roof Lightbar
  if (lightsOn) {
    drawLightbar(fb, x + 18, y - 1, tick, 11);
  } else {
    fb.fillRect(x + 19, y - 1, 4, 1, EGA.DARK_RED);
    fb.fillRect(x + 23, y - 1, 2, 1, EGA.CHROME);
    fb.fillRect(x + 25, y - 1, 4, 1, EGA.DARK_BLUE);
  }
}

export function drawMonteCarloSide(fb, x, y, wrecked = false, tick = 0) {
  fb.fillRect(x + 1, y + 6, 44, 7, EGA.CAR_BLACK);
  fb.fillRect(x + 2, y + 6, 40, 1, EGA.CAR_SHEEN);
  fb.fillPolygon(
    [
      [x + 12, y + 6],
      [x + 18, y + 1],
      [x + 32, y + 1],
      [x + 38, y + 6],
    ],
    EGA.CAR_BLACK
  );
  fb.fillPolygon(
    [
      [x + 14, y + 6],
      [x + 19, y + 2],
      [x + 29, y + 2],
      [x + 32, y + 6],
    ],
    EGA.CAR_GLASS
  );
  fb.fillRect(x, y + 10, 3, 2, EGA.CHROME);
  fb.fillRect(x + 43, y + 10, 3, 2, EGA.CHROME);
  fb.fillRect(x + 1, y + 8, 2, 2, EGA.BRIGHT_RED);
  for (const wx of [x + 10, x + 36]) {
    fb.drawCircle(wx, y + 13, 3, EGA.TIRE_RUBBER, true);
    fb.drawCircle(wx, y + 13, 1, EGA.CHROME, true);
  }
  if (wrecked) {
    fb.fillRect(x + 41, y + 7, 5, 5, EGA.DARK_GRAY);
    const sy = y - 1 - (tick % 4);
    fb.drawCircle(x + 40, sy, 3, EGA.LIGHT_GRAY, true);
    fb.drawCircle(x + 44, sy - 2, 2, EGA.FOG_GRAY, true);
  }
}

export function drawCockpitOverlay(fb, tick, state) {
  const wiperAngle = Math.sin(tick * 0.55);
  // Roofliner, A-pillars & rearview mirror
  fb.fillRect(0, 0, 128, 3, EGA.BLACK);
  fb.fillRect(0, 3, 128, 1, EGA.WALL_DARK);
  fb.fillPolygon([[0, 3], [8, 3], [16, 42], [0, 42]], EGA.CAR_BLACK);
  fb.fillPolygon([[120, 3], [128, 3], [128, 42], [112, 42]], EGA.CAR_BLACK);
  fb.fillRect(54, 4, 20, 4, EGA.BLACK);
  fb.drawRect(54, 4, 20, 4, EGA.STEEL);
  if (state.flags?.lightsOn) {
    drawLightbar(fb, 58, 1, tick, 12);
    fb.fillRect(56, 5, 16, 2, tick % 4 < 2 ? EGA.BRIGHT_RED : EGA.BRIGHT_BLUE);
  }

  // Twin sweeping windshield wipers
  const wx1 = Math.round(44 + wiperAngle * 18);
  const wx2 = Math.round(86 + wiperAngle * 18);
  fb.drawLine(34, 42, wx1, 22, EGA.BLACK);
  fb.drawLine(wx1 - 5, 24, wx1 + 4, 20, EGA.STEEL_DARK);
  fb.drawLine(76, 42, wx2, 22, EGA.BLACK);
  fb.drawLine(wx2 - 5, 24, wx2 + 4, 20, EGA.STEEL_DARK);

  // Dashboard hood & padded fascia
  fb.fillRect(0, 42, 128, 22, EGA.CAR_BLACK);
  fb.fillRect(0, 42, 128, 2, EGA.WALL_DARK);
  fb.fillRect(0, 44, 128, 1, EGA.STEEL_DARK);

  // Instrument cluster with speedometer (kept clear above wheel spokes)
  fb.fillRect(20, 46, 38, 11, EGA.WALL_DARK);
  fb.fillRect(22, 47, 34, 9, EGA.BLACK);
  let speedStr = '00';
  if (state.scene === 'pursuit_active') {
    speedStr = state.pursuitStage === 0 ? '75' : state.pursuitStage === 1 ? '85' : state.pursuitStage === 2 ? '95' : '25';
  }
  fb.drawText5x5(24, 48, speedStr, EGA.DASH_GREEN);
  fb.drawText5x5(35, 48, 'MPH', EGA.FOG_GRAY);
  fb.fillRect(24, 54, 28, 1, state.flags?.seatbeltOn ? EGA.DASH_GREEN : EGA.BRIGHT_RED);

  // Lower-mounted 3-spoke cruiser steering wheel (unobstructed binnacle)
  fb.drawCircle(39, 64, 9, EGA.LIGHT_GRAY, false);
  fb.drawCircle(39, 64, 8, EGA.STEEL_DARK, false);
  fb.drawLine(31, 61, 47, 61, EGA.DARK_GRAY);
  fb.fillRect(37, 59, 5, 4, EGA.COP_NAVY);

  // Dash Motorola radio console
  fb.fillRect(64, 47, 34, 13, EGA.WALL_MID);
  fb.fillRect(66, 49, 30, 9, EGA.BLACK);
  fb.drawText5x5(68, 50, state.flags?.called1080 ? '10-80' : '10-8', EGA.BRIGHT_CYAN);
  fb.fillRect(90, 50, 4, 3, state.flags?.called1080 ? EGA.BRIGHT_RED : EGA.DASH_GREEN);
  fb.drawLine(69, 58, 72, 63, EGA.STEEL);

  // Claire Bellamy in shotgun seat foreground
  fb.fillRect(104, 37, 15, 27, EGA.COP_NAVY);
  fb.fillRect(107, 37, 3, 4, EGA.GOLD_BADGE);
  fb.fillRect(107, 29, 8, 8, EGA.SKIN_CLAIRE);
  fb.fillRect(106, 27, 10, 3, EGA.COP_NAVY);
  fb.fillRect(114, 29, 3, 7, EGA.HAIR_DARK);
}
