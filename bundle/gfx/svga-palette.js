/**
 * Curated 1990s Sierra SCI1 / VGA Neo-Noir color ramps and tone helpers
 * for Precinct 84's code-drawn 480x270 canvas engine.
 */

export const PAL = {
  // Deep noir atmosphere
  VOID: '#070912',
  NIGHT_TOP: '#0a0f22',
  NIGHT_MID: '#131d3d',
  NIGHT_HORIZON: '#22315c',
  DAWN_SKY: '#3b4f7a',
  FOG_MIST: '#5c6e8f',
  ASPHALT_DARK: '#111521',
  ASPHALT: '#1b2133',
  WET_ASPHALT: '#28324c',
  PUDDLE: '#38527d',
  RAIN: '#7aa7e0',

  // Lighting & neon accents
  RED_STROBE: '#ff3444',
  RED_DEEP: '#7c121e',
  BLUE_STROBE: '#3488ff',
  BLUE_DEEP: '#122c7a',
  NEON_PINK: '#ff4cc8',
  NEON_CYAN: '#38f0ff',
  AMBER: '#f0a838',
  AMBER_DIM: '#7c4c18',
  WARM_LAMP: '#ffd27a',
  CREAM_LIGHT: '#fff0c8',
  FIRE_ORANGE: '#ff7a20',
  FLAME_YELLOW: '#ffe868',
  EMERALD: '#38dc78',
  CRIMSON: '#d82838',

  // Materials & interiors
  BRICK_DARK: '#45161b',
  BRICK_MID: '#6e2528',
  BRICK_LIT: '#8f3934',
  WOOD_DARK: '#3d2210',
  WOOD_MID: '#6b3e1d',
  WOOD_LIT: '#9c6030',
  STEEL_DARK: '#2c3446',
  STEEL_MID: '#53607a',
  STEEL_LIT: '#8c9cb8',
  CHROME: '#dce4f2',
  WALL_SLATE: '#262d3d',
  WALL_LIGHT: '#3b455c',
  CHALK_GREEN: '#194a36',
  SILK_PLUM: '#4a1d3a',
  BED_LINEN: '#c8c4d4',
  BED_SHADOW: '#6d6982',

  // Uniforms & attire
  COP_DARK: '#0d1b40',
  COP_NAVY: '#183068',
  COP_LIT: '#2a4c98',
  GOLD_BADGE: '#f4c434',
  SUIT_DARK: '#151822',
  SUIT_MID: '#282e3e',
  TRENCH_COAT: '#b9a37c',
  TRENCH_SHADE: '#7b684a',
  TRENCH_LIT: '#decba4',
  ROBE_SILK: '#641c38',
  ROBE_SHADE: '#3b0e20',
  WHITE_SHIRT: '#e8ecf6',
};

/**
 * Multi-stop skin shading ramps: [base, shadow, highlight]
 */
export const SKIN_RAMPS = {
  marcus: ['#7a4b2e', '#4c2c18', '#9e6844'],
  deep: ['#58331e', '#361d10', '#79492e'],
  claire: ['#f0c2ab', '#c48d76', '#ffe0cf'],
  fair: ['#e4b69a', '#b68368', '#f8d4bc'],
  olive: ['#cfa07a', '#9c6e4b', '#e8be9c'],
  weathered: ['#d29f7e', '#9e6b4c', '#e8ba9a'],
};

export const HAIR_TONES = {
  black: ['#181922', '#2e3244'],
  brunette: ['#362018', '#5c3828'],
  chestnut: ['#5a2e1c', '#82462c'],
  blonde: ['#c89b44', '#ebd078'],
  silver: ['#9ca4b4', '#d8dee8'],
  redhead: ['#882d1c', '#bc482c'],
};

export function hexAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
