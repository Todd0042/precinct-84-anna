import { BGM_CATALOG, MAIN_MENU_BGM_ID, MAIN_MENU_BGM_TRACK } from '../assets/audio-catalog.js';

function getBgmSpec(bgmId) {
  if (!bgmId) return null;
  if (bgmId === MAIN_MENU_BGM_ID) return MAIN_MENU_BGM_TRACK;
  return BGM_CATALOG[bgmId] || null;
}

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Lightweight Web Audio procedural AdLib/Synth looping background sequencer.
 * Zero MP3/WAV blobs needed — turns 40 BGM asset IDs into mood-matched music.
 */
export class BgmSequencer {
  constructor(getContext) {
    this.getContext = getContext;
    this.enabled = true;
    this.currentId = null;
    this.timer = null;
    this.step = 0;
  }

  isEnabled() {
    return this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopTimer();
    } else if (this.currentId) {
      const target = this.currentId;
      this.currentId = null;
      this.playTrack(target);
    }
    return this.enabled;
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.currentId = null;
    this.stopTimer();
  }

  playTrack(bgmId) {
    const track = getBgmSpec(bgmId);
    if (!track) return;
    if (this.currentId === bgmId && this.timer) return;
    this.currentId = bgmId;
    this.stopTimer();
    if (!this.enabled) return;

    const stepMs = Math.max(115, Math.round((60000 / (track.bpm || 90)) / 2));
    this.step = 0;

    const playTone = (ctx, midi, waveType, peakGain, dur) => {
      if (!midi || midi <= 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveType === 'tri' ? 'triangle' : waveType === 'saw' ? 'sawtooth' : waveType || 'sine';
      osc.frequency.value = midiToHz(midi);
      const now = ctx.currentTime || 0;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    };

    const triggerNote = () => {
      if (!this.enabled) return;
      const ctx = this.getContext();
      if (!ctx || typeof ctx.createOscillator !== 'function') return;
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
      const notes = track.notes || [36, 40, 43, 45];
      const idx = this.step;
      this.step += 1;
      const dur = stepMs / 1000;
      playTone(ctx, notes[idx % notes.length], track.wave, 0.045, dur);
      if (Array.isArray(track.bassNotes) && track.bassNotes.length) {
        playTone(ctx, track.bassNotes[idx % track.bassNotes.length], track.bassWave || 'triangle', 0.028, dur);
      }
    };

    if (typeof setInterval === 'function') {
      this.timer = setInterval(triggerNote, stepMs);
    }
  }
}
