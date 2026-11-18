import { AnnaAppRuntime } from '/static/anna-apps/_sdk/latest/index.js';
import { Terminal } from './vendor/xterm.bundle.js';
import { PrecinctSaveStore } from './storage.js';
import { StoryLibraryStore } from './storage-library.js';
import { wireStoryLibraryModal } from './ui/story-modal.js';
import { loadAiPrefs, saveAiPrefs, populateModelSelect, wireDeleteSaveModal, createBannerRenderer } from './ui/setup-helpers.js';
import { createInitialState, setActiveSaveStore, SCENE_META } from './game/state.js';
import { getSuggestedChips } from './game/campaign.js';
import { MODEL_PRESETS, loadModelCatalog, hasLlmSupport, formatDetailedError, DEMO_VERBOSE_ERRORS } from './engine/anna-ai.js';
import { getActiveBlueprintBeat } from './engine/blueprint-runner.js';
import { drawSvgaScene, drawSvgaModeSelect } from './gfx/scene-compositor.js';
import { createXtermTuiSession } from './ui/xterm-session.js';
import { MAIN_MENU_BGM_ID } from './assets/audio-catalog.js';
import { createTtsNarrator } from './audio/tts-speaker.js';
import { createAutoPlayer } from './engine/auto-player.js';
import { chooseAutoPlayOption } from './engine/story-director.js';

const TEXT_COLS = 104;
const TEXT_ROWS = 13;

function hardenXtermTextarea(term) {
  const ta = term?.textarea;
  if (!ta) return;
  ta.setAttribute('autocomplete', 'off');
  ta.setAttribute('autocorrect', 'off');
  ta.setAttribute('autocapitalize', 'off');
  ta.setAttribute('spellcheck', 'false');
  ta.setAttribute('data-gramm', 'false');
}

async function main() {
  const shellEl = document.getElementById('app-shell');
  const statusDot = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');
  const scoreBadge = document.getElementById('score-badge');
  const sceneBadge = document.getElementById('scene-badge');
  const saveStatusBadge = document.getElementById('save-status-badge');
  const btnScaleMode = document.getElementById('btn-scale-mode');
  const btnTiers = document.getElementById('btn-tiers');
  const btnStories = document.getElementById('btn-stories');
  const btnAskClaire = document.getElementById('btn-ask-claire');
  const btnAudio = document.getElementById('btn-audio');
  const btnMusic = document.getElementById('btn-music');
  const btnTts = document.getElementById('btn-tts');
  const btnAutoPlay = document.getElementById('btn-autoplay');
  const btnAutoPause = document.getElementById('btn-auto-pause');
  const btnRestore = document.getElementById('btn-restore');
  const btnReset = document.getElementById('btn-reset');
  const modalReset = document.getElementById('modal-reset');
  const aiSetupStrip = document.getElementById('ai-setup-strip');
  const btnDeleteSave = document.getElementById('btn-delete-save');
  const aiModelSelect = document.getElementById('ai-model-select');
  const aiThemeInput = document.getElementById('ai-theme-input');
  const btnGenMode = document.getElementById('btn-gen-mode');
  const btnStartShift = document.getElementById('btn-start-shift');
  const btnCopyError = document.getElementById('btn-copy-error');
  const btnDismissError = document.getElementById('btn-dismiss-error');
  const svgaCanvas = document.getElementById('svga-canvas');
  const svgaCtx = svgaCanvas.getContext('2d');
  const xtermStage = document.getElementById('xterm-stage');
  const xtermViewportBox = document.getElementById('xterm-viewport-box');
  const xtermScaleWrap = document.getElementById('xterm-scale-wrap');
  const xtermContainer = document.getElementById('xterm-container');
  const chipStrip = document.getElementById('chip-strip');
  const touchCmdForm = document.getElementById('touch-cmd-form');
  const touchCmdInput = document.getElementById('touch-cmd-input');

  const coverImg = new Image();
  coverImg.src = './assets/title-noir.jpg';

  let anna = null;
  try {
    anna = await AnnaAppRuntime.connect({ theme: 'dark', themeMode: 'dark' });
    if (anna.window?.set_title) await anna.window.set_title({ title: 'Precinct 84 — SVGA AI' });
    statusDot.classList.remove('standalone');
    statusLabel.textContent = 'Precinct 84 (Anna)';
  } catch {
    statusDot.classList.add('standalone');
    statusLabel.textContent = 'Precinct 84 (Local)';
  }

  const saveStore = new PrecinctSaveStore(anna);
  setActiveSaveStore(saveStore);
  const openDeleteSavePrompt = wireDeleteSaveModal({ saveStore, getSession: () => session });
  saveStore.onStatusChange((st) => {
    if (!saveStatusBadge) return;
    if (st.mode === 'saving') { saveStatusBadge.textContent = 'SAVING...'; saveStatusBadge.classList.add('warn'); }
    else if (st.mode === 'cloud+local') { saveStatusBadge.textContent = 'SAVED (KV+LOCAL)'; saveStatusBadge.classList.remove('warn'); }
    else if (st.mode === 'local_only') { saveStatusBadge.textContent = 'LOCAL BACKUP ONLY'; saveStatusBadge.classList.add('warn'); }
    else if (st.mode === 'error') { saveStatusBadge.textContent = 'SAVE ERR!'; saveStatusBadge.classList.add('warn'); }
    else { saveStatusBadge.textContent = st.verified ? 'SAVED (LOCAL)' : 'SAVE READY'; saveStatusBadge.classList.remove('warn'); }
  });
  await saveStore.load();
  await saveStore.loadTiers();
  const storyLib = new StoryLibraryStore(anna);
  await storyLib.load();

  const savedPrefs = loadAiPrefs();
  let catalog = [...MODEL_PRESETS];
  populateModelSelect(aiModelSelect, catalog, savedPrefs.aiModel || 'preset:default');

  const term = new Terminal({
    cols: TEXT_COLS,
    rows: TEXT_ROWS,
    convertEol: true,
    cursorBlink: false,
    scrollback: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Mono', monospace",
    fontSize: 13,
    lineHeight: 1.05,
    theme: { background: '#070912', foreground: '#e2e6ee', cursor: '#38f0ff', selectionBackground: '#264488' },
  });
  term.open(xtermContainer);
  hardenXtermTextarea(term);

  let scaleMode = 'fit';
  let svgaHitboxes = [];
  let session = null;
  let storyUi = null;
  let autoPlayer = null;
  const tts = createTtsNarrator({ enabled: false });
  const banners = createBannerRenderer(() => requestAnimationFrame(updateWindowScale));

  function renderAutoButtons(state = session?.getState?.()) {
    const mode = autoPlayer?.getMode?.() || 'off';
    const playing = state?.phase === 'playing';
    if (btnTts) {
      btnTts.textContent = tts.isEnabled() ? 'TTS: ON' : 'TTS: OFF';
      btnTts.classList.toggle('active', tts.isEnabled());
    }
    if (btnAutoPlay) {
      btnAutoPlay.disabled = !playing;
      btnAutoPlay.textContent = mode === 'sequential' ? 'Auto: Seq' : mode === 'llm' ? 'Auto: AI' : 'Auto: OFF';
      btnAutoPlay.classList.toggle('active', mode !== 'off');
    }
    if (btnAutoPause) {
      const isPaused = autoPlayer?.isPaused?.() || false;
      btnAutoPause.classList.toggle('hidden', mode === 'off');
      btnAutoPause.textContent = isPaused ? 'Resume' : 'Pause';
      btnAutoPause.className = `hdr-btn ${isPaused ? 'hdr-resume' : 'hdr-warn'}${mode === 'off' ? ' hidden' : ''}`;
    }
  }

  function renderCanvas(tick, state) {
    if (!svgaCtx || !state) return;
    const aiProgress = session?.getAiProgress?.() || null;
    if (state.phase === 'mode_select') {
      svgaHitboxes = drawSvgaModeSelect(svgaCtx, state, tick, {
        coverImg,
        catalog,
        tierSaves: saveStore.listTierSummaries(),
        aiProgress,
      });
    } else {
      svgaHitboxes = [];
      const activeBeat = getActiveBlueprintBeat(state);
      drawSvgaScene(svgaCtx, state, tick, { activeBeat, aiProgress });
    }
  }

  function updateWindowScale() {
    if (window.visualViewport) shellEl.style.height = `${window.visualViewport.height}px`;
    const natW = xtermContainer.offsetWidth || 820;
    const natH = xtermContainer.offsetHeight || 180;
    const availW = Math.max(240, (xtermStage.clientWidth || window.innerWidth) - 8);
    const availH = Math.max(84, (xtermStage.clientHeight || 180) - 6);
    const scale = scaleMode === 'fit' ? Math.min(availW / natW, availH / natH) : 1;

    xtermStage.classList.toggle('pan-mode', scaleMode !== 'fit');
    xtermScaleWrap.style.width = `${natW}px`;
    xtermScaleWrap.style.height = `${natH}px`;
    xtermScaleWrap.style.transform = `scale(${scale.toFixed(4)})`;
    xtermViewportBox.style.width = `${Math.max(1, Math.floor(natW * scale))}px`;
    xtermViewportBox.style.height = `${Math.max(1, Math.floor(natH * scale))}px`;
    btnScaleMode.textContent = scaleMode === 'fit' ? `Fit (${Math.round(scale * 100)}%)` : '1:1 Pan';
    btnScaleMode.classList.toggle('active', scaleMode === 'fit');
  }

  function syncUi(state) {
    if (!state) return;
    scoreBadge.textContent = `Score: ${state.score}/${state.maxScore}`;
    const inSelect = state.phase === 'mode_select';
    sceneBadge.textContent = inSelect ? `TIER ${state.aiTier || 1}` : state.aiCampaign?.active ? 'CASE II (AI)' : SCENE_META[state.scene]?.act || state.scene;
    aiSetupStrip.classList.toggle('hidden', !inSelect);
    const activeTier = state.aiTier || 1;
    const activeTierSave = saveStore.listTierSummaries()[activeTier] || null;
    if (btnDeleteSave) {
      btnDeleteSave.disabled = !activeTierSave;
      btnDeleteSave.title = activeTierSave
        ? `Delete saved progress or generated story for Tier ${activeTier}`
        : `No save file yet for Tier ${activeTier}`;
    }
    if (btnStartShift) {
      btnStartShift.textContent = activeTierSave?.hasProgress
        ? `Resume T${activeTier}`
        : activeTierSave?.hasVault
          ? `Replay T${activeTier}`
          : 'Start Shift';
      btnStartShift.className = `hdr-btn ${activeTierSave?.hasProgress ? 'hdr-resume' : activeTierSave?.hasVault ? 'hdr-accent' : 'hdr-send'}`;
      btnStartShift.title = activeTierSave?.hasProgress
        ? `Resume saved Tier ${activeTier} shift (${activeTierSave.score || 0} pts)`
        : activeTierSave?.hasVault
          ? `Replay generated Tier ${activeTier} story from Ch. 1`
          : `Start new Tier ${activeTier} shift`;
    }
    if (btnGenMode) {
      const fullMode = state.storyGenMode === 'full';
      btnGenMode.classList.toggle('hidden', activeTier < 2);
      btnGenMode.textContent = activeTier === 2 ? (fullMode ? 'Gen: Full 3-Act' : 'Gen: 1-by-1') : (fullMode ? 'Gen: Full Case' : 'Gen: Ch x Ch');
      btnGenMode.title = 'Toggle 1-part-at-a-time vs Full Story upfront (applies to Tier 2, Tier 3 & unlocked Case II)';
    }
    btnAskClaire.disabled = inSelect;
    btnTiers.disabled = inSelect;
    if (aiModelSelect.value !== state.aiModel && catalog.some((m) => m.id === state.aiModel)) aiModelSelect.value = state.aiModel;
    if (aiThemeInput && document.activeElement !== aiThemeInput && aiThemeInput.value !== (state.storyTheme || '')) aiThemeInput.value = state.storyTheme || '';
    saveAiPrefs(state.aiTier, state.aiModel, state.storyGenMode, state.storyTheme || '');

    if (inSelect && autoPlayer?.isRunning()) autoPlayer.stop();
    if (session) {
      btnAudio.textContent = session.getAudio().isEnabled() ? 'F2 SFX: ON' : 'F2 SFX: MUTE';
      btnMusic.textContent = session.getAudio().isMusicEnabled() ? 'F3 BGM: ON' : 'F3 BGM: OFF';
      tts.ingestState(state);
      renderAutoButtons(state);
      banners.renderProgress(session.getAiProgress());
      banners.renderError(session.getLastError());
      storyUi?.updateButtonCount?.();
    }
    btnRestore.disabled = saveStore.listSlots().length === 0;

    chipStrip.replaceChildren();
    for (const chip of getSuggestedChips(state)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn';
      btn.textContent = chip.label;
      btn.addEventListener('click', () => { autoPlayer?.stop(); session?.runCmd(chip.command); });
      chipStrip.appendChild(btn);
    }
    renderCanvas(0, state);
    requestAnimationFrame(updateWindowScale);
  }

  session = createXtermTuiSession({
    term,
    anna,
    saveStore,
    storyLib,
    modelCatalog: catalog,
    textOnly: true,
    initialState: createInitialState({
      phase: 'mode_select',
      aiTier: savedPrefs.aiTier || 1,
      aiModel: savedPrefs.aiModel || 'preset:default',
      storyGenMode: savedPrefs.storyGenMode || 'episodic',
      storyTheme: savedPrefs.storyTheme || '',
      llmAvailable: hasLlmSupport(anna),
    }),
    audioEnabled: true,
    onStateChange: syncUi,
    onTick: renderCanvas,
  });

  if (anna) {
    loadModelCatalog(anna, (catErr) => session.reportError(catErr)).then((loaded) => {
      catalog = loaded;
      populateModelSelect(aiModelSelect, catalog, session.getState().aiModel);
      session.setModelCatalog(catalog);
    });
  }

  const unlockMenuBgm = () => {
    const au = session?.getAudio?.();
    au?.unlock?.();
    if (session?.getState?.()?.phase === 'mode_select') au?.playBgm?.(MAIN_MENU_BGM_ID);
  };
  window.addEventListener('pointerdown', unlockMenuBgm, { once: true });
  window.addEventListener('keydown', unlockMenuBgm, { once: true });
  window.addEventListener('error', (ev) => {
    session.reportError(formatDetailedError(ev.error || ev.message, { stage: 'Uncaught UI Error', extra: { demoVerbose: DEMO_VERBOSE_ERRORS } }));
  });
  window.addEventListener('unhandledrejection', (ev) => {
    session.reportError(formatDetailedError(ev.reason, { stage: 'Unhandled Promise Rejection', extra: { demoVerbose: DEMO_VERBOSE_ERRORS } }));
  });
  btnDismissError.addEventListener('click', () => session.clearLastError());
  btnCopyError.addEventListener('click', () => {
    const err = session.getLastError();
    if (err && navigator.clipboard?.writeText) navigator.clipboard.writeText(err.details || err.summary).catch(() => {});
  });

  window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(updateWindowScale));
  window.addEventListener('resize', () => requestAnimationFrame(updateWindowScale));
  const emergencyFlush = () => {
    const s = session?.getState();
    if (s && s.phase === 'playing') saveStore.saveTierActive(s.aiTier || 1, s);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') emergencyFlush(); });
  window.addEventListener('pagehide', emergencyFlush);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => requestAnimationFrame(updateWindowScale)).observe(xtermStage);
  requestAnimationFrame(updateWindowScale);
  syncUi(session.getState());
  storyUi = wireStoryLibraryModal({
    storyLib,
    session,
    btnStories,
    onError: (errInfo) => session.reportError(errInfo),
  });

  // Canvas hitboxes on Mode Select screen (480x270 scaled cleanly)
  svgaCanvas.addEventListener('pointerdown', (e) => {
    if (!svgaHitboxes.length) return;
    const r = svgaCanvas.getBoundingClientRect();
    const cx = ((e.clientX - r.left) / r.width) * 480;
    const cy = ((e.clientY - r.top) / r.height) * 270;
    for (const box of svgaHitboxes) {
      if (cx >= box.x0 && cx <= box.x1 && cy >= box.y0 && cy <= box.y1) {
        if (box.action.startsWith('toggle_gen_mode')) session.toggleStoryGenMode(box.action.split(':')[1] || null);
        else if (box.action.startsWith('tier:')) session.selectTier(box.action.slice(5));
        else if (box.action === 'delete_save') openDeleteSavePrompt();
        else if (box.action === 'prev_model') session.cycleModel(-1);
        else if (box.action === 'next_model') session.cycleModel(1);
        else if (box.action === 'start_shift') session.startShift();
        break;
      }
    }
  });

  btnGenMode?.addEventListener('click', () => session.toggleStoryGenMode());
  btnDeleteSave?.addEventListener('click', openDeleteSavePrompt);
  aiModelSelect.addEventListener('change', () => session.setModel(aiModelSelect.value));
  aiThemeInput?.addEventListener('input', () => session.setStoryTheme(aiThemeInput.value));
  btnStartShift.addEventListener('click', () => session.startShift());
  autoPlayer = createAutoPlayer({
    getState: () => session?.getState(),
    runCmd: (cmd) => session?.runCmd(cmd),
    continueStory: () => session?.continueStory(),
    waitForAi: () => session?.waitForAi?.(),
    chooseWithLlm: (s, opts) => chooseAutoPlayOption({ anna, state: s, options: opts, onProgress: banners.renderProgress }),
    tts,
    onStatusChange: () => renderAutoButtons(),
  });
  btnTts?.addEventListener('click', () => {
    const on = tts.toggle();
    if (on) tts.speakCurrentRecap(session.getState());
    renderAutoButtons();
  });
  btnAutoPlay?.addEventListener('click', () => {
    const cur = autoPlayer.getMode();
    if (cur === 'off' && !tts.isEnabled()) {
      tts.setEnabled(true);
      tts.speakCurrentRecap(session.getState());
    }
    autoPlayer.cycleMode();
    renderAutoButtons();
  });
  btnAutoPause?.addEventListener('click', () => {
    autoPlayer.togglePause();
    renderAutoButtons();
  });
  btnAskClaire.addEventListener('click', () => { autoPlayer.stop(); session.askClaire(); });
  btnTiers.addEventListener('click', () => { autoPlayer.stop(); tts.stop(); session.returnToModeSelect(); });
  btnScaleMode.addEventListener('click', () => { scaleMode = scaleMode === 'fit' ? 'pan' : 'fit'; updateWindowScale(); });

  btnReset.addEventListener('click', () => {
    if (session.hasGeneratedStory() && typeof modalReset.showModal === 'function') modalReset.showModal();
    else session.handleToolbarAction('reset');
  });
  document.getElementById('btn-reset-keep').addEventListener('click', () => { modalReset.close(); session.replaySameStory(); });
  document.getElementById('btn-reset-new').addEventListener('click', () => { modalReset.close(); session.regenerateNewStory(); });
  document.getElementById('btn-reset-cancel').addEventListener('click', () => modalReset.close());

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'restore' || btn.dataset.action === 'undo') autoPlayer.stop();
      session.handleToolbarAction(btn.dataset.action);
      syncUi(session.getState());
    });
  });
  touchCmdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = touchCmdInput.value.trim();
    if (!cmd) return;
    autoPlayer.stop();
    touchCmdInput.value = '';
    session.runCmd(cmd);
  });
  xtermContainer.addEventListener('pointerdown', (e) => {
    const el = xtermContainer.querySelector('.xterm-screen') || xtermContainer;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const col = Math.floor(Math.max(0, Math.min(0.999, (e.clientX - rect.left) / rect.width)) * term.cols) + 1;
      const row = Math.floor(Math.max(0, Math.min(0.999, (e.clientY - rect.top) / rect.height)) * term.rows) + 1;
      if (session.handleScreenClick(col, row)) { e.preventDefault(); e.stopPropagation(); }
    }
  });
}

main().catch((err) => console.error('Failed to initialize Precinct 84 SVGA app:', err));
