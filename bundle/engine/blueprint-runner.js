import { addLog, award, cloneState, makeSnapshot, triggerFail, MAX_UNDO_DEPTH } from '../game/state.js';
import { createInitialStoryState, recordStoryConsequence } from './story-bible.js';

function applyAlignment(state, delta = {}) {
  const cur = state.alignment || { byTheBook: 0, corruption: 0, rogue: 0 };
  state.alignment = {
    byTheBook: cur.byTheBook + Number(delta.byTheBook || 0),
    corruption: cur.corruption + Number(delta.corruption || 0),
    rogue: cur.rogue + Number(delta.rogue || 0),
  };
}

export function getActiveBlueprintBeat(state) {
  const camp = state.aiCampaign;
  if (!camp?.active || !Array.isArray(camp.chapters)) return null;
  const ch = camp.chapters[camp.chapterIdx || 0];
  if (!ch || !ch.beats) return null;
  return ch.beats[camp.currentBeatId || ch.openingBeatId] || null;
}

export function enterBlueprintBeat(next, beat, out) {
  if (!beat) return;
  next.scene = beat.sceneId;
  next.objectives = beat.objectives.slice();
  if (!next.aiCampaign.storyState) next.aiCampaign.storyState = createInitialStoryState();
  next.aiCampaign.currentBeatId = beat.id;
  next.lastActionTimeline = null;
  const chNum = next.aiCampaign.chapters?.[next.aiCampaign.chapterIdx]?.chapterNumber || 1;
  addLog(next, out, 'SCENE', `--- CH.${chNum}: ${beat.sceneId.replace(/_/g, ' ').toUpperCase()} ---`);
  for (const line of beat.narrative) addLog(next, out, 'NARRATIVE', line);
}

export function resolveIntermissionChoice(prevState, rawInput) {
  const inter = prevState.intermission;
  if (!inter) return null;
  const next = cloneState(prevState);
  const out = [];
  const low = String(rawInput || '').trim().toLowerCase();

  if (Array.isArray(inter.choices) && low !== 'continue' && low !== 'continue shift') {
    const match = inter.choices.find(
      (c) => low === c.command || low.includes(c.command) || c.label.toLowerCase() === low
    );
    if (match) {
      applyAlignment(next, match.alignmentDelta);
      addLog(next, out, 'DIALOG', match.reply);
      next.intermission = null;
      return { state: next, sfx: 'point' };
    }
  }
  next.intermission = null;
  addLog(next, out, 'ACTION', 'Back on the frequency—rolling directly onto the next scene.');
  return { state: next, sfx: 'tick' };
}

export function executeBlueprintTurn(prevState, rawInput) {
  const beat = getActiveBlueprintBeat(prevState);
  if (!beat) return null;

  const snap = makeSnapshot(prevState);
  const next = cloneState(prevState);
  next.undoStack = [...(prevState.undoStack || []).slice(-(MAX_UNDO_DEPTH - 1)), snap];
  next.turn += 1;
  const out = [];
  next.log.push({ tag: 'CMD', text: `> ${rawInput}` });

  const low = String(rawInput || '').trim().toLowerCase();
  const action = beat.actions.find(
    (a) =>
      low === a.command ||
      low === a.label.toLowerCase() ||
      a.aliases?.some((al) => low.includes(al)) ||
      low.includes(a.command)
  );

  if (!action) {
    addLog(next, out, 'SYSTEM', `Try one of the scene choices (${beat.actions.map((a) => a.command).join(' | ')}) or type "ask claire".`);
    return { state: next, sfx: 'tick' };
  }

  if (action.failCitation) {
    triggerFail(next, out, 'PROCEDURAL VIOLATION', action.failCitation, action.failReason || 'Tactical breach of department rules.');
    return { state: next, sfx: 'gameover' };
  }

  if (!next.aiCampaign.storyState) next.aiCampaign.storyState = createInitialStoryState();
  if (Array.isArray(action.timeline) && action.timeline.length) {
    next.lastActionTimeline = action.timeline;
    next.lastActionTimelineId = `act_${next.turn}`;
  } else {
    next.lastActionTimeline = null;
  }
  if (action.consequence) {
    recordStoryConsequence(next.aiCampaign.storyState, action.consequence);
    if (action.consequence.targetId === 'marcus' && action.consequence.status === 'dead') {
      addLog(next, out, 'ACTION', action.log);
      triggerFail(next, out, 'FATAL INCIDENT', '10-99 OFFICER KILLED IN ACTION', action.failReason || action.log || 'Fatal gunshot wound in the line of duty.');
      return { state: next, sfx: 'shot' };
    }
    if (['hospitalized', 'wounded_leg', 'wounded_arm'].includes(action.consequence.status)) {
      addLog(next, out, 'SYSTEM', `[MEDICAL / TRAUMA] Physical injury (${action.consequence.status.replace(/_/g, ' ')}) recorded in case file.`);
    }
  }

  applyAlignment(next, action.alignmentDelta);
  if (action.scoreDelta > 0) award(next, `bp_${next.aiCampaign.chapterIdx}_${beat.id}_${action.command}`, action.scoreDelta);
  addLog(next, out, 'ACTION', action.log);

  if (action.endChapter) {
    if (action.isVictory) {
      next.victory = true;
      next.scene = 'epilogue_ceremony';
      next.objectives = ['Case complete! Generate another chapter ("continue story") or inspect score.'];
      addLog(next, out, 'SCENE', '=== CASE ARCHIVED — READY FOR NEXT AI CHAPTER ===');
      return { state: next, sfx: 'victory', chapterCompleted: true };
    }
    const nextIdx = (next.aiCampaign.chapterIdx || 0) + 1;
    const precompiled = next.aiCampaign.chapters?.[nextIdx];
    if (precompiled) {
      next.aiCampaign.chapterIdx = nextIdx;
      next.aiCampaign.awaitingNextChapter = false;
      const openBeat = precompiled.beats?.[precompiled.openingBeatId];
      addLog(next, out, 'SCENE', `=== ${precompiled.title} ===`);
      if (openBeat) enterBlueprintBeat(next, openBeat, out);
      return { state: next, sfx: openBeat?.sfxId || 'squelch', bgmId: openBeat?.bgmId, chapterCompleted: true };
    }
    next.aiCampaign.awaitingNextChapter = true;
    next.objectives = ['Continue into next AI episode ("continue story")'];
    addLog(next, out, 'SCENE', '=== CHAPTER COMPLETE — TYPE "continue story" TO GENERATE NEXT CHAPTER ===');
    return { state: next, sfx: 'point', chapterCompleted: true };
  }

  const ch = next.aiCampaign.chapters[next.aiCampaign.chapterIdx || 0];
  const nextBeat = ch.beats[action.nextBeatId];
  if (nextBeat) {
    enterBlueprintBeat(next, nextBeat, out);
    return { state: next, sfx: nextBeat.sfxId || action.sfx || 'tick', bgmId: nextBeat.bgmId };
  }
  return { state: next, sfx: action.sfx || 'tick' };
}
