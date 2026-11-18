import { formatDetailedError } from '../engine/anna-ai.js';

function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function wireStoryLibraryModal({ storyLib, session, btnStories, onError }) {
  const modal = document.getElementById('modal-stories');
  const listEl = document.getElementById('story-library-list');
  const btnExportActive = document.getElementById('btn-export-active-story');
  const btnExportAll = document.getElementById('btn-export-all-stories');
  const fileInput = document.getElementById('import-story-file');
  const pasteBox = document.getElementById('import-story-paste');
  const btnImportPaste = document.getElementById('btn-import-story-paste');
  const btnClose = document.getElementById('btn-close-stories');

  function updateButtonCount() {
    if (!btnStories) return;
    const count = storyLib.list().length;
    btnStories.textContent = count > 0 ? `Stories (${count})` : 'Stories';
  }

  function renderList() {
    const items = storyLib.list();
    btnExportActive.disabled = !session?.hasGeneratedStory?.();
    btnExportAll.disabled = items.length === 0;
    listEl.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'story-empty';
      empty.textContent = 'No AI-generated stories saved yet. Start Tier 2 or Tier 3, or import a .json story below.';
      listEl.appendChild(empty);
      return;
    }

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'story-row';
      const meta = document.createElement('div');
      meta.className = 'story-meta';
      const title = document.createElement('div');
      title.className = 'story-title';
      title.textContent = `[Tier ${item.tier}] ${item.title}`;
      const sub = document.createElement('div');
      sub.className = 'story-sub';
      sub.textContent = `${item.chaptersCount ? `${item.chaptersCount} Ch • ` : ''}Score ${item.score} • ${item.aiModel}`;
      meta.append(title, sub);

      const btns = document.createElement('div');
      btns.className = 'story-row-actions';
      const bPlay = document.createElement('button');
      bPlay.type = 'button';
      bPlay.className = 'hdr-btn hdr-accent';
      bPlay.textContent = 'Play';
      bPlay.addEventListener('click', () => {
        session.loadSavedStoryEntry(item, true);
        modal.close();
      });
      btns.appendChild(bPlay);

      if (item.aiCampaign?.active) {
        const bExt = document.createElement('button');
        bExt.type = 'button';
        bExt.className = 'hdr-btn hdr-resume';
        bExt.textContent = '+1 Ch';
        bExt.title = 'Load story JSON and generate 1 more chapter using Story Bible continuity';
        bExt.addEventListener('click', () => {
          session.loadSavedStoryEntry(item, true);
          modal.close();
          session.continueStory();
        });
        btns.appendChild(bExt);
      }

      const bExp = document.createElement('button');
      bExp.type = 'button';
      bExp.className = 'hdr-btn';
      bExp.textContent = 'Export JSON';
      bExp.addEventListener('click', () => {
        const exp = storyLib.exportSingleJson(item);
        triggerDownload(exp.filename, exp.jsonText);
      });

      const bDel = document.createElement('button');
      bDel.type = 'button';
      bDel.className = 'hdr-btn hdr-danger';
      bDel.textContent = 'Del';
      bDel.addEventListener('click', async () => {
        await storyLib.deleteById(item.id);
        updateButtonCount();
        renderList();
      });

      btns.append(bExp, bDel);
      row.append(meta, btns);
      listEl.appendChild(row);
    }
  }

  async function runImport(rawText) {
    try {
      const entries = await storyLib.importFromJsonText(rawText);
      pasteBox.value = '';
      updateButtonCount();
      renderList();
      if (entries.length === 1) {
        session.loadSavedStoryEntry(entries[0], Boolean(entries[0].snapshot));
        modal.close();
      }
    } catch (err) {
      if (typeof onError === 'function') {
        onError(formatDetailedError(err, { stage: 'Import Story JSON' }));
      }
    }
  }

  btnStories?.addEventListener('click', () => {
    renderList();
    if (typeof modal.showModal === 'function') modal.showModal();
  });
  btnClose?.addEventListener('click', () => modal.close());

  btnExportActive?.addEventListener('click', () => {
    try {
      const exp = storyLib.exportSingleJson(session.getState());
      triggerDownload(exp.filename, exp.jsonText);
    } catch (err) {
      onError?.(formatDetailedError(err, { stage: 'Export Active Story JSON' }));
    }
  });

  btnExportAll?.addEventListener('click', () => {
    try {
      const exp = storyLib.exportAllJson();
      triggerDownload(exp.filename, exp.jsonText);
    } catch (err) {
      onError?.(formatDetailedError(err, { stage: 'Export All Stories JSON' }));
    }
  });

  fileInput?.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    await runImport(await f.text());
  });

  btnImportPaste?.addEventListener('click', () => {
    if (pasteBox.value.trim()) runImport(pasteBox.value);
  });

  updateButtonCount();
  return { updateButtonCount, renderList };
}
