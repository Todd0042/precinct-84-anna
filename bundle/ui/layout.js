import { RESET, fgRgb, bgRgb } from '../engine/palette.js';
import { Framebuffer } from '../engine/framebuffer.js';
import { renderSceneArt } from '../engine/art.js';
import { drawModeSelect, buildModeSelectHitboxes } from '../engine/mode-select.js';
import { SCENE_META, getSuggestedChips } from '../game/campaign.js';
import { POLICE_MANUAL } from '../game/manual.js';

export const HIGHRES_COLS = 128;
export const HIGHRES_ROWS = 46;
export const HIGHRES_FB_WIDTH = 128;
export const HIGHRES_FB_HEIGHT = 64;

const TAG_COLOR = {
  SCENE: [64, 236, 255],
  DIALOG: [255, 224, 68],
  EVIDENCE: [64, 232, 112],
  RADIO: [96, 168, 255],
  ACTION: [244, 246, 252],
  ALERT: [255, 84, 84],
  FAIL: [255, 56, 68],
  SYSTEM: [176, 182, 194],
  CMD: [120, 130, 150],
  NARRATIVE: [226, 230, 238],
};

function wrapText(text, width) {
  const safeWidth = Math.max(8, width);
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (w.length > safeWidth) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      for (let i = 0; i < w.length; i += safeWidth) {
        const part = w.slice(i, i + safeWidth);
        if (part.length === safeWidth) lines.push(part);
        else cur = part;
      }
    } else if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= safeWidth) {
      cur += ` ${w}`;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function padRight(str, len) {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

function formatToolbarHeader(state, audioEq, width, toolbarHitboxes) {
  const compact = width < 84;
  const buttons = compact
    ? [
        { label: '[F1:Man]', action: 'manual' },
        { label: '[F2:Aud]', action: 'audio' },
        { label: '[F5:Sav]', action: 'save' },
        { label: '[F9:Undo]', action: 'undo' },
      ]
    : [
        { label: '[Menu]', action: 'modes' },
        { label: '[F1:Manual]', action: 'manual' },
        { label: '[F2:Audio]', action: 'audio' },
        { label: '[F5:Save]', action: 'save' },
        { label: '[F9:Undo]', action: 'undo' },
      ];
  const btnText = buttons.map((b) => b.label).join(' ');
  const shortAudio = audioEq === 'MUTE' ? 'MUTE' : audioEq === 'AUDIO ON' ? 'AUD' : 'SFX';
  let rawLeft;
  if (width >= 108) {
    rawLeft = ` PRECINCT 84 | ${state.officerName} (${state.badge}) | Score: ${state.score}/${state.maxScore} | ${audioEq}`;
  } else if (!compact) {
    rawLeft = ` PRECINCT 84 | ${state.badge} | ${state.score}/${state.maxScore} | ${audioEq}`;
  } else {
    rawLeft = ` P84 ${state.badge} ${state.score}/${state.maxScore} ${shortAudio}`;
  }

  const maxLeft = Math.max(0, width - btnText.length - 1);
  const leftHead = rawLeft.length > maxLeft ? rawLeft.slice(0, maxLeft) : rawLeft;
  const trailingSpace = leftHead.length + btnText.length + 2 <= width ? 1 : 0;
  const gap = Math.max(1, width - leftHead.length - btnText.length - trailingSpace);

  let bx = leftHead.length + gap + 1;
  for (const b of buttons) {
    toolbarHitboxes.push({ x0: bx, x1: bx + b.label.length - 1, y: 1, action: b.action });
    bx += b.label.length + 1;
  }
  return bgRgb([16, 36, 112]) + fgRgb([255, 224, 68]) + padRight(leftHead + ' '.repeat(gap) + btnText, width) + RESET;
}

function buildChipBarLine(state, width, chipRow, chipHitboxes) {
  const chips = getSuggestedChips(state);
  let chipBar = ' CHIP: ';
  for (let i = 0; i < chips.length; i++) {
    const tag = `[${chips[i].label}]`;
    if (chipBar.length + tag.length > width) break;
    const x0 = chipBar.length + 1;
    chipHitboxes.push({ x0, x1: x0 + tag.length - 1, y: chipRow, command: chips[i].command });
    chipBar += `${tag} `;
  }
  return bgRgb([22, 42, 86]) + fgRgb([244, 246, 252]) + padRight(chipBar, width) + RESET;
}

function computeViewportSize(width, targetRows) {
  const fbWidth = Math.min(HIGHRES_FB_WIDTH, width);
  const vpRows =
    targetRows >= HIGHRES_ROWS
      ? Math.min(34, HIGHRES_FB_HEIGHT / 2 + Math.floor((targetRows - HIGHRES_ROWS) / 2))
      : Math.max(10, Math.min(32, Math.floor((targetRows - 12) * 0.72)));
  return { fbWidth, fbHeight: vpRows * 2, vpRows };
}

export function buildScreenFrame({
  state,
  tick = 0,
  audioEq = 'AUDIO ON',
  inputBuffer = '',
  showManual = false,
  catalog = null,
  aiBusy = false,
  textOnly = false,
  cols = HIGHRES_COLS,
  rows = HIGHRES_ROWS,
}) {
  const width = Math.max(52, Math.min(160, cols));
  const targetRows = Math.max(10, rows);
  const { fbWidth, fbHeight, vpRows } = textOnly ? { fbWidth: 0, fbHeight: 0, vpRows: 0 } : computeViewportSize(width, targetRows);

  const lines = [];
  const toolbarHitboxes = [];
  const chipHitboxes = [];
  let canvasHitboxes = [];

  // Row 1: Header + clickable toolbar
  lines.push(formatToolbarHeader(state, audioEq, width, toolbarHitboxes));

  // Row 2: Scene or Mode Select banner
  const modeSelect = state.phase === 'mode_select';
  const metaTitle = modeSelect
    ? 'MODE SELECT: CHOOSE AI TIER (1-3) & ANNA MODEL — CLICK CARD OR PRESS ENTER'
    : state.intermission
      ? state.intermission.title
      : state.aiCampaign?.active
        ? `${state.aiCampaign.outline?.caseTitle || 'CASE #84-002 (AI)'}`
        : SCENE_META[state.scene]?.title || state.scene.toUpperCase();
  lines.push(bgRgb([26, 30, 44]) + fgRgb([64, 236, 255]) + padRight(` ${metaTitle}`, width) + RESET);

  if (showManual) {
    const manualHeight = targetRows - 4;
    const manualLines = [' === P84 PATROLMAN FIELD GUIDE (F1 / ESC TO CLOSE) ==='];
    for (const sec of POLICE_MANUAL) {
      manualLines.push(` ${sec.title}`);
      for (const ml of sec.lines) manualLines.push(`  ${ml}`);
    }
    for (let i = 0; i < manualHeight; i++) {
      const txt = manualLines[i] || '';
      lines.push(fgRgb([255, 224, 68]) + padRight(txt, width) + RESET);
    }
    lines.push(buildChipBarLine(state, width, lines.length + 1, chipHitboxes));
  } else {
    let logSource = state.log.slice(-30);
    if (!textOnly) {
      const fb = new Framebuffer(fbWidth, fbHeight);
      const padL = Math.max(0, Math.floor((width - fbWidth) / 2));
      const padR = Math.max(0, width - fbWidth - padL);
      if (modeSelect) {
        const ms = buildModeSelectHitboxes({ state, catalog, fbWidth, fbHeight, padL, topTermRow: 3 });
        canvasHitboxes = ms.canvasHitboxes;
        logSource = ms.summaryLines;
        drawModeSelect(fb, state, tick, ms.modelShortLabel);
      } else {
        renderSceneArt(fb, state, tick);
      }
      for (const artLine of fb.renderToAnsiLines()) {
        lines.push(`${' '.repeat(padL)}${artLine}${' '.repeat(padR)}`);
      }
    } else if (modeSelect) {
      const ms = buildModeSelectHitboxes({ state, catalog, fbWidth: 128, fbHeight: 64, padL: 0, topTermRow: 3 });
      logSource = ms.summaryLines;
    }

    lines.push(buildChipBarLine(state, width, lines.length + 1, chipHitboxes));

    const logHeight = Math.max(2, targetRows - vpRows - 6);
    const wrappedLog = [];
    for (const entry of logSource) {
      const color = TAG_COLOR[entry.tag] || TAG_COLOR.NARRATIVE;
      for (const wline of wrapText(entry.text, width - 2)) {
        wrappedLog.push({ text: ` ${wline}`, color });
      }
    }
    const visibleLog = wrappedLog.slice(-logHeight);
    for (let i = 0; i < logHeight; i++) {
      const l = visibleLog[i] || { text: '', color: TAG_COLOR.NARRATIVE };
      lines.push(fgRgb(l.color) + padRight(l.text, width) + RESET);
    }

    const align = state.alignment || { byTheBook: 0, corruption: 0, rogue: 0 };
    const alignStr = (align.byTheBook + align.corruption + align.rogue) > 0
      ? ` [Book:${align.byTheBook} Dirty:${align.corruption} Rogue:${align.rogue}]`
      : '';
    const objText = modeSelect
      ? ` MODE: Tier ${state.aiTier || 1} | Pick Tier (1/2/3), Model (M), Start Shift (Enter)`
      : ` OBJ: ${state.objectives.join(' | ')}${alignStr}`;
    lines.push(bgRgb([20, 26, 40]) + fgRgb([64, 236, 255]) + padRight(objText, width) + RESET);

    const gearText = ` GEAR: ${state.inventory.length ? state.inventory.join(', ') : '(none yet)'}`;
    lines.push(bgRgb([18, 22, 34]) + fgRgb([64, 232, 112]) + padRight(gearText, width) + RESET);
  }

  const rawPrompt = aiBusy
    ? ` [ANNA AI COMPILING...] > ${inputBuffer}_`
    : state.gameOver
      ? ` [FAIL ${state.gameOver.citation} - undo/F9] > ${inputBuffer}_`
      : ` > ${inputBuffer}_`;
  const promptText = rawPrompt.length > width ? ` > ${rawPrompt.slice(-(width - 3))}` : rawPrompt;
  lines.push(bgRgb([16, 22, 38]) + fgRgb([244, 246, 252]) + padRight(promptText, width) + RESET);

  return {
    screenText: lines.join('\n'),
    chipHitboxes,
    toolbarHitboxes,
    canvasHitboxes,
  };
}
