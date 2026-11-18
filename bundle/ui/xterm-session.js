import { createInitialState, executeCommand, getSuggestedChips } from '../game/campaign.js';
import { parseCommand } from '../engine/parser.js';
import { createAudioEngine } from '../engine/audio.js';
import { MODEL_PRESETS } from '../engine/anna-ai.js';
import { buildScreenFrame, HIGHRES_COLS, HIGHRES_ROWS } from './layout.js';
import { createAiTaskRunner, buildShiftResetState, hasGeneratedStory, replayExistingStory, syncSceneMusic } from './session-ai.js';
import { buildPlayableStateFromEntry } from '../storage-library.js';

export function createXtermTuiSession({
  term,
  initialState = createInitialState(),
  anna = null,
  saveStore = null,
  storyLib = null,
  modelCatalog = MODEL_PRESETS,
  audioEnabled = true,
  audioContextFactory = null,
  textOnly = false,
  onStateChange = null,
  onTick = null,
  onQuit = null,
  tickIntervalMs = 150,
} = {}) {
  if (!term || typeof term.write !== 'function' || typeof term.onData !== 'function') {
    throw new Error('createXtermTuiSession requires an xterm-compatible Terminal instance.');
  }

  const audio = createAudioEngine({ enabled: audioEnabled, audioContextFactory });
  const startInModeSelect = initialState.phase === 'mode_select';

  let state = initialState;
  let catalog = Array.isArray(modelCatalog) && modelCatalog.length ? modelCatalog : MODEL_PRESETS;
  let tick = 0;
  let inputBuffer = '';
  let showManual = false;
  let aiBusy = false;
  let aiProgress = null;
  let lastError = null;
  const history = [];
  let historyIdx = -1;
  let tabIdx = 0;
  let disposed = false;
  let latestFrame = { screenText: '', chipHitboxes: [], toolbarHitboxes: [], canvasHitboxes: [] };

  const enterScreen = '\x1b[?1049h\x1b[?25l\x1b[?1000h\x1b[?1006h';
  const leaveScreen = '\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l';

  function notifyChange() {
    if (typeof onStateChange === 'function') onStateChange(state, latestFrame);
  }

  function render() {
    if (disposed) return latestFrame;
    const cols = term.cols || (textOnly ? 100 : HIGHRES_COLS);
    const rows = term.rows || (textOnly ? 13 : HIGHRES_ROWS);
    const frame = buildScreenFrame({
      state,
      tick,
      audioEq: audio.getEqDisplay(),
      inputBuffer,
      showManual,
      catalog,
      aiBusy,
      textOnly,
      cols,
      rows,
    });
    latestFrame = frame;
    const output = '\x1b[H' + frame.screenText.split('\n').map((line) => `${line}\x1b[K`).join('\r\n');
    term.write(output);
    return frame;
  }

  const aiRunner = createAiTaskRunner({
    anna,
    audio,
    saveStore,
    storyLib,
    getState: () => state,
    setState: (s) => { state = s; },
    setAiBusy: (v) => { aiBusy = v; },
    setAiProgress: (p) => { aiProgress = p; },
    setLastError: (e) => { lastError = e; },
    render,
    notifyChange,
  });

  function updateSetupField(patch, playTick = true) {
    state = { ...state, ...patch };
    if (playTick) audio.play('tick');
    render();
    notifyChange();
  }

  function selectTier(tier) { updateSetupField({ aiTier: Math.max(1, Math.min(3, Number(tier) || 1)) }); }
  function setModel(modelId) { updateSetupField({ aiModel: modelId || 'preset:default' }); }

  function cycleModel(delta = 1) {
    if (!catalog.length) return;
    const cur = catalog.findIndex((m) => m.id === state.aiModel);
    setModel(catalog[(cur === -1 ? 0 : cur + delta + catalog.length) % catalog.length].id);
  }

  function toggleStoryGenMode(targetTier = null) {
    const nextTier = Number(targetTier) >= 2 ? Number(targetTier) : (state.aiTier >= 2 ? state.aiTier : 3);
    updateSetupField({ aiTier: nextTier, storyGenMode: state.storyGenMode === 'full' ? 'episodic' : 'full' });
  }

  function setStoryTheme(storyTheme) {
    state = { ...state, storyTheme: String(storyTheme || '').slice(0, 80) };
    notifyChange();
  }

  function resetSession(customNotice = null, forceModeSelect = false) {
    const fresh = buildShiftResetState(state, forceModeSelect || startInModeSelect);
    fresh.log.push({
      tag: 'SYSTEM',
      text: customNotice || 'Session reset. Welcome back to Precinct 84 roll call, Officer Mercer.',
    });
    state = fresh;
    inputBuffer = '';
    showManual = false;
    historyIdx = history.length;
    tabIdx = 0;
    if (state.phase === 'mode_select') syncSceneMusic(state, audio);
    else audio.stopBgm();
    audio.play('tick');
    render();
    notifyChange();
  }

  function replaySameStory() {
    state = replayExistingStory(state);
    aiRunner.persistActiveTier(state);
    syncSceneMusic(state, audio);
    audio.play('squelch');
    render();
    notifyChange();
  }

  function regenerateNewStory() {
    return aiRunner.regenerateTierStory(state);
  }

  function returnToModeSelect() {
    aiRunner.persistActiveTier(state);
    state = { ...state, phase: 'mode_select' };
    syncSceneMusic(state, audio);
    render();
    notifyChange();
  }

  function runCmd(cmdText) {
    const trimmed = String(cmdText || '').trim();
    if (!trimmed || aiBusy) return null;

    if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'restart') {
      resetSession();
      if (typeof onQuit === 'function') onQuit({ reset: true });
      return { state, reset: true };
    }

    history.push(trimmed);
    historyIdx = history.length;
    tabIdx = 0;
    const parsed = parseCommand(trimmed);

    if (parsed.verb === 'select_tier') { selectTier(parsed.noun); return { state }; }
    if (parsed.verb === 'cycle_model') { cycleModel(parsed.noun === 'prev' ? -1 : 1); return { state }; }
    if (state.phase === 'mode_select') {
      aiRunner.startShiftFromModeSelect(state);
      return { state };
    }
    if (state.intermission) {
      const res = aiRunner.resolveIntermission(trimmed);
      if (res) {
        state = res.state;
        aiRunner.persistActiveTier(state);
        syncSceneMusic(state, audio);
        if (res.sfx) audio.play(res.sfx);
        render();
        notifyChange();
        return res;
      }
    }
    if (parsed.verb === 'ask_claire') {
      aiRunner.askClaire(parsed.target);
      return { state, pending: true };
    }
    if (parsed.verb === 'ask_npc' && !state.aiCampaign?.active) {
      aiRunner.askNpc(trimmed);
      return { state, pending: true };
    }
    if (parsed.verb === 'continue_story' && (state.aiCampaign?.awaitingNextChapter || state.victory || state.scene === 'epilogue_ceremony')) {
      aiRunner.continueNextChapter();
      return { state, pending: true };
    }

    const isMeta = ['undo', 'save', 'restore', 'save_quit', 'manual', 'score', 'inventory'].includes(parsed.verb);
    if (state.aiCampaign?.active && !isMeta && !state.gameOver) {
      const bpRes = aiRunner.runCompiledTurn(trimmed);
      if (bpRes) {
        state = bpRes.state;
        aiRunner.persistActiveTier(state);
        if (bpRes.bgmId) audio.playBgm(bpRes.bgmId);
        if (bpRes.sfx) audio.play(bpRes.sfx);
        render();
        notifyChange();
        return bpRes;
      }
    }

    const prevScene = state.scene;
    const res = executeCommand(state, trimmed);
    state = res.state;
    if (res.meta?.openManual) showManual = !showManual;
    if (res.sfx) audio.play(res.sfx);
    if (res.meta?.quit) {
      const slot = res.meta.savedSlot || 'quicksave';
      aiRunner.persistActiveTier(state);
      resetSession(`Saved progress to "${slot}" and ended shift. Type "restore ${slot}" to resume.`);
      if (typeof onQuit === 'function') onQuit(res.meta);
      return { ...res, state, reset: true };
    }
    aiRunner.persistActiveTier(state);
    render();
    notifyChange();
    aiRunner.handlePostDeterministic({ prevScene, res });
    return res;
  }

  function handleToolbarAction(action) {
    if (action === 'manual') showManual = !showManual;
    else if (action === 'audio') audio.toggle();
    else if (action === 'music') audio.toggleMusic();
    else if (action === 'save') return runCmd('save quicksave');
    else if (action === 'undo') return runCmd('undo');
    else if (action === 'restore') return runCmd('restore quicksave');
    else if (action === 'modes') return returnToModeSelect();
    else if (action === 'reset') {
      resetSession(null, startInModeSelect);
      return null;
    }
    render();
    notifyChange();
    return null;
  }

  function handleScreenClick(col, row) {
    for (const box of latestFrame.toolbarHitboxes) {
      if (row === box.y && col >= box.x0 && col <= box.x1) { handleToolbarAction(box.action); return true; }
    }
    for (const box of latestFrame.canvasHitboxes || []) {
      if (row >= box.y0 && row <= box.y1 && col >= box.x0 && col <= box.x1) {
        if (box.action.startsWith('tier:')) selectTier(box.action.slice(5));
        else if (box.action.startsWith('toggle_gen_mode')) toggleStoryGenMode(box.action.split(':')[1] || null);
        else if (box.action === 'prev_model') cycleModel(-1);
        else if (box.action === 'next_model') cycleModel(1);
        else if (box.action === 'start_shift') aiRunner.startShiftFromModeSelect(state);
        return true;
      }
    }
    for (const chip of latestFrame.chipHitboxes) {
      if (row === chip.y && col >= chip.x0 && col <= chip.x1) { runCmd(chip.command); return true; }
    }
    return false;
  }

  function handleMouseEvent(seq) {
    const matches = seq.matchAll(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/g);
    let handled = false;
    for (const m of matches) {
      if (m[4] === 'M' && Number(m[1]) === 0 && handleScreenClick(Number(m[2]), Number(m[3]))) handled = true;
    }
    return handled;
  }

  function onData(bufOrStr) {
    if (disposed) return;
    const str = typeof bufOrStr === 'string' ? bufOrStr : String(bufOrStr);
    if (str === '\x03') { inputBuffer = ''; render(); return; }
    if (str.startsWith('\x1b[<')) { handleMouseEvent(str); return; }
    if (str === '\x1bOP' || str === '\x1b[11~') { showManual = !showManual; render(); notifyChange(); return; }
    if (str === '\x1bOQ' || str === '\x1b[12~') { audio.toggle(); render(); notifyChange(); return; }
    if (str === '\x1bOR' || str === '\x1b[13~') { audio.toggleMusic(); render(); notifyChange(); return; }
    if (str === '\x1b[15~') return runCmd('save quicksave');
    if (str === '\x1b[20~') return runCmd('undo');
    if (str === '\x1b') { if (showManual) { showManual = false; render(); notifyChange(); } return; }

    if (state.phase === 'mode_select' && !inputBuffer) {
      if (str === '1' || str === '2' || str === '3') return selectTier(Number(str));
      if (str === '\x1b[D') return selectTier(((state.aiTier || 1) + 1) % 3 + 1);
      if (str === '\x1b[C') return selectTier(((state.aiTier || 1) % 3) + 1);
      if (str === 'm' || str === 'M') return cycleModel(1);
      if (str === '\r' || str === '\n') return aiRunner.startShiftFromModeSelect(state);
    }
    if (str === '\x1b[A') {
      if (history.length > 0 && historyIdx > 0) { historyIdx -= 1; inputBuffer = history[historyIdx]; render(); }
      return;
    }
    if (str === '\x1b[B') {
      if (historyIdx < history.length - 1) { historyIdx += 1; inputBuffer = history[historyIdx]; }
      else { historyIdx = history.length; inputBuffer = ''; }
      render();
      return;
    }
    if (str.startsWith('\x1b')) return;

    let dirty = false;
    for (const ch of str) {
      if (ch === '\t') {
        const chips = getSuggestedChips(state);
        if (chips.length > 0) { inputBuffer = chips[tabIdx % chips.length].command; tabIdx += 1; dirty = true; }
      } else if (ch === '\r' || ch === '\n') {
        const cmd = inputBuffer;
        inputBuffer = '';
        dirty = false;
        runCmd(cmd);
      } else if (ch === '\x7f' || ch === '\b') {
        inputBuffer = inputBuffer.slice(0, -1);
        dirty = true;
      } else if (ch >= ' ') {
        inputBuffer += ch;
        dirty = true;
      }
    }
    if (dirty) render();
  }

  term.write(enterScreen);
  const dataSub = term.onData(onData);
  const resizeSub = typeof term.onResize === 'function' ? term.onResize(() => render()) : null;
  render();
  syncSceneMusic(state, audio);
  notifyChange();

  const timer = tickIntervalMs && tickIntervalMs > 0
    ? setInterval(() => {
        tick = (tick + 1) % 10000;
        render();
        if (typeof onTick === 'function') onTick(tick, state);
      }, tickIntervalMs)
    : null;

  return {
    render,
    runCmd,
    sendInput: onData,
    handleToolbarAction,
    handleScreenClick,
    selectTier,
    setModel,
    cycleModel,
    toggleStoryGenMode,
    setStoryTheme,
    continueStory: () => aiRunner.continueNextChapter(),
    resumeTier: () => aiRunner.resumeTierSaved(state),
    deleteTierSave: (tier, deleteStory) => aiRunner.deleteTierSave(state, tier, deleteStory),
    startShift: (opts) => aiRunner.startShiftFromModeSelect(state, opts),
    askClaire: (q = '') => aiRunner.askClaire(q),
    waitForAi: () => aiRunner.waitForIdle(),
    hasGeneratedStory: () => hasGeneratedStory(state),
    replaySameStory,
    regenerateNewStory,
    returnToModeSelect,
    loadSavedStoryEntry: (entry, resumeProgress = true) => {
      const next = buildPlayableStateFromEntry(entry, { resumeProgress, llmAvailable: state.llmAvailable });
      state = next;
      aiRunner.persistActiveTier(state);
      syncSceneMusic(state, audio);
      audio.play('squelch');
      render();
      notifyChange();
      return state;
    },
    setModelCatalog: (c) => { if (Array.isArray(c) && c.length) { catalog = c; render(); notifyChange(); } },
    resetSession,
    getState: () => state,
    getAiProgress: () => aiProgress,
    getLastError: () => lastError,
    reportError: (e) => { lastError = e; notifyChange(); },
    clearLastError: () => { lastError = null; notifyChange(); },
    setState: (s) => { state = s; render(); notifyChange(); },
    getLatestFrame: () => latestFrame,
    getAudio: () => audio,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (timer) clearInterval(timer);
      audio.stopBgm();
      dataSub?.dispose?.();
      resizeSub?.dispose?.();
      term.write(leaveScreen);
    },
  };
}
