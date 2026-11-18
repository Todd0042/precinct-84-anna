import { CORE_SFX_LIST } from '../assets/audio-catalog.js';
import { BgmSequencer } from '../audio/bgm-sequencer.js';

const SAMPLE_RATE = 22050;
export const AUDIO_CUES = CORE_SFX_LIST;

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav16Mono(samples) {
  const numSamples = samples.length;
  const dataBytes = numSamples * 2;
  const buf = new Uint8Array(44 + dataBytes);
  const view = new DataView(buf.buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }
  return buf;
}

const NOISE_CUES = new Set(['shot', 'thunder', 'flashbang', 'rain_splash', 'whiskey_pour', 'breath_sigh', 'bottle_open', 'curtain_draw', 'tire_screech', 'v8_rev']);
const METALLIC_CUES = new Set(['cuff', 'lockpick', 'vault_spin', 'metal_latch', 'door_knock', 'gavel_bang', 'wiper_thump', 'car_door', 'footsteps', 'glass_clink', 'zipper_bag', 'camera_shutter']);

export function synthCueSamples(cue) {
  let durationSec = 0.22;
  if (cue === 'siren' || cue === 'ambulance_wail' || cue === 'train_horn') durationSec = 0.85;
  else if (cue === 'gameover' || cue === 'victory' || cue === 'thunder' || cue === 'flashbang') durationSec = 0.9;
  else if (cue === 'squelch' || cue === 'point' || cue === 'hazard' || cue === 'phone_ring') durationSec = 0.36;
  else if (cue === 'tick' || cue === 'paper_flip') durationSec = 0.05;

  const len = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(len);
  let phase = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / len;
    const env = Math.min(1, i / 120) * Math.max(0, 1 - Math.pow(progress, 2));
    let v = 0;

    if (cue === 'siren' || cue === 'ambulance_wail') {
      const freq = 580 + 380 * Math.sin(t * Math.PI * 2.4);
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      v = (Math.sin(phase) >= 0 ? 0.35 : -0.35) * env;
    } else if (cue === 'train_horn') {
      v = (Math.sin(2 * Math.PI * 185 * t) * 0.5 + Math.sin(2 * Math.PI * 233 * t) * 0.5) * 0.35 * env;
    } else if (cue === 'squelch' || cue === 'teleprinter') {
      v = t < 0.06 || (t > 0.08 && t < 0.14) ? Math.sin(2 * Math.PI * 1950 * t) * 0.35 : (Math.random() * 2 - 1) * 0.22 * (1 - progress);
    } else if (cue === 'point' || cue === 'badge_pin' || cue === 'cash_count') {
      const notes = [523.25, 659.25, 783.99];
      const f = notes[Math.min(2, Math.floor(progress * 3))];
      v = Math.sin(2 * Math.PI * f * t) * 0.35 * env;
    } else if (cue === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const f = notes[Math.min(3, Math.floor(progress * 4))];
      v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * 0.28 * env;
    } else if (cue === 'gameover') {
      const notes = [293.66, 277.18, 261.63, 220.0];
      const f = notes[Math.min(3, Math.floor(progress * 4))];
      v = (Math.sin(2 * Math.PI * f * t) >= 0 ? 0.3 : -0.3) * env;
    } else if (cue === 'hazard' || cue === 'phone_ring' || cue === 'clock_alarm' || cue === 'pager_beep') {
      const freq = Math.floor(t * 8) % 2 === 0 ? 880 : 620;
      v = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.35 : -0.35) * env;
    } else if (NOISE_CUES.has(cue)) {
      const decay = cue === 'thunder' || cue === 'rain_splash' ? 4 : 14;
      const tone = cue === 'v8_rev' ? 85 : cue === 'tire_screech' ? 1400 : 110;
      v = ((Math.random() * 2 - 1) * 0.55 + Math.sin(2 * Math.PI * tone * t) * 0.35) * Math.exp(-t * decay);
    } else if (METALLIC_CUES.has(cue)) {
      const c1 = t < 0.05 ? Math.sin(2 * Math.PI * 2400 * t) * (1 - t / 0.05) : 0;
      const c2 = t > 0.09 && t < 0.16 ? Math.sin(2 * Math.PI * 2700 * t) * (1 - (t - 0.09) / 0.07) : 0;
      v = (c1 + c2) * 0.42;
    } else {
      const baseHz = cue === 'heartbeat' ? 68 : cue === 'dial_tone' ? 350 : 1100;
      v = Math.sin(2 * Math.PI * baseHz * t) * 0.22 * (1 - progress);
    }
    out[i] = v;
  }
  return out;
}

function defaultAudioContextFactory() {
  if (typeof globalThis === 'undefined') return null;
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

export function createAudioEngine({ enabled = true, audioContextFactory = null } = {}) {
  let isAudioEnabled = Boolean(enabled);
  let lastCue = 'idle';
  let lastCueAt = 0;
  let audioCtx = null;
  const sampleCache = new Map();

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const factory = audioContextFactory || defaultAudioContextFactory;
    audioCtx = factory();
    return audioCtx;
  }

  const bgm = new BgmSequencer(getAudioContext);

  function ensureSamples(cue) {
    if (!sampleCache.has(cue)) sampleCache.set(cue, synthCueSamples(cue));
    return sampleCache.get(cue);
  }

  function ensureAssets() {
    const out = {};
    for (const cue of AUDIO_CUES) out[cue] = ensureSamples(cue);
    return out;
  }

  function play(cue) {
    if (!cue || !AUDIO_CUES.includes(cue)) return;
    lastCue = cue;
    lastCueAt = Date.now();
    if (!isAudioEnabled) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        Promise.resolve(ctx.resume()).catch(() => {});
      }
      const samples = ensureSamples(cue);
      const buffer = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
      if (typeof buffer.copyToChannel === 'function') buffer.copyToChannel(samples, 0);
      else buffer.getChannelData(0).set(samples);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.warn(`Web Audio playback warning for cue "${cue}":`, err);
    }
  }

  function toggle() {
    isAudioEnabled = !isAudioEnabled;
    if (!isAudioEnabled) bgm.stopTimer();
    return isAudioEnabled;
  }

  return {
    ensureAssets,
    unlock: () => {
      try {
        const ctx = getAudioContext();
        if (ctx?.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => {});
      } catch {}
    },
    play,
    playBgm: (bgmId) => {
      if (isAudioEnabled) bgm.playTrack(bgmId);
    },
    stopBgm: () => bgm.stop(),
    toggleMusic: () => bgm.toggle(),
    isMusicEnabled: () => bgm.isEnabled(),
    toggle,
    isEnabled: () => isAudioEnabled,
    getLastCue: () => ({ cue: lastCue, at: lastCueAt }),
    getEqDisplay: () => {
      if (!isAudioEnabled) return 'MUTE';
      const recent = Date.now() - lastCueAt < 1200;
      return recent ? `♪ ${lastCue.toUpperCase()} ▂▄▆` : 'AUDIO ON';
    },
  };
}
