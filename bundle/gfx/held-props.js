import { PAL } from './svga-palette.js';

function drawSmokePlume(ctx, x, y, facing, tick, emberColor = PAL.FIRE_ORANGE) {
  ctx.fillStyle = emberColor;
  ctx.fillRect(x - 1, y - 1, 2.2, 2);
  if (tick % 3 === 0) {
    ctx.fillStyle = PAL.FLAME_YELLOW;
    ctx.fillRect(x, y - 0.5, 1.2, 1.2);
  }
  for (let i = 0; i < 3; i++) {
    const drift = Math.sin(tick * 0.45 + i * 1.4) * (2 + i);
    const py = y - 4 - ((tick * 1.8 + i * 6) % 16);
    ctx.fillStyle = `rgba(210, 220, 236, ${Math.max(0.1, 0.42 - i * 0.11)})`;
    ctx.beginPath();
    ctx.arc(x + drift + facing * 0.6 * i, py, 1.6 + i * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHeldProp(ctx, propId, hx, hy, mx, my, facing = 1, tick = 0, pose = 'stand', opts = {}) {
  if (!propId) return;
  const f = facing >= 0 ? 1 : -1;
  ctx.save();

  if (propId === 'cigarette' || propId === 'cigar') {
    const atMouth = pose === 'smoke' || pose === 'chill' || pose === 'sit' || pose === 'lie_bed' || opts.portrait;
    const bx = atMouth ? mx + f * 1.5 : hx;
    const by = atMouth ? my + 0.5 : hy;
    const len = propId === 'cigar' ? 8 : 6.5;
    const tipX = bx + f * len;
    const tipY = by - (atMouth ? 1 : 0.4);
    ctx.strokeStyle = propId === 'cigar' ? '#5e351c' : '#f4f4f6';
    ctx.lineWidth = propId === 'cigar' ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    drawSmokePlume(ctx, tipX, tipY, f, tick);
  } else if (propId === 'coffee_cup' || propId === 'whiskey_glass' || propId === 'beer_bottle') {
    const x = pose === 'sip' ? mx + f * 3 : hx;
    const y = pose === 'sip' ? my + 2 : hy - 3;
    if (propId === 'coffee_cup') {
      ctx.fillStyle = '#ece8df';
      ctx.fillRect(x - 2.5, y - 3, 5, 6);
      ctx.fillStyle = '#3b2416';
      ctx.fillRect(x - 2, y - 3, 4, 1.4);
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = 'rgba(230,238,248,0.38)';
        ctx.beginPath();
        ctx.arc(x + Math.sin(tick * 0.4 + i) * 1.5, y - 6 - ((tick + i * 4) % 9), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (propId === 'whiskey_glass') {
      ctx.fillStyle = 'rgba(220, 236, 250, 0.45)';
      ctx.fillRect(x - 2.5, y - 3, 5, 6);
      ctx.fillStyle = PAL.AMBER;
      ctx.fillRect(x - 2, y, 4, 2.5);
    } else {
      ctx.fillStyle = '#6c3818';
      ctx.fillRect(x - 2, y - 5, 4, 8);
      ctx.fillRect(x - 1, y - 9, 2, 4);
      ctx.fillStyle = PAL.GOLD_BADGE;
      ctx.fillRect(x - 1.5, y - 2, 3, 2);
    }
  } else if (propId === 'pistol' || propId === 'shotgun' || propId === 'smg' || propId === 'sniper_rifle') {
    const len = propId === 'pistol' ? 7 : propId === 'smg' ? 11 : propId === 'shotgun' ? 14 : 17;
    ctx.fillStyle = PAL.STEEL_LIT;
    ctx.fillRect(f > 0 ? hx : hx - len, hy - 2.4, len, propId === 'pistol' ? 2.2 : 2.8);
    ctx.fillStyle = '#181a22';
    ctx.fillRect(hx - f * 1, hy - 1, f * 2.4, 3.5);
    if (propId === 'smg') ctx.fillRect(hx + f * 3, hy, 2, 4.5);
    if (pose === 'shoot') {
      const tipX = hx + f * len;
      ctx.fillStyle = PAL.FLAME_YELLOW;
      ctx.beginPath();
      ctx.moveTo(tipX, hy - 1.5);
      ctx.lineTo(tipX + f * 11, hy - 5);
      ctx.lineTo(tipX + f * 7, hy - 1.5);
      ctx.lineTo(tipX + f * 12, hy + 2.5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (propId === 'flashlight') {
    ctx.fillStyle = '#161a24';
    ctx.fillRect(f > 0 ? hx : hx - 6, hy - 1.5, 6, 2.8);
    ctx.fillStyle = PAL.AMBER;
    ctx.fillRect(hx + f * 4.5, hy - 1.8, f * 2, 3.2);
    ctx.fillStyle = 'rgba(255, 232, 130, 0.18)';
    ctx.beginPath();
    ctx.moveTo(hx + f * 6, hy);
    ctx.lineTo(hx + f * 64, hy - 18);
    ctx.lineTo(hx + f * 64, hy + 18);
    ctx.closePath();
    ctx.fill();
  } else if (propId === 'handcuffs' || propId === 'brass_watch' || propId === 'magnifying_glass') {
    ctx.strokeStyle = propId === 'brass_watch' ? PAL.GOLD_BADGE : PAL.CHROME;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hx + f * 2, hy + 2, 2.6, 0, Math.PI * 2);
    if (propId === 'handcuffs') ctx.arc(hx + f * 6, hy + 3, 2.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (propId === 'walkie_talkie' || propId === 'burner_phone' || propId === 'tape_recorder' || propId === 'camera') {
    ctx.fillStyle = '#151924';
    ctx.fillRect(hx - 2.5, hy - 4, 5, 7);
    ctx.fillStyle = propId === 'walkie_talkie' ? PAL.EMERALD : PAL.RED_STROBE;
    ctx.fillRect(hx - 1, hy - 6, 1.5, 2.5);
  } else if (propId === 'badge_id' || propId === 'motel_key') {
    ctx.fillStyle = PAL.GOLD_BADGE;
    ctx.fillRect(hx - 2.5, hy - 2.5, 5, 4.5);
  } else if (propId === 'case_folder' || propId === 'notepad' || propId === 'bribe_envelope') {
    ctx.fillStyle = propId === 'bribe_envelope' ? '#dec89c' : '#b89464';
    ctx.fillRect(hx - 4, hy - 3, 8, 6);
    if (propId === 'bribe_envelope') {
      ctx.fillStyle = '#246838';
      ctx.fillRect(hx - 2, hy - 2, 4, 2);
    }
  } else if (propId === 'evidence_bag') {
    ctx.fillStyle = 'rgba(220, 240, 255, 0.42)';
    ctx.fillRect(hx - 3.5, hy - 2, 7, 8);
    ctx.strokeStyle = PAL.NEON_CYAN;
    ctx.lineWidth = 1;
    ctx.strokeRect(hx - 3.5, hy - 2, 7, 8);
    ctx.fillStyle = PAL.BLUE_STROBE;
    ctx.fillRect(hx - 1.5, hy + 1, 3, 3);
  } else if (propId === 'cash_briefcase' || propId === 'duffel_bag') {
    ctx.fillStyle = propId === 'duffel_bag' ? '#242c38' : '#382214';
    ctx.fillRect(hx - 6, hy, 12, 8);
    ctx.strokeStyle = PAL.GOLD_BADGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(hx - 6, hy, 12, 8);
  } else if (propId === 'rossi_box') {
    ctx.fillStyle = '#f4f2ee';
    ctx.fillRect(hx - 5, hy - 2, 10, 7);
    ctx.strokeStyle = PAL.RED_STROBE;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(hx - 5, hy + 1, 10, 0.5);
  } else if (propId === 'knife' || propId === 'baton' || propId === 'crowbar' || propId === 'syringe') {
    ctx.strokeStyle = propId === 'baton' ? '#1c1e26' : PAL.CHROME;
    ctx.lineWidth = propId === 'baton' ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + f * 9, hy - (propId === 'knife' ? 4 : -5));
    ctx.stroke();
    if (propId === 'syringe') {
      ctx.fillStyle = PAL.NEON_CYAN;
      ctx.fillRect(hx + f * 2, hy - 1.5, 4, 2);
    }
  }

  ctx.restore();
}
