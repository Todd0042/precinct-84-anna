const AI_PREFS_KEY = 'precinct-84-anna:ai-prefs:v1';

export function loadAiPrefs() {
  try { return JSON.parse(window.localStorage?.getItem(AI_PREFS_KEY) || '{}'); } catch { return {}; }
}

export function saveAiPrefs(aiTier, aiModel, storyGenMode, storyTheme = '') {
  try { window.localStorage?.setItem(AI_PREFS_KEY, JSON.stringify({ aiTier, aiModel, storyGenMode, storyTheme })); } catch {}
}

export function populateModelSelect(selectEl, catalog, selectedId) {
  if (!selectEl) return;
  selectEl.replaceChildren();
  for (const m of catalog) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.label;
    selectEl.appendChild(opt);
  }
  selectEl.value = catalog.some((m) => m.id === selectedId) ? selectedId : catalog[0]?.id || 'preset:default';
}

export function wireDeleteSaveModal({ saveStore, getSession }) {
  const modal = document.getElementById('modal-delete-save');
  const titleEl = document.getElementById('delete-save-title');
  const descEl = document.getElementById('delete-save-desc');
  const btnProgress = document.getElementById('btn-delete-progress');
  const btnAll = document.getElementById('btn-delete-all');
  const btnCancel = document.getElementById('btn-delete-cancel');

  function open() {
    const tier = getSession()?.getState()?.aiTier || 1;
    const meta = saveStore.listTierSummaries()[tier];
    if (!meta) return;
    if (titleEl) titleEl.textContent = `Delete Tier ${tier} Save`;
    if (descEl) {
      descEl.textContent = meta.hasProgress
        ? `Tier ${tier} has a saved game (${meta.score || 0} pts). Delete only your progress (keeping any generated story), or delete the entire generated story too?`
        : `Tier ${tier} has a saved generated story ready to replay. Delete the generated story as well?`;
    }
    if (btnProgress) btnProgress.classList.toggle('hidden', !meta.hasProgress);
    if (btnAll) btnAll.disabled = !(meta.hasCustomStory || meta.hasVault);
    modal?.showModal?.();
  }

  btnProgress?.addEventListener('click', async () => {
    modal?.close?.();
    await getSession()?.deleteTierSave(getSession()?.getState()?.aiTier || 1, false);
  });
  btnAll?.addEventListener('click', async () => {
    modal?.close?.();
    await getSession()?.deleteTierSave(getSession()?.getState()?.aiTier || 1, true);
  });
  btnCancel?.addEventListener('click', () => modal?.close?.());

  return open;
}

export function createBannerRenderer(onErrorShown) {
  const progBar = document.getElementById('llm-progress-bar');
  const progText = document.getElementById('llm-progress-text');
  const panel = document.getElementById('error-panel');
  const titleEl = document.getElementById('error-title');
  const demoTag = document.getElementById('error-demo-tag');
  const summaryEl = document.getElementById('error-summary');
  const detailsPre = document.getElementById('error-details-pre');

  return {
    renderProgress(prog) {
      if (!prog?.active) { progBar?.classList.add('hidden'); return; }
      progBar?.classList.remove('hidden');
      const sec = ((prog.elapsedMs || 0) / 1000).toFixed(1);
      const tail = prog.chars > 0 ? `${prog.chars} chars • ${sec}s` : `waiting ${sec}s`;
      if (progText) progText.textContent = `${prog.stage} [${prog.selectedModel}] — ${tail}`;
    },
    renderError(errInfo) {
      if (!errInfo) { panel?.classList.add('hidden'); return; }
      panel?.classList.remove('hidden');
      if (titleEl) titleEl.textContent = errInfo.headline || 'Error';
      if (summaryEl) summaryEl.textContent = errInfo.summary || 'An error occurred.';
      demoTag?.classList.toggle('hidden', !errInfo.demoVerbose);
      if (errInfo.demoVerbose && errInfo.details && detailsPre) {
        detailsPre.textContent = errInfo.details;
        detailsPre.classList.remove('hidden');
      } else {
        detailsPre?.classList.add('hidden');
      }
      onErrorShown?.();
    },
  };
}
