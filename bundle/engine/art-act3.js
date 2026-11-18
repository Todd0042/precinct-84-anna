import { EGA } from './palette.js';
import {
  drawNightSkyAndSkyline,
  drawWetStreet,
  drawRain,
  drawPerson,
  drawMarcus,
  drawClaire,
} from './art-primitives.js';
import { drawCruiserSide } from './art-vehicles.js';

export function drawMotelExterior(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 20, tick);

  // Two-story cinderblock Starlight Motor Court building & balcony rail
  fb.fillDitherRect(34, 14, 92, 34, EGA.WALL_DARK, EGA.WALL_MID, 'bayer25');
  fb.fillRect(32, 12, 96, 3, EGA.BLACK);
  fb.fillRect(34, 28, 92, 3, EGA.STEEL_DARK);
  for (let rx = 36; rx < 124; rx += 5) {
    fb.drawLine(rx, 24, rx, 28, EGA.STEEL);
  }
  fb.drawLine(34, 24, 126, 24, EGA.STEEL_LIT);

  // Room 209 door & amber curtained window + copper tripwire glint
  fb.fillRect(68, 17, 15, 11, EGA.WOOD_MID);
  fb.drawRect(68, 17, 15, 11, EGA.WOOD_DARK);
  fb.drawText5x5(70, 9, '209', EGA.YELLOW);
  fb.fillRect(92, 16, 18, 9, EGA.SODIUM_AMBER);
  fb.fillRect(99, 17, 4, 7, EGA.DIM_AMBER);
  if (state.flags?.stoodAside) {
    fb.setPixel(81, 22, EGA.GOLD_BADGE);
  } else if (!state.flags?.survivedTrap && tick % 4 < 2) {
    fb.setPixel(81, 22, EGA.FIRE_ORANGE);
    fb.setPixel(82, 21, EGA.BRIGHT_RED);
  }

  // Tall buzzing pink/cyan Starlight Motel neon sign
  const neonPink = tick % 6 !== 0 ? EGA.NEON_PINK : EGA.DARK_MAGENTA;
  const neonCyan = tick % 4 !== 0 ? EGA.NEON_CYAN : EGA.DARK_CYAN;
  fb.fillRect(15, 22, 3, 28, EGA.STEEL_DARK);
  fb.fillRect(3, 4, 28, 19, EGA.BLACK);
  fb.drawRect(3, 4, 28, 19, neonPink);
  fb.drawText5x5(6, 7, 'STAR', neonCyan);
  fb.drawText5x5(6, 15, 'MOTEL', neonPink);

  // Wet parking lot reflecting neon & sodium lights
  drawWetStreet(fb, 48, 16, EGA.PUDDLE_BLUE);
  fb.fillDitherRect(6, 51, 22, 5, neonPink, EGA.WET_ASPHALT, 'checker');
  fb.fillDitherRect(88, 52, 22, 4, EGA.DIM_AMBER, EGA.WET_ASPHALT, 'checker');

  // Marcus (standing aside vs in fatal funnel) and Claire covering from wall
  const marcusX = state.flags?.stoodAside ? 55 : 72;
  drawMarcus(fb, marcusX, 26, { scale: 0.9 });
  drawClaire(fb, 42, 26, { scale: 0.9, pose: 'aim' });
  drawRain(fb, tick, 48);
}

export function drawMotelAlley(fb, state, tick) {
  drawNightSkyAndSkyline(fb, 14, tick);
  // Perspective brick alley walls + fire escape + chain-link gate
  fb.fillPolygon([[0, 0], [42, 16], [42, 44], [0, 64]], EGA.BRICK_DARK);
  fb.fillPolygon([[128, 0], [86, 16], [86, 44], [128, 64]], EGA.BRICK_RED);
  for (let fy = 12; fy < 36; fy += 6) {
    fb.drawLine(88, fy, 114, fy - 4, EGA.BLACK);
  }
  drawWetStreet(fb, 42, 22, EGA.HEADLIGHT_CONE);

  // Unit 84 headlights & strobes blocking street mouth
  drawCruiserSide(fb, 42, 30, tick, true, { headlights: false });
  fb.fillPolygon([[44, 38], [84, 38], [100, 60], [28, 60]], EGA.HEADLIGHT_CONE);

  // Dumpster & Marco "The Chemist" Vega fleeing/cuffed
  fb.fillRect(10, 40, 22, 16, EGA.DARK_GREEN);
  fb.drawRect(10, 40, 22, 16, EGA.BLACK);
  drawPerson(fb, 66, 36, {
    skin: EGA.SKIN_LIGHT,
    skinShade: EGA.SKIN_LIGHT_DARK,
    coat: EGA.DARK_GREEN,
    coatShade: EGA.CHALK_DARK,
    pants: EGA.CAR_BLACK,
    pose: state.flags?.marcoCuffed ? 'handsup' : 'run',
    belt: false,
  });
  drawMarcus(fb, 46, 38, {
    pose: state.flags?.corneredMarco ? 'stand' : 'run',
    scale: 1.08,
  });
  drawRain(fb, tick, 44);
}

export function drawMotelLab(fb, state) {
  // Cheap wood-paneled motel lab interior
  fb.fillDitherRect(0, 0, 128, 46, EGA.WOOD_DARK, EGA.WALL_DARK, 'vstripe');
  fb.fillDitherRect(0, 46, 128, 18, EGA.BROWN, EGA.WOOD_DARK, 'checker');

  // Forensics chemistry worktable
  fb.fillRect(8, 36, 56, 5, EGA.LIGHT_GRAY);
  fb.fillRect(12, 41, 4, 21, EGA.STEEL_DARK);
  fb.fillRect(56, 41, 4, 21, EGA.STEEL_DARK);
  // Bubbling blue flasks & glass condenser spiral
  fb.fillPolygon([[14, 36], [19, 25], [22, 25], [27, 36]], EGA.BRIGHT_CYAN);
  fb.fillRect(19, 21, 3, 5, EGA.CHROME);
  fb.fillRect(30, 27, 7, 9, EGA.BRIGHT_BLUE);
  fb.drawLine(22, 22, 33, 22, EGA.CHROME);
  fb.drawLine(33, 22, 33, 27, EGA.CHROME);
  // Coffee mug + red baker's twine & white powdered cannoli crumbs!
  fb.fillRect(42, 30, 6, 6, EGA.WHITE);
  fb.fillRect(51, 33, 9, 3, EGA.WHITE);
  fb.drawLine(50, 34, 57, 32, EGA.BRIGHT_RED);
  if (state.flags?.inspectedTable) {
    fb.drawRect(49, 30, 13, 7, EGA.YELLOW);
  }

  // Right wall: crooked velvet painting or recessed steel wall safe
  if (state.flags?.foundSafe || state.flags?.dustedSafe || state.flags?.openedSafe) {
    fb.fillRect(82, 10, 32, 26, EGA.STEEL_DARK);
    fb.drawRect(82, 10, 32, 26, EGA.CHROME);
    if (state.flags?.openedSafe) {
      fb.fillRect(85, 13, 26, 20, EGA.BLACK);
      fb.fillRect(114, 10, 10, 26, EGA.STEEL);
    } else {
      fb.drawCircle(98, 23, 6, EGA.CHROME, false);
      fb.drawCircle(98, 23, 2, EGA.LIGHT_GRAY, true);
      if (state.flags?.dustedSafe) {
        fb.drawCircle(103, 25, 4, EGA.WHITE, false);
      }
    }
  } else {
    fb.fillPolygon([[80, 10], [116, 13], [114, 38], [78, 35]], EGA.DARK_MAGENTA);
    fb.drawLine(80, 10, 116, 13, EGA.GOLD_BADGE);
    fb.drawLine(116, 13, 114, 38, EGA.GOLD_BADGE);
    fb.drawLine(114, 38, 78, 35, EGA.GOLD_BADGE);
    fb.drawLine(78, 35, 80, 10, EGA.GOLD_BADGE);
  }

  drawMarcus(fb, 68, 27, { scale: 1.08 });
}
