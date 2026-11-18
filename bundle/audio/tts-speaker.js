import { CHARACTER_CATALOG } from '../assets/character-catalog.js';
import { getActiveBlueprintBeat } from '../engine/blueprint-runner.js';

const FEMALE_VOICE_RE = /\b(female|woman|samantha|victoria|karen|zira|aria|jenny|ava|allison|susan|helen|libby|sonia|natasha|fiona|moira|tessa|kate|veena|hazel)\b/i;
const MALE_VOICE_RE = /\b(male|man|daniel|david|alex|mark|guy|ryan|christopher|eric|george|oliver|fred|arthur|thomas|lee|rishi|aaron|nicky)\b/i;

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickVoiceForGender(gender, charId = 'narrator', voices = []) {
  const en = voices.filter((v) => !v.lang || v.lang.toLowerCase().startsWith('en'));
  const pool = en.length ? en : voices;
  if (!pool.length) return null;
  const female = pool.filter((v) => FEMALE_VOICE_RE.test(v.name || ''));
  const male = pool.filter((v) => MALE_VOICE_RE.test(v.name || '') && !FEMALE_VOICE_RE.test(v.name || ''));
  let candidates = pool;
  if (gender === 'female' && female.length) candidates = female;
  else if (gender === 'male' && male.length) candidates = male;
  return candidates[hashStr(charId) % candidates.length] || pool[0];
}

export function resolveSpeechProfile(speakerId = 'narrator', voices = []) {
  const ch = CHARACTER_CATALOG[speakerId];
  const gender = ch?.gender || 'narrator';
  const h = hashStr(speakerId);
  const voice = pickVoiceForGender(gender, speakerId, voices);
  const basePitch = gender === 'female' ? 1.12 : gender === 'male' ? 0.88 : 0.96;
  const pitchOffset = gender === 'narrator' ? 0 : ((h % 5) - 2) * 0.05;
  const rateOffset = gender === 'narrator' ? 1.0 : 0.96 + ((h % 3) * 0.04);
  return {
    speakerId,
    gender,
    voice,
    pitch: Math.max(0.65, Math.min(1.45, Number((basePitch + pitchOffset).toFixed(2)))),
    rate: Number(rateOffset.toFixed(2)),
  };
}

function splitSpeakableChunks(text, maxLen = 190) {
  const clean = String(text || '').replace(/^[-=>\s]+/, '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];
  const out = [];
  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  for (const s of sentences) {
    const part = s.trim();
    if (!part) continue;
    if (part.length <= maxLen) out.push(part);
    else {
      for (let i = 0; i < part.length; i += maxLen) out.push(part.slice(i, i + maxLen).trim());
    }
  }
  return out;
}

function inferSpeakerForLog(entry, state) {
  const txt = String(entry?.text || '');
  if (entry?.tag === 'DIALOG' || entry?.tag === 'RADIO') {
    if (/^Claire/i.test(txt)) return 'claire';
    if (/^Sgt\.?\s*Dooley|^Dooley/i.test(txt)) return 'dooley';
    if (/^Capt\.?\s*Morales|^Morales/i.test(txt)) return 'morales';
    if (/^Marcus/i.test(txt)) return 'marcus';
    const beat = getActiveBlueprintBeat(state);
    if (beat?.speakerId) return beat.speakerId;
  }
  if (entry?.tag === 'ACTION') return 'marcus';
  return 'narrator';
}

export function createTtsNarrator({
  enabled = false,
  speechApi = typeof globalThis !== 'undefined' ? globalThis.speechSynthesis : null,
  UtteranceCtor = typeof globalThis !== 'undefined' ? globalThis.SpeechSynthesisUtterance : null,
  onSpeakingChange = null,
} = {}) {
  let isEnabled = Boolean(enabled);
  let paused = false;
  let generation = 0;
  let speaking = false;
  const queue = [];
  const waiters = [];
  let activeUtterance = null;
  let activeTimer = null;
  let lastLogCount = 0;
  let lastStoryId = null;
  let lastPhase = null;

  function resolveWaiters(cancelled = false) {
    while (waiters.length) waiters.shift()({ cancelled });
  }

  function clearSafetyTimer() {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
  }

  function pumpNext() {
    if (speaking || !isEnabled || paused) return;
    if (!queue.length) {
      resolveWaiters(false);
      return;
    }
    const item = queue.shift();
    if (!speechApi || !UtteranceCtor) {
      pumpNext();
      return;
    }

    const genAtStart = generation;
    speaking = true;
    onSpeakingChange?.(true, item);
    const voices = typeof speechApi.getVoices === 'function' ? speechApi.getVoices() : [];
    const prof = resolveSpeechProfile(item.speakerId, voices);
    const utt = new UtteranceCtor(item.text);
    if (prof.voice) utt.voice = prof.voice;
    utt.pitch = prof.pitch;
    utt.rate = prof.rate;
    activeUtterance = utt;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearSafetyTimer();
      activeUtterance = null;
      speaking = false;
      onSpeakingChange?.(false, null);
      if (genAtStart === generation) pumpNext();
    };

    utt.onend = finish;
    utt.onerror = finish;
    activeTimer = setTimeout(finish, Math.max(6000, item.text.length * 130));
    try {
      if (speechApi.paused && typeof speechApi.resume === 'function') speechApi.resume();
      speechApi.speak(utt);
    } catch {
      finish();
    }
  }

  function enqueue(text, speakerId = 'narrator') {
    if (!isEnabled) return;
    for (const chunk of splitSpeakableChunks(text)) {
      queue.push({ text: chunk, speakerId });
    }
    pumpNext();
  }

  function pauseAfterSentence() {
    paused = true;
  }

  function resumeSpeech() {
    if (!paused) return;
    paused = false;
    pumpNext();
  }

  function stop() {
    paused = false;
    generation += 1;
    queue.length = 0;
    clearSafetyTimer();
    activeUtterance = null;
    speaking = false;
    onSpeakingChange?.(false, null);
    try { speechApi?.cancel?.(); } catch {}
    resolveWaiters(true);
  }

  function ingestState(state) {
    if (!state || state.phase !== 'playing') {
      lastPhase = state?.phase || null;
      return;
    }
    const logs = Array.isArray(state.log) ? state.log : [];
    if (lastPhase !== 'playing' || state.storyId !== lastStoryId || logs.length < lastLogCount) {
      lastLogCount = state.turn > 0 && logs.length > 4 ? logs.length - 2 : 0;
      lastStoryId = state.storyId || null;
      lastPhase = state.phase;
    }
    if (!isEnabled) {
      lastLogCount = logs.length;
      return;
    }
    const fresh = logs.slice(lastLogCount);
    lastLogCount = logs.length;
    for (const entry of fresh) {
      if (!entry?.text || entry.tag === 'CMD') continue;
      if (entry.tag === 'SYSTEM' && /^Saved game/i.test(entry.text)) continue;
      enqueue(entry.text, inferSpeakerForLog(entry, state));
    }
  }

  return {
    isSupported: () => Boolean(speechApi && UtteranceCtor),
    isEnabled: () => isEnabled,
    setEnabled(val) {
      isEnabled = Boolean(val);
      if (!isEnabled) stop();
      return isEnabled;
    },
    toggle() {
      return this.setEnabled(!isEnabled);
    },
    enqueue,
    ingestState,
    syncCursor(state) {
      lastLogCount = Array.isArray(state?.log) ? state.log.length : 0;
      lastStoryId = state?.storyId || null;
      lastPhase = state?.phase || null;
    },
    speakCurrentRecap(state) {
      if (!isEnabled || state?.phase !== 'playing') return;
      const logs = Array.isArray(state.log) ? state.log : [];
      let startIdx = Math.max(0, logs.length - 4);
      for (let i = logs.length - 1; i >= 0; i--) {
        if (logs[i]?.tag === 'SCENE') { startIdx = i; break; }
      }
      for (const entry of logs.slice(startIdx)) {
        if (entry?.text && entry.tag !== 'CMD' && !(entry.tag === 'SYSTEM' && /^Saved game/i.test(entry.text))) {
          enqueue(entry.text, inferSpeakerForLog(entry, state));
        }
      }
      lastLogCount = logs.length;
    },
    waitUntilIdle() {
      if (!isEnabled || (!paused && !speaking && !queue.length)) return Promise.resolve({ cancelled: false });
      return new Promise((resolve) => waiters.push(resolve));
    },
    isPaused: () => paused,
    pauseAfterSentence,
    resumeSpeech,
    stop,
  };
}
