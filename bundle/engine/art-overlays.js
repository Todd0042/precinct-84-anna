import { EGA } from './palette.js';

export function drawGameOverOverlay(fb, gameOver, tick) {
  fb.fillDitherRect(8, 8, 112, 48, EGA.DARK_RED, EGA.BLACK, 'bayer75');
  fb.drawRect(8, 8, 112, 48, tick % 4 < 2 ? EGA.YELLOW : EGA.WHITE);
  fb.drawRect(10, 10, 108, 44, EGA.BRIGHT_RED);
  fb.fillRect(12, 12, 104, 40, EGA.BLACK);

  fb.fillRect(16, 15, 96, 9, EGA.DARK_RED);
  fb.drawText5x5(22, 17, 'PROCEDURAL VIOLATION', EGA.WHITE);
  fb.drawText5x5(22, 28, gameOver.citation || 'CODE 84', EGA.YELLOW);
  fb.drawText5x5(22, 39, 'PRESS F9 OR TYPE UNDO', EGA.BRIGHT_CYAN);
}
