/**
 * Authentic 16-color Sierra EGA palette plus atmospheric night-noir VGA tonal
 * extensions for Precinct 84's high-resolution (128x64) half-block pixel engine.
 */

export const EGA = {
  // Core 16 Sierra EGA colors
  BLACK: [8, 10, 18],
  DARK_BLUE: [16, 36, 112],
  DARK_GREEN: [18, 110, 48],
  DARK_CYAN: [16, 128, 148],
  DARK_RED: [152, 24, 34],
  DARK_MAGENTA: [132, 26, 128],
  BROWN: [138, 84, 28],
  LIGHT_GRAY: [176, 182, 194],
  DARK_GRAY: [68, 76, 94],
  BRIGHT_BLUE: [48, 124, 255],
  BRIGHT_GREEN: [64, 232, 112],
  BRIGHT_CYAN: [64, 236, 255],
  BRIGHT_RED: [255, 56, 68],
  BRIGHT_MAGENTA: [248, 84, 224],
  YELLOW: [255, 224, 68],
  WHITE: [244, 246, 252],

  // Atmospheric night-noir sky, water & street surfaces
  SKY_TOP: [6, 10, 22],
  NIGHT_SKY: [10, 14, 28],
  SKY_HORIZON: [20, 30, 56],
  HARBOR_DEEP: [10, 24, 58],
  HARBOR_MID: [18, 50, 96],
  PUDDLE_BLUE: [48, 76, 124],
  ASPHALT_DARK: [18, 22, 34],
  ASPHALT: [26, 30, 44],
  WET_ASPHALT: [38, 46, 66],
  RAIN_STREAK: [110, 152, 210],
  FOG_GRAY: [96, 108, 130],

  // Lighting, neon, fire & reflections
  SODIUM_AMBER: [224, 156, 52],
  DIM_AMBER: [128, 82, 24],
  AMBER_GLOW: [74, 48, 20],
  HEADLIGHT_CONE: [148, 138, 86],
  NEON_PINK: [255, 76, 198],
  NEON_CYAN: [52, 242, 255],
  FIRE_ORANGE: [255, 136, 32],
  FLAME_YELLOW: [255, 236, 118],
  DASH_GREEN: [44, 200, 110],
  GOLD_BADGE: [246, 198, 48],

  // Architecture & materials
  BRICK_DARK: [82, 22, 26],
  BRICK_RED: [124, 38, 36],
  BRICK_LIT: [158, 62, 46],
  WALL_DARK: [42, 48, 64],
  WALL_MID: [62, 70, 88],
  STEEL_DARK: [54, 64, 82],
  STEEL: [112, 124, 142],
  STEEL_LIT: [148, 162, 184],
  CHROME: [220, 228, 240],
  WOOD_DARK: [86, 48, 18],
  WOOD_MID: [128, 76, 30],
  WOOD_LIT: [168, 106, 48],
  CHALK_GREEN: [26, 76, 54],
  CHALK_DARK: [18, 56, 40],
  RUST_ORANGE: [196, 86, 32],

  // Characters & vehicles
  COP_DARK: [14, 28, 64],
  COP_NAVY: [22, 42, 86],
  COP_LIGHT: [38, 70, 136],
  CAR_BLACK: [16, 18, 28],
  CAR_SHEEN: [46, 52, 74],
  CAR_GLASS: [24, 66, 94],
  TIRE_RUBBER: [20, 22, 28],
  BEIGE_COAT: [198, 178, 138],
  BEIGE_LIGHT: [224, 206, 166],
  BEIGE_SHADOW: [142, 122, 88],
  SKIN_MARCUS: [118, 74, 46],
  SKIN_MARCUS_DARK: [84, 50, 30],
  SKIN_CLAIRE: [236, 194, 172],
  SKIN_CLAIRE_DARK: [204, 158, 136],
  SKIN_LIGHT: [222, 180, 150],
  SKIN_LIGHT_DARK: [184, 142, 116],
  HAIR_DARK: [42, 28, 22],
};

export const RESET = '\x1b[0m';

export function fgRgb(rgb) {
  return `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
}

export function bgRgb(rgb) {
  return `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
}

export function sameColor(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
