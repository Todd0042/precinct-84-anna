import { EGA } from './palette.js';
import { drawMarcus, drawClaire, drawRaincoatMan, drawRain } from './art-primitives.js';
import { getModelShortLabel } from './anna-ai.js';

export const TIER_OPTIONS = [
  {
    tier: 1,
    short: 'T1 CO-PILOT',
    title: 'CO-PILOT',
    cardTitle: '1:HINT',
    subtitle: 'CASE 1',
    color: EGA.BRIGHT_CYAN,
    desc: 'Authored Case I script + on-demand "Ask Claire" tactical AI hints + Case II AI sequel unlock.',
  },
  {
    tier: 2,
    short: 'T2 INTERMISS',
    title: 'INTERMISS',
    cardTitle: '2:MIXED',
    subtitle: 'INTERM',
    color: EGA.YELLOW,
    desc: 'Authored Case I + AI patrol intermissions between acts, free-form questioning & Case II sequel.',
  },
  {
    tier: 3,
    short: 'T3 DIRECTOR',
    title: 'DIRECTOR',
    cardTitle: '3:AI',
    subtitle: 'FULL AI',
    color: EGA.NEON_PINK,
    desc: 'Live AI Case Director writes custom mysteries & twists using our 15 high-res sets from Turn 1.',
  },
];

function drawTierPortrait(fb, tier, cx, topY, tick) {
  if (tier === 1) {
    drawMarcus(fb, cx - 10, topY + 2, { scale: 0.72 });
    drawClaire(fb, cx + 3, topY + 2, { scale: 0.72 });
  } else if (tier === 2) {
    // Cruiser dashboard radio & spinning reel-to-reel icon
    fb.fillRect(cx - 12, topY + 3, 24, 11, EGA.CAR_BLACK);
    fb.drawRect(cx - 12, topY + 3, 24, 11, EGA.STEEL);
    fb.drawCircle(cx - 5, topY + 8, 3, EGA.CHROME, tick % 2 === 0);
    fb.drawCircle(cx + 5, topY + 8, 3, EGA.CHROME, tick % 2 !== 0);
    fb.setPixel(cx + 9, topY + 5, tick % 2 === 0 ? EGA.BRIGHT_RED : EGA.BRIGHT_GREEN);
  } else {
    fb.fillPolygon([[cx - 9, topY + 1], [cx + 9, topY + 1], [cx + 13, topY + 16], [cx - 13, topY + 16]], EGA.AMBER_GLOW);
    drawRaincoatMan(fb, cx - 4, topY + 4, tick, { scale: 0.65, hasBox: true, umbrella: true });
  }
}

export function drawModeSelect(fb, state, tick = 0, modelLabel = 'AUTO DEFAULT') {
  fb.fillDitherRect(0, 0, 128, 64, EGA.SKY_TOP, EGA.NIGHT_SKY, 'vgrad');
  drawRain(fb, tick, 24, { x0: 0, y0: 0, x1: 128, y1: 48 });

  fb.fillRect(0, 0, 128, 8, EGA.BLACK);
  fb.drawText5x5(14, 2, 'PRECINCT 84: TIER & MODEL', EGA.YELLOW);

  const activeTier = state.aiTier || 1;
  const xs = [4, 45, 86];
  for (let i = 0; i < TIER_OPTIONS.length; i++) {
    const opt = TIER_OPTIONS[i];
    const x = xs[i];
    const selected = opt.tier === activeTier;
    const border = selected ? (tick % 4 < 2 ? opt.color : EGA.WHITE) : EGA.STEEL_DARK;
    fb.fillRect(x, 10, 38, 36, selected ? EGA.COP_DARK : EGA.ASPHALT_DARK);
    fb.drawRect(x, 10, 38, 36, border);
    if (selected) fb.drawRect(x + 1, 11, 36, 34, opt.color);

    fb.fillRect(x + 2, 12, 34, 7, selected ? EGA.DARK_BLUE : EGA.BLACK);
    fb.drawText5x5(x + 5, 13, opt.cardTitle, selected ? EGA.WHITE : opt.color);
    drawTierPortrait(fb, opt.tier, x + 19, 20, tick);
    fb.drawText5x5(x + 6, 39, opt.subtitle, selected ? EGA.YELLOW : EGA.LIGHT_GRAY);
  }

  // Bottom Delete Save + Model Cycler + Start/Resume Shift bar
  fb.fillRect(4, 50, 20, 10, EGA.DARK_RED);
  fb.drawRect(4, 50, 20, 10, EGA.BRIGHT_RED);
  fb.drawText5x5(7, 53, 'DEL', EGA.WHITE);

  fb.fillRect(25, 50, 8, 10, EGA.COP_NAVY);
  fb.drawRect(25, 50, 8, 10, EGA.BRIGHT_CYAN);
  fb.drawText5x5(27, 53, '<', EGA.WHITE);

  fb.fillRect(34, 50, 44, 10, EGA.BLACK);
  fb.drawRect(34, 50, 44, 10, EGA.STEEL);
  fb.drawText5x5(36, 53, modelLabel.slice(0, 10), EGA.BRIGHT_CYAN);

  fb.fillRect(79, 50, 8, 10, EGA.COP_NAVY);
  fb.drawRect(79, 50, 8, 10, EGA.BRIGHT_CYAN);
  fb.drawText5x5(81, 53, '>', EGA.WHITE);

  fb.fillRect(89, 50, 35, 10, EGA.DARK_GREEN);
  fb.drawRect(89, 50, 35, 10, EGA.BRIGHT_GREEN);
  fb.drawText5x5(94, 53, 'START GO', EGA.WHITE);
}

function addCanvasBox(hitboxes, lx0, ly0, lx1, ly1, { fbWidth, fbHeight, padL, topTermRow }, action) {
  const tx0 = padL + Math.round((lx0 * fbWidth) / 128) + 1;
  const tx1 = padL + Math.round((lx1 * fbWidth) / 128) + 1;
  const tr0 = topTermRow + Math.floor(Math.round((ly0 * fbHeight) / 64) / 2);
  const tr1 = topTermRow + Math.floor(Math.round((ly1 * fbHeight) / 64) / 2);
  hitboxes.push({ x0: tx0, x1: tx1, y0: tr0, y1: tr1, action });
}

export function buildModeSelectHitboxes({ state, catalog, fbWidth, fbHeight, padL, topTermRow }) {
  const canvasHitboxes = [];
  const xs = [4, 45, 86];
  for (let i = 0; i < 3; i++) {
    addCanvasBox(canvasHitboxes, xs[i], 10, xs[i] + 37, 45, { fbWidth, fbHeight, padL, topTermRow }, `tier:${i + 1}`);
  }
  addCanvasBox(canvasHitboxes, 4, 50, 23, 59, { fbWidth, fbHeight, padL, topTermRow }, 'delete_save');
  addCanvasBox(canvasHitboxes, 25, 50, 32, 59, { fbWidth, fbHeight, padL, topTermRow }, 'prev_model');
  addCanvasBox(canvasHitboxes, 34, 50, 77, 59, { fbWidth, fbHeight, padL, topTermRow }, 'next_model');
  addCanvasBox(canvasHitboxes, 79, 50, 86, 59, { fbWidth, fbHeight, padL, topTermRow }, 'next_model');
  addCanvasBox(canvasHitboxes, 89, 50, 123, 59, { fbWidth, fbHeight, padL, topTermRow }, 'start_shift');

  const activeOpt = TIER_OPTIONS[(state.aiTier || 1) - 1] || TIER_OPTIONS[0];
  const modelName = getModelShortLabel(catalog, state.aiModel);
  const llmStatus = state.llmAvailable ? 'Anna LLM Ready' : 'Standalone (Offline Tier 1 Ready)';
  return {
    canvasHitboxes,
    modelShortLabel: modelName,
    summaryLines: [
      { tag: 'SCENE', text: `SELECTED: TIER ${activeOpt.tier} (${activeOpt.title}) | MODEL: ${modelName} [${llmStatus}]` },
      { tag: 'NARRATIVE', text: activeOpt.desc },
      { tag: 'SYSTEM', text: 'Keys: [1/2/3] Choose Tier | [M / Left / Right] Cycle Model | [Enter] or [Start Shift] Begin!' },
    ],
  };
}
