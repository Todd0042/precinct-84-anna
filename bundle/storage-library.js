import { writeLocalSync, readLocalSync, readApsKv, writeApsKvVerified, pickNewerSnapshot } from './storage-kv.js';
import { validateTier2Bundle, validateCaseOutline, validateChapterBlueprint } from './engine/blueprint-schema.js';
import { createInitialState, addLog } from './game/state.js';
import { enterBlueprintBeat } from './engine/blueprint-runner.js';

const LIBRARY_STORAGE_KEY = 'precinct-84-anna:story-library:v1';

export function slugifyTitle(str) {
  return String(str || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'story';
}

export function makeStoryId(state) {
  if (state?.storyId) return state.storyId;
  const prefix = state?.aiCampaign?.active ? `t${state.aiTier || 3}` : 't2';
  const slug = slugifyTitle(state?.aiCampaign?.outline?.caseTitle || state?.tier2Script?.['precinct_yard->crosswalk_redlight']?.title || 'story');
  return `${prefix}_${slug}_${Date.now().toString(36)}`;
}

export function buildStoryEntryFromState(state, existingId = null) {
  if (!state?.tier2Script && !state?.aiCampaign?.active) return null;
  const id = existingId || makeStoryId(state);
  const tier = Number(state.aiTier || (state.aiCampaign?.active ? 3 : 2));
  const title = state.aiCampaign?.outline?.caseTitle
    || (tier === 2 ? `Tier 2 Script (${state.tier2Script?.['precinct_yard->crosswalk_redlight']?.title || 'Dramatized Case I'})` : 'Compiled Precinct 84 Story');
  const { aiCampaign: _dupCamp, tier2Script: _dupT2, ...lightSnap } = state;
  return {
    id,
    tier,
    title,
    aiModel: state.aiModel || 'preset:default',
    chaptersCount: state.aiCampaign?.chapters?.length || 0,
    score: state.score || 0,
    scene: state.scene || 'precinct_briefing',
    updatedAt: Date.now(),
    tier2Script: state.tier2Script ? JSON.parse(JSON.stringify(state.tier2Script)) : null,
    aiCampaign: state.aiCampaign ? JSON.parse(JSON.stringify(state.aiCampaign)) : null,
    snapshot: JSON.parse(JSON.stringify({ ...lightSnap, storyId: id, undoStack: [] })),
  };
}

export function buildPlayableStateFromEntry(entry, { resumeProgress = true, llmAvailable = false } = {}) {
  const storyTheme = entry?.aiCampaign?.outline?.storyTheme || entry?.tier2Script?._theme || entry?.snapshot?.storyTheme || '';
  if (resumeProgress && entry?.snapshot && typeof entry.snapshot.scene === 'string') {
    return JSON.parse(JSON.stringify({
      ...entry.snapshot,
      storyTheme,
      tier2Script: entry.tier2Script || entry.snapshot.tier2Script || null,
      aiCampaign: entry.aiCampaign || entry.snapshot.aiCampaign || null,
      storyId: entry.id,
      phase: 'playing',
      llmAvailable,
      undoStack: [],
    }));
  }
  const fresh = createInitialState({
    phase: 'playing',
    aiTier: entry.tier || 3,
    aiModel: entry.aiModel || 'preset:default',
    storyTheme,
    llmAvailable,
  });
  fresh.storyId = entry.id;
  if (entry.tier2Script) fresh.tier2Script = JSON.parse(JSON.stringify(entry.tier2Script));
  if (entry.aiCampaign?.active && entry.aiCampaign.chapters?.length) {
    const camp = JSON.parse(JSON.stringify(entry.aiCampaign));
    camp.chapterIdx = 0;
    camp.currentBeatId = camp.chapters[0].openingBeatId;
    camp.awaitingNextChapter = false;
    fresh.aiCampaign = camp;
    fresh.log = [];
    const out = [];
    addLog(fresh, out, 'SCENE', `=== LOADED SAVED STORY: ${entry.title} ===`);
    enterBlueprintBeat(fresh, camp.chapters[0].beats[camp.openingBeatId], out);
  } else {
    fresh.log.push({ tag: 'SYSTEM', text: `Loaded saved Tier ${fresh.aiTier} dramatization story.` });
  }
  return fresh;
}

export class StoryLibraryStore {
  constructor(annaRuntime = null) {
    this.anna = annaRuntime;
    this.stories = [];
    this.seq = 0;
  }

  setRuntime(annaRuntime) {
    this.anna = annaRuntime;
  }

  async load() {
    const cloud = this.anna?.storage ? await readApsKv(this.anna, LIBRARY_STORAGE_KEY).catch(() => null) : null;
    const local = readLocalSync(LIBRARY_STORAGE_KEY);
    const { picked, needsCloudHeal } = pickNewerSnapshot(cloud, local);
    if (picked && Array.isArray(picked.stories)) {
      this.stories = picked.stories;
      if (needsCloudHeal && this.anna?.storage) {
        await writeApsKvVerified(this.anna, LIBRARY_STORAGE_KEY, picked, (rb, exp) => rb?._saveSeq === exp._saveSeq);
      }
    }
    return this.list();
  }

  list() {
    return this.stories.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  getById(id) {
    return this.stories.find((s) => s.id === id) || null;
  }

  async persist() {
    this.seq += 1;
    const payload = { format: 'precinct-84-library', schemaVersion: 1, _savedAt: Date.now(), _saveSeq: this.seq, stories: this.stories };
    writeLocalSync(LIBRARY_STORAGE_KEY, payload);
    if (this.anna?.storage) {
      return writeApsKvVerified(this.anna, LIBRARY_STORAGE_KEY, payload, (rb, exp) => rb?._saveSeq === exp._saveSeq);
    }
    return { cloudOk: false, verified: true };
  }

  async saveFromState(state) {
    const entry = buildStoryEntryFromState(state, state?.storyId || null);
    if (!entry) return null;
    state.storyId = entry.id;
    const idx = this.stories.findIndex((s) => s.id === entry.id);
    if (idx >= 0) this.stories[idx] = entry;
    else this.stories.unshift(entry);
    await this.persist();
    return entry;
  }

  async deleteById(id) {
    this.stories = this.stories.filter((s) => s.id !== id);
    await this.persist();
  }

  exportSingleJson(entryOrState) {
    const entry = entryOrState?.tier2Script || entryOrState?.aiCampaign
      ? (entryOrState.snapshot ? entryOrState : buildStoryEntryFromState(entryOrState))
      : null;
    if (!entry) throw new Error('No AI-generated story is active to export yet.');
    const payload = {
      format: 'precinct-84-story',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      id: entry.id,
      tier: entry.tier,
      title: entry.title,
      aiModel: entry.aiModel,
      tier2Script: entry.tier2Script || null,
      aiCampaign: entry.aiCampaign || null,
      snapshot: entry.snapshot || null,
    };
    return {
      filename: `precinct84-${slugifyTitle(entry.title)}.json`,
      jsonText: JSON.stringify(payload, null, 2),
      payload,
    };
  }

  exportAllJson() {
    const payload = {
      format: 'precinct-84-library',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      stories: this.list(),
    };
    return {
      filename: `precinct84-all-stories-${new Date().toISOString().slice(0, 10)}.json`,
      jsonText: JSON.stringify(payload, null, 2),
      payload,
    };
  }

  async importFromJsonText(rawText) {
    let parsed;
    try {
      parsed = JSON.parse(String(rawText || '').trim());
    } catch (err) {
      throw new Error(`Invalid JSON syntax: ${err.message}`);
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Imported JSON must be an object.');
    }

    const candidates = parsed.format === 'precinct-84-library' && Array.isArray(parsed.stories)
      ? parsed.stories
      : [parsed];

    if (candidates.length === 0) throw new Error('Library JSON contains no stories.');
    const importedEntries = [];

    for (const rawItem of candidates) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const tier2Script = rawItem.tier2Script ? validateTier2Bundle(rawItem.tier2Script) : null;
      let aiCampaign = null;
      if (rawItem.aiCampaign && (rawItem.aiCampaign.outline || rawItem.aiCampaign.chapters)) {
        const outline = validateCaseOutline(rawItem.aiCampaign.outline || {});
        const rawChapters = Array.isArray(rawItem.aiCampaign.chapters) ? rawItem.aiCampaign.chapters : [];
        const chapters = rawChapters.map((ch, idx) => validateChapterBlueprint(ch, ch?.chapterNumber || idx + 1, false, outline.assetPool));
        if (!chapters.length) chapters.push(validateChapterBlueprint({}, 1, false));
        aiCampaign = {
          active: true,
          outline,
          chapters,
          chapterIdx: Math.min(Number(rawItem.aiCampaign.chapterIdx || 0), chapters.length - 1),
          currentBeatId: rawItem.aiCampaign.currentBeatId || chapters[0].openingBeatId,
          awaitingNextChapter: Boolean(rawItem.aiCampaign.awaitingNextChapter),
        };
      }
      if (!tier2Script && !aiCampaign) {
        throw new Error('JSON must include a valid "tier2Script" or "aiCampaign" story.');
      }

      const tier = Number(rawItem.tier || (aiCampaign ? 3 : 2));
      const id = rawItem.id ? `${rawItem.id}` : `${tier === 2 ? 't2' : 't3'}_imp_${Date.now().toString(36)}`;
      const title = String(rawItem.title || aiCampaign?.outline?.caseTitle || 'Imported Precinct 84 Story');
      const entry = {
        id,
        tier,
        title,
        aiModel: rawItem.aiModel || 'imported',
        chaptersCount: aiCampaign?.chapters?.length || 0,
        score: Number(rawItem.snapshot?.score || rawItem.score || 0),
        scene: String(rawItem.snapshot?.scene || aiCampaign?.chapters?.[0]?.beats?.[aiCampaign.chapters[0].openingBeatId]?.sceneId || 'precinct_briefing'),
        updatedAt: Date.now(),
        tier2Script,
        aiCampaign,
        snapshot: rawItem.snapshot?.scene ? rawItem.snapshot : null,
      };
      const existingIdx = this.stories.findIndex((s) => s.id === entry.id);
      if (existingIdx >= 0) this.stories[existingIdx] = entry;
      else this.stories.unshift(entry);
      importedEntries.push(entry);
    }

    if (!importedEntries.length) throw new Error('No valid stories found to import.');
    await this.persist();
    return importedEntries;
  }
}
