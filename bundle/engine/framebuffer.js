import { EGA, RESET, fgRgb, bgRgb, sameColor } from './palette.js';

/**
 * Crisp 3x5 uppercase bitmap glyphs for high-res in-scene EGA signage & HUD displays.
 */
const FONT_3X5 = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '101', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '111', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '110'],
  '-': ['000', '000', '111', '000', '000'],
  ':': ['000', '010', '000', '010', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '#': ['101', '111', '101', '111', '101'],
  '/': ['001', '001', '010', '100', '100'],
  '.': ['000', '000', '000', '000', '010'],
  "'": ['010', '010', '000', '000', '000'],
  '<': ['001', '010', '100', '010', '001'],
  '>': ['100', '010', '001', '010', '100'],
  ' ': ['000', '000', '000', '000', '000'],
};

/**
 * High-resolution virtual pixel framebuffer rendering two vertical pixels per
 * terminal row via `▀`. Logical authoring coordinate space is 128x64, rendered
 * 1:1 at default 128x64 or proportionally scaled onto any alternate target size.
 */
export class Framebuffer {
  constructor(width = 128, height = 64) {
    if (height % 2 !== 0) {
      throw new Error(`Framebuffer height must be even, received ${height}`);
    }
    this.width = width;
    this.height = height;
    this.logicalWidth = 128;
    this.logicalHeight = 64;
    this.pixels = new Array(width * height).fill(EGA.BLACK);
  }

  clear(color = EGA.BLACK) {
    this.pixels.fill(color);
  }

  mapX(x) {
    return this.width === this.logicalWidth
      ? Math.round(x)
      : Math.round((x * this.width) / this.logicalWidth);
  }

  mapY(y) {
    return this.height === this.logicalHeight
      ? Math.round(y)
      : Math.round((y * this.height) / this.logicalHeight);
  }

  setRawPixel(px, py, color) {
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
    this.pixels[py * this.width + px] = color;
  }

  setPixel(x, y, color) {
    this.setRawPixel(this.mapX(x), this.mapY(y), color);
  }

  fillRect(x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    const rx0 = this.mapX(x);
    const ry0 = this.mapY(y);
    const rx1 = Math.max(rx0 + 1, this.mapX(x + w));
    const ry1 = Math.max(ry0 + 1, this.mapY(y + h));
    const x0 = Math.max(0, rx0);
    const y0 = Math.max(0, ry0);
    const x1 = Math.min(this.width, rx1);
    const y1 = Math.min(this.height, ry1);
    for (let py = y0; py < y1; py++) {
      const rowOffset = py * this.width;
      for (let px = x0; px < x1; px++) {
        this.pixels[rowOffset + px] = color;
      }
    }
  }

  /**
   * Sierra-style EGA dithered fill (`checker`, `bayer25`, `bayer75`, `hstripe`, `vgrad`).
   */
  fillDitherRect(x, y, w, h, colorA, colorB, mode = 'checker') {
    if (w <= 0 || h <= 0) return;
    const rx0 = this.mapX(x);
    const ry0 = this.mapY(y);
    const rx1 = Math.max(rx0 + 1, this.mapX(x + w));
    const ry1 = Math.max(ry0 + 1, this.mapY(y + h));
    const x0 = Math.max(0, rx0);
    const y0 = Math.max(0, ry0);
    const x1 = Math.min(this.width, rx1);
    const y1 = Math.min(this.height, ry1);
    const spanY = Math.max(1, ry1 - ry0);
    for (let py = y0; py < y1; py++) {
      const rowOffset = py * this.width;
      const t = (py - ry0) / spanY;
      for (let px = x0; px < x1; px++) {
        let pickB = false;
        if (mode === 'checker') pickB = ((px + py) & 1) === 1;
        else if (mode === 'bayer25') pickB = (px & 1) === 1 && (py & 1) === 1;
        else if (mode === 'bayer75') pickB = !((px & 1) === 0 && (py & 1) === 0);
        else if (mode === 'hstripe') pickB = (py & 1) === 1;
        else if (mode === 'vgrad') {
          const bayer = ((px & 1) * 2 + ((px + py) & 1)) / 4;
          pickB = t > bayer + 0.08;
        }
        this.pixels[rowOffset + px] = pickB ? colorB : colorA;
      }
    }
  }

  fillPolygon(points, color) {
    if (!Array.isArray(points) || points.length < 3) return;
    const pts = points.map(([x, y]) => [this.mapX(x), this.mapY(y)]);
    let minY = this.height;
    let maxY = 0;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    minY = Math.max(0, minY);
    maxY = Math.min(this.height - 1, maxY);

    for (let py = minY; py <= maxY; py++) {
      const nodes = [];
      let j = pts.length - 1;
      for (let i = 0; i < pts.length; i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if ((yi <= py && yj > py) || (yj <= py && yi > py)) {
          nodes.push(Math.round(xi + ((py - yi) / (yj - yi)) * (xj - xi)));
        }
        j = i;
      }
      nodes.sort((a, b) => a - b);
      const rowOffset = py * this.width;
      for (let k = 0; k + 1 < nodes.length; k += 2) {
        const startX = Math.max(0, nodes[k]);
        const endX = Math.min(this.width - 1, nodes[k + 1]);
        for (let px = startX; px <= endX; px++) {
          this.pixels[rowOffset + px] = color;
        }
      }
    }
  }

  drawRawLine(x0, y0, x1, y1, color) {
    let cx = Math.round(x0);
    let cy = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const dx = Math.abs(tx - cx);
    const dy = Math.abs(ty - cy);
    const sx = cx < tx ? 1 : -1;
    const sy = cy < ty ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setRawPixel(cx, cy, color);
      if (cx === tx && cy === ty) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  drawRect(x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    const x0 = this.mapX(x);
    const y0 = this.mapY(y);
    const x1 = Math.max(x0, this.mapX(x + w) - 1);
    const y1 = Math.max(y0, this.mapY(y + h) - 1);
    this.drawRawLine(x0, y0, x1, y0, color);
    this.drawRawLine(x0, y1, x1, y1, color);
    this.drawRawLine(x0, y0, x0, y1, color);
    this.drawRawLine(x1, y0, x1, y1, color);
  }

  drawLine(x0, y0, x1, y1, color) {
    this.drawRawLine(this.mapX(x0), this.mapY(y0), this.mapX(x1), this.mapY(y1), color);
  }

  drawCircle(cx, cy, r, color, fill = false) {
    this.drawEllipse(cx, cy, r, r, color, fill);
  }

  drawEllipse(cx, cy, rx, ry, color, fill = false) {
    const mcx = this.mapX(cx);
    const mcy = this.mapY(cy);
    const sx = this.width / this.logicalWidth;
    const sy = this.height / this.logicalHeight;
    const mrx = Math.max(1, Math.round(rx * sx));
    const mry = Math.max(1, Math.round(ry * sy));
    const rx2 = mrx * mrx;
    const ry2 = mry * mry;
    for (let dy = -mry; dy <= mry; dy++) {
      for (let dx = -mrx; dx <= mrx; dx++) {
        const norm = (dx * dx) / rx2 + (dy * dy) / ry2;
        if (fill ? norm <= 1.04 : Math.abs(norm - 1.0) <= 2.2 / Math.max(mrx, mry)) {
          this.setRawPixel(mcx + dx, mcy + dy, color);
        }
      }
    }
  }

  drawText5x5(x, y, text, color, scale = 1) {
    const upper = String(text).toUpperCase();
    let cursorX = this.mapX(x);
    const startY = this.mapY(y);
    const stepX = Math.max(1, Math.round((scale * this.width) / this.logicalWidth));
    const stepY = Math.max(1, Math.round((scale * this.height) / this.logicalHeight));
    for (const ch of upper) {
      const glyph = FONT_3X5[ch] || FONT_3X5[' '];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          if (glyph[row][col] === '1') {
            for (let sy = 0; sy < stepY; sy++) {
              for (let sx = 0; sx < stepX; sx++) {
                this.setRawPixel(cursorX + col * stepX + sx, startY + row * stepY + sy, color);
              }
            }
          }
        }
      }
      cursorX += 4 * stepX;
    }
  }

  /**
   * Renders the virtual pixel buffer into `height / 2` truecolor ANSI lines using `▀`.
   */
  renderToAnsiLines() {
    const lines = [];
    for (let y = 0; y < this.height; y += 2) {
      let line = '';
      let prevTop = null;
      let prevBot = null;
      const topOffset = y * this.width;
      const botOffset = (y + 1) * this.width;

      for (let x = 0; x < this.width; x++) {
        const top = this.pixels[topOffset + x];
        const bot = this.pixels[botOffset + x];
        if (!prevTop || !sameColor(prevTop, top)) {
          line += fgRgb(top);
          prevTop = top;
        }
        if (!prevBot || !sameColor(prevBot, bot)) {
          line += bgRgb(bot);
          prevBot = bot;
        }
        line += '▀';
      }
      lines.push(line + RESET);
    }
    return lines;
  }
}
