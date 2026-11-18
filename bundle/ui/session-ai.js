import { createInitialState, addLog, cloneState } from '../game/state.js';
import { SCENE_CATALOG } from '../assets/scene-catalog.js';
import { MAIN_MENU_BGM_ID } from '../assets/audio-catalog.js';
import { buildPlayableStateFromEntry } from '../storage-library.js';
import { INTERMISSION_TRANSITIONS } from '../engine/case-context.js';
import { formatDetailedError } from '../engine/anna-ai.js';
import {
  runClaireHint,
  compileTier2Intermissions,
  compileSingleTier2Intermission,
  runNpcQuestion,
  generateIaDebrief,
  compileNewAiCampaign,
  compileNextBlueprintChapter,
} from '../engine/story-director.js';
import {
  getActiveBlueprintBeat,
  enterBlueprintBeat,
  resolveIntermissionChoice,
  executeBlueprintTurn,
} from '../engine/blueprint-runner.js';

export function buildShiftResetState(prev, startInModeSelect) {
  return createInitialState({
    phase: startInModeSelect ? 'mode_select' : 'playing',
    aiTier: prev?.aiTier || 1,
    aiModel: prev?.aiModel || 'preset:default',
    storyGenMode: prev?.storyGenMode || 'episodic',
    storyTheme: prev?.storyTheme || '',
    llmAvailable: Boolean(prev?.llmAvailable),
  });
}

export function hasGeneratedStory(state) {
  return Boolean(state?.tier2Script || state?.aiCampaign?.active);
}

export function replayExistingStory(prev) {
  const fresh = createInitialState({
    phase: 'playing',
    aiTier: prev.aiTier || 1,
    aiModel: prev.aiModel || 'preset:default',
    storyGenMode: prev.storyGenMode || 'episodic',
    storyTheme: prev.storyTheme || '',
    llmAvailable: Boolean(prev.llmAvailable),
  });
  if (prev.storyId) fresh.storyId = prev.storyId;
  if (prev.tier2Script) {
    fresh.tier2Script = JSON.parse(JSON.stringify(prev.tier2Script));
  }
  if (prev.aiCampaign?.active && prev.aiCampaign.chapters?.length) {
    const camp = JSON.parse(JSON.stringify(prev.aiCampaign));
    camp.chapterIdx = 0;
    const ch1 = camp.chapters[0];
    camp.currentBeatId = ch1.openingBeatId;
    camp.awaitingNextChapter = false;
    fresh.aiCampaign = camp;
    fresh.log = [];
    const out = [];
    addLog(fresh, out, 'SCENE', `=== REPLAYING: ${camp.outline?.caseTitle || 'COMPILED CASE'} ===`);
    enterBlueprintBeat(fresh, ch1.beats[ch1.openingBeatId], out);
  } else {
    fresh.log.push({ tag: 'SYSTEM', text: 'Replaying from Chapter 1 keeping the generated Tier 2 dramatization script.' });
  }
  return fresh;
}

export function syncSceneMusic(state, audio) {
  if (!state || !audio?.playBgm) return;
  if (state.phase === 'mode_select') {
    audio.playBgm(MAIN_MENU_BGM_ID);
    return;
  }
  const beat = getActiveBlueprintBeat(state);
  const bgm = state.intermission?.bgmId || beat?.bgmId || SCENE_CATALOG[state.scene]?.bgm;
  if (bgm) audio.playBgm(bgm);
}

export function createAiTaskRunner({ anna, audio, saveStore, storyLib, getState, setState, setAiBusy, setAiProgress, setLastError, render, notifyChange }) {
  let activePromise = null;

  async function persistVerified(s) {
    if (!s || s.phase !== 'playing') return null;
    if (storyLib && (s.tier2Script || s.aiCampaign?.active)) {
      await storyLib.saveFromState(s).catch((err) => console.warn('Story archive warning:', err));
    }
    if (!saveStore) return null;
    const res = await saveStore.saveTierActiveVerified(s.aiTier || 1, s);
    if (anna?.storage && res && !res.cloudOk) {
      addLog(s, [], 'SYSTEM', 'Save notice: APS KV cloud sync failed after retries; your generated story is safely backed up in browser localStorage.');
    }
    return res;
  }

  function runTask(stageLabel, fn) {
    const startedAt = Date.now();
    let curProgress = { active: true, stage: stageLabel, selectedModel: getState()?.aiModel || 'preset:default', chars: 0, chunks: 0, elapsedMs: 0, phase: 'connecting' };
    const emitProg = (nextProg) => {
      curProgress = nextProg;
      if (typeof setAiProgress === 'function') setAiProgress(nextProg);
    };
    if (typeof setLastError === 'function') setLastError(null);
    setAiBusy(true);
    emitProg(curProgress);
    render();

    const progTimer = typeof setInterval === 'function'
      ? setInterval(() => {
          emitProg({ ...curProgress, elapsedMs: Date.now() - startedAt });
          notifyChange();
        }, 160)
      : null;

    const finishProgress = () => {
      if (progTimer) clearInterval(progTimer);
      if (typeof setAiProgress === 'function') setAiProgress(null);
    };

    const p = Promise.resolve()
      .then(() => fn((pUpdate) => { emitProg(pUpdate); notifyChange(); }))
      .then(async (out) => {
        finishProgress();
        if (out?.error && typeof setLastError === 'function') {
          setLastError(out.error);
        }
        if (out?.state) {
          await persistVerified(out.state);
          setState(out.state);
          syncSceneMusic(out.state, audio);
        }
        setAiBusy(false);
        if (out?.sfx) audio.play(out.sfx);
        render();
        notifyChange();
        return out;
      })
      .catch((err) => {
        finishProgress();
        setAiBusy(false);
        const detailed = formatDetailedError(err, { stage: stageLabel, selectedModel: getState()?.aiModel, elapsedMs: Date.now() - startedAt });
        if (typeof setLastError === 'function') setLastError(detailed);
        const s = getState();
        if (s) {
          addLog(s, [], 'ALERT', `[ERROR] ${detailed.headline}: ${detailed.summary}`);
        }
        render();
        notifyChange();
      });
    activePromise = p;
    return p;
  }

  function persistActiveTier(s) {
    if (s && s.phase === 'playing') {
      if (storyLib && (s.tier2Script || s.aiCampaign?.active)) {
        storyLib.saveFromState(s).catch(() => {});
      }
      if (saveStore) saveStore.saveTierActive(s.aiTier || 1, s);
    }
  }

  function activateSavedTier(saved, tier, modelOverride) {
    const resumed = { ...saved, phase: 'playing', aiModel: modelOverride || saved.aiModel };
    resumed.log = [...resumed.log, { tag: 'SYSTEM', text: `Resumed saved Tier ${tier} shift.` }];
    setState(resumed);
    syncSceneMusic(resumed, audio);
    audio.play('squelch');
    render();
    notifyChange();
    return resumed;
  }

  return {
    waitForIdle: () => activePromise || Promise.resolve(),
    persistActiveTier,
    persistActiveTierVerified: (s) => persistVerified(s),
    loadSavedStoryEntry(entry, resumeProgress = true) {
      const next = buildPlayableStateFromEntry(entry, { resumeProgress, llmAvailable: Boolean(getState()?.llmAvailable) });
      setState(next);
      persistActiveTier(next);
      syncSceneMusic(next, audio);
      audio.play('squelch');
      render();
      notifyChange();
      return next;
    },
    resumeTierSaved(state) {
      const tier = state.aiTier || 1;
      const saved = saveStore ? saveStore.getTierActive(tier) : null;
      if (saved) return Promise.resolve({ resumed: true, state: activateSavedTier(saved, tier, state.aiModel) });
      const next = {
        ...state,
        log: [...state.log, { tag: 'SYSTEM', text: `No save file found for Tier ${tier} yet. Click Start Shift to begin.` }],
      };
      setState(next);
      render();
      notifyChange();
      return Promise.resolve({ resumed: false, state: next });
    },
    async deleteTierSave(state, tier = state.aiTier || 1, deleteStory = false) {
      const t = Math.max(1, Math.min(3, Number(tier) || 1));
      if (saveStore) await saveStore.clearTierActive(t, Boolean(deleteStory));
      const logMsg = deleteStory
        ? `Deleted Tier ${t} progress save and generated story.`
        : `Deleted Tier ${t} progress save (generated story kept).`;
      const next = {
        ...state,
        ...(state.aiTier === t && deleteStory ? { tier2Script: null, aiCampaign: null } : {}),
        log: [...(state.log || []), { tag: 'SYSTEM', text: logMsg }],
      };
      setState(next);
      render();
      notifyChange();
      return { cleared: true, tier: t, deleteStory: Boolean(deleteStory), state: next };
    },
    startShiftFromModeSelect(state, { resumeSaved = true } = {}) {
      const tier = state.aiTier || 1;
      const saved = resumeSaved && saveStore ? saveStore.getTierActive(tier) : null;
      if (saved) return Promise.resolve({ state: activateSavedTier(saved, tier, state.aiModel) });
      const vaulted = resumeSaved && saveStore ? saveStore.getVaultStory(tier) : null;
      if (vaulted && (vaulted.tier2Script || vaulted.aiCampaign?.active)) {
        const recovered = replayExistingStory({
          ...state,
          tier2Script: vaulted.tier2Script || null,
          aiCampaign: vaulted.aiCampaign || null,
          aiModel: state.aiModel || vaulted.aiModel,
        });
        recovered.log.push({ tag: 'SYSTEM', text: `Recovered compiled Tier ${tier} story from Backup Vault (0 credits spent).` });
        setState(recovered);
        persistActiveTier(recovered);
        syncSceneMusic(recovered, audio);
        audio.play('squelch');
        render();
        notifyChange();
        return Promise.resolve({ state: recovered });
      }
      const freshState = buildShiftResetState(state, false);
      if (tier === 3) {
        return runTask('Compile AI Case & Ch.1', (onProgress) => compileNewAiCampaign({ anna, state: freshState, continuation: false, onProgress }));
      }
      if (tier === 2) {
        return runTask('Compile Tier 2 Script', (onProgress) => compileTier2Intermissions({ anna, state: freshState, onProgress }));
      }
      const next = { ...freshState, phase: 'playing', intermission: null };
      next.log = [...next.log, { tag: 'SYSTEM', text: `Started Tier 1 (${next.aiModel}). Use "ask claire" anytime for scoped hints.` }];
      setState(next);
      persistActiveTier(next);
      syncSceneMusic(next, audio);
      audio.play('squelch');
      render();
      notifyChange();
      return Promise.resolve({ state: next });
    },
    regenerateTierStory(state) {
      const tier = state.aiTier || 1;
      const clean = buildShiftResetState(state, false);
      if (tier === 3 || state.aiCampaign?.active) {
        return runTask('Compile New AI Case', (onProgress) => compileNewAiCampaign({ anna, state: clean, continuation: Boolean(state.aiCampaign?.active && tier < 3), onProgress }));
      }
      if (tier === 2) {
        return runTask('Compile New Tier 2 Script', (onProgress) => compileTier2Intermissions({ anna, state: clean, onProgress }));
      }
      setState(clean);
      persistActiveTier(clean);
      render();
      notifyChange();
      return Promise.resolve({ state: clean });
    },
    askClaire: (q = '') => runTask('Ask Claire (#089)', (onProgress) => runClaireHint({ anna, state: getState(), question: q, onProgress })),
    askNpc: (rawInput) => runTask('Suspect Interrogation', (onProgress) => runNpcQuestion({ anna, state: getState(), rawInput, onProgress })),
    continueNextChapter: () => runTask('Compile Next Chapter', (onProgress) => compileNextBlueprintChapter({ anna, state: getState(), onProgress })),
    resolveIntermission: (rawInput) => resolveIntermissionChoice(getState(), rawInput),
    runCompiledTurn: (rawInput) => executeBlueprintTurn(getState(), rawInput),
    handlePostDeterministic({ prevScene, res }) {
      const s = res.state;
      persistActiveTier(s);
      syncSceneMusic(s, audio);
      if (!res.sceneChanged || s.aiTier < 2) return null;

      if (res.victory && s.scene === 'epilogue_ceremony') {
        return runTask('IA Final Review', async (onProgress) => {
          const out = await generateIaDebrief({ anna, state: s, onProgress });
          return out ? out : { state: s };
        });
      }
      const key = `${prevScene}->${s.scene}`;
      if (INTERMISSION_TRANSITIONS[key]) {
        const script = s.tier2Script?.[key];
        if (!script && s.tier2Script?._mode === 'episodic') {
          return runTask('Compile Act Dramatization', (onProgress) =>
            compileSingleTier2Intermission({ anna, state: s, transitionKey: key, onProgress })
          );
        }
        const inter = script || {
          title: INTERMISSION_TRANSITIONS[key].title,
          sceneId: 'precinct_yard',
          bgmId: 'bgm_rain_patrol',
          speakerId: 'claire',
          speakerMood: 'calm',
          lines: ['Rain pounds Unit 84 while Claire scans the dispatch frequency.'],
          choices: [],
        };
        const next = cloneState(s);
        next.intermission = inter;
        const out = [];
        addLog(next, out, 'RADIO', `--- ${inter.title} ---`);
        for (const l of inter.lines) addLog(next, out, 'DIALOG', l);
        setState(next);
        persistActiveTier(next);
        syncSceneMusic(next, audio);
        audio.play(inter.sfxId || 'squelch');
        render();
        notifyChange();
      }
      return null;
    },
  };
}
