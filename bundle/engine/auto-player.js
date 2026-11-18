import { getActiveBlueprintBeat } from './blueprint-runner.js';
import { getSuggestedChips } from '../game/chips.js';

export function getAutoPlayChoices(state) {
  if (!state || state.phase !== 'playing') return [];
  if (state.intermission?.choices?.length) return state.intermission.choices;
  if (state.aiCampaign?.awaitingNextChapter) {
    return [{ label: 'Continue Next Chapter', command: 'continue story', isContinue: true }];
  }
  const beat = getActiveBlueprintBeat(state);
  if (beat?.actions?.length) return beat.actions;
  return getSuggestedChips(state).filter((c) => c.command !== 'undo' && c.command !== 'ask claire');
}

export function createAutoPlayer({
  getState,
  runCmd,
  continueStory,
  chooseWithLlm,
  waitForAi = null,
  tts,
  onStatusChange = null,
  stepDelayMs = 280,
} = {}) {
  let mode = 'off'; // 'off' | 'sequential' | 'llm'
  let paused = false;
  let runToken = 0;
  let seqCursor = 0;
  const triedByBeat = new Map();
  const pauseWaiters = [];

  function notify() {
    onStatusChange?.({ mode, paused, running: mode !== 'off' });
  }

  function wakePauseWaiters() {
    while (pauseWaiters.length) pauseWaiters.shift()();
  }

  async function waitIfPaused(token) {
    while (paused && token === runToken && mode !== 'off') {
      await new Promise((resolve) => pauseWaiters.push(resolve));
    }
    return token === runToken && mode !== 'off';
  }

  function delayOrStop(ms, token) {
    if (ms <= 0) return Promise.resolve(token === runToken && mode !== 'off');
    return new Promise((resolve) => {
      setTimeout(() => resolve(token === runToken && mode !== 'off'), ms);
    });
  }

  function pickSequentialChoice(state, choices) {
    const key = state.aiCampaign?.active
      ? `${state.aiCampaign.chapterIdx}:${state.aiCampaign.currentBeatId}`
      : state.intermission
        ? `inter:${state.intermission.transitionKey || state.scene}`
        : `${state.scene}:${state.pursuitStage || 0}`;
    const tried = triedByBeat.get(key) || new Set();
    let pick = choices.find((c) => !tried.has(c.command));
    if (!pick) {
      pick = choices[seqCursor % choices.length];
      tried.clear();
    }
    seqCursor += 1;
    tried.add(pick.command);
    triedByBeat.set(key, tried);
    return pick;
  }

  async function loop(token) {
    while (token === runToken && mode !== 'off') {
      if (!(await waitIfPaused(token))) break;
      await waitForAi?.();
      if (!(await waitIfPaused(token))) break;
      const state = getState();
      if (!state || state.phase !== 'playing') { stop(false); break; }

      await tts?.waitUntilIdle?.();
      if (!(await waitIfPaused(token))) break;

      if (state.gameOver) {
        if (tts?.isEnabled()) {
          tts.enqueue(`Citation ${state.gameOver.citation || ''}. Undoing to try next option.`, 'narrator');
          await tts.waitUntilIdle();
          if (!(await waitIfPaused(token))) break;
        }
        runCmd('undo');
        if (!(await delayOrStop(stepDelayMs, token))) break;
        continue;
      }

      if (state.victory) { stop(false); break; }

      const choices = getAutoPlayChoices(state);
      if (!choices.length) { stop(false); break; }

      if (choices[0]?.isContinue) {
        if (mode !== 'llm') { stop(false); break; }
        if (tts?.isEnabled()) {
          tts.enqueue('Generating next chapter.', 'narrator');
          await tts.waitUntilIdle();
          if (!(await waitIfPaused(token))) break;
        }
        await continueStory();
        if (!(await delayOrStop(stepDelayMs, token))) break;
        continue;
      }

      let chosen = null;
      if (mode === 'llm' && typeof chooseWithLlm === 'function') {
        chosen = await chooseWithLlm(state, choices);
        if (!(await waitIfPaused(token))) break;
      }
      if (!chosen) chosen = pickSequentialChoice(state, choices);

      if (tts?.isEnabled()) {
        const spokenLabel = chosen.label || chosen.command;
        tts.enqueue(`Selecting: ${spokenLabel}.`, 'narrator');
        await tts.waitUntilIdle();
        if (!(await waitIfPaused(token))) break;
      }

      runCmd(chosen.command);
      if (!(await delayOrStop(stepDelayMs, token))) break;
    }
  }

  function start(nextMode = 'sequential') {
    if (nextMode !== 'sequential' && nextMode !== 'llm') return stop();
    if (mode !== 'off') tts?.stop?.();
    paused = false;
    wakePauseWaiters();
    runToken += 1;
    mode = nextMode;
    seqCursor = 0;
    triedByBeat.clear();
    notify();
    const myToken = runToken;
    Promise.resolve().then(() => loop(myToken));
  }

  function pause() {
    if (mode === 'off' || paused) return;
    paused = true;
    tts?.pauseAfterSentence?.();
    notify();
  }

  function resume() {
    if (mode === 'off' || !paused) return;
    paused = false;
    tts?.resumeSpeech?.();
    wakePauseWaiters();
    notify();
  }

  function togglePause() {
    if (mode === 'off') return false;
    if (paused) resume();
    else pause();
    return paused;
  }

  function stop(interruptSpeech = true) {
    if (mode === 'off') return;
    mode = 'off';
    paused = false;
    runToken += 1;
    wakePauseWaiters();
    if (interruptSpeech) tts?.stop?.();
    notify();
  }

  function cycleMode() {
    if (mode === 'off') start('sequential');
    else if (mode === 'sequential') start('llm');
    else stop();
    return mode;
  }

  return {
    getMode: () => mode,
    isRunning: () => mode !== 'off',
    isPaused: () => paused,
    start,
    pause,
    resume,
    togglePause,
    stop,
    cycleMode,
  };
}
