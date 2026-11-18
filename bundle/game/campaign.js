import { parseCommand } from '../engine/parser.js';
import {
  SCENE_META,
  MAX_UNDO_DEPTH,
  createInitialState,
  cloneState,
  makeSnapshot,
  addLog,
  saveGame,
  loadGame,
} from './state.js';
import { handleBriefing, handleLocker, handleYard } from './scenes-act1.js';
import { handleCrosswalk, handlePursuit, handleFelonyStop, handleInterrogation } from './scenes-act2.js';
import { handleMotelExterior, handleMotelAlley, handleMotelLab } from './scenes-act3.js';
import { handlePierExterior, handlePierInterior, handlePierOffice, handlePierStreetTwist, handleEpilogue } from './scenes-act4.js';
import { getSuggestedChips } from './chips.js';

export { SCENE_META, createInitialState, cloneState, getSuggestedChips, saveGame, loadGame };

const SCENE_HANDLERS = {
  precinct_briefing: handleBriefing,
  precinct_locker: handleLocker,
  precinct_yard: handleYard,
  crosswalk_redlight: handleCrosswalk,
  pursuit_active: handlePursuit,
  felony_stop: handleFelonyStop,
  interrogation_room: handleInterrogation,
  motel_exterior: handleMotelExterior,
  motel_alley: handleMotelAlley,
  motel_lab: handleMotelLab,
  pier84_exterior: handlePierExterior,
  pier84_interior: handlePierInterior,
  pier84_office: handlePierOffice,
  pier84_street_twist: handlePierStreetTwist,
  epilogue_ceremony: handleEpilogue,
};

function handleMetaCommand(prevState, cmd, output) {
  if (cmd.verb === 'undo') {
    if (!prevState.undoStack || prevState.undoStack.length === 0) {
      const next = cloneState(prevState);
      addLog(next, output, 'SYSTEM', 'Nothing on the undo stack yet.');
      return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: next.gameOver, victory: next.victory };
    }
    const stack = prevState.undoStack.slice();
    const restored = { ...stack.pop(), undoStack: stack };
    addLog(restored, output, 'SYSTEM', '[UNDO] Rewound to your last clean decision. Stay by the book, Officer Mercer.');
    return {
      state: restored,
      output,
      text: output.join('\n'),
      sfx: 'tick',
      scoreDelta: 0,
      sceneChanged: restored.scene !== prevState.scene,
      gameOver: restored.gameOver,
      victory: restored.victory,
    };
  }

  if (cmd.verb === 'save' || cmd.verb === 'save_quit') {
    const next = cloneState(prevState);
    const slot = cmd.noun || 'quicksave';
    const filePath = saveGame(next, slot);
    const shouldQuit = cmd.verb === 'save_quit';
    addLog(
      next,
      output,
      'SYSTEM',
      shouldQuit ? `Saved game to ${filePath}. Closing Precinct 84...` : `Saved game to ${filePath}`
    );
    return {
      state: next,
      output,
      text: output.join('\n'),
      sfx: 'tick',
      scoreDelta: 0,
      sceneChanged: false,
      gameOver: next.gameOver,
      victory: next.victory,
      ...(shouldQuit ? { meta: { quit: true, savedSlot: slot, savePath: filePath } } : {}),
    };
  }

  if (cmd.verb === 'restore') {
    try {
      const loaded = loadGame(cmd.noun || 'quicksave');
      loaded.phase = 'playing';
      addLog(loaded, output, 'SYSTEM', `Restored save slot "${cmd.noun || 'quicksave'}".`);
      return {
        state: loaded,
        output,
        text: output.join('\n'),
        sfx: 'tick',
        scoreDelta: 0,
        sceneChanged: loaded.scene !== prevState.scene,
        gameOver: loaded.gameOver,
        victory: loaded.victory,
      };
    } catch (err) {
      const next = cloneState(prevState);
      addLog(next, output, 'SYSTEM', err.message);
      return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: next.gameOver, victory: next.victory };
    }
  }

  return null;
}

export function executeCommand(prevState, rawInput) {
  const cmd = parseCommand(rawInput);
  const output = [];

  if (!cmd.normalized) {
    return { state: prevState, output: [], text: '', sfx: null, scoreDelta: 0, sceneChanged: false, gameOver: prevState.gameOver, victory: prevState.victory };
  }

  const metaResult = handleMetaCommand(prevState, cmd, output);
  if (metaResult) return metaResult;

  if (prevState.gameOver) {
    const next = cloneState(prevState);
    addLog(next, output, 'SYSTEM', 'GAME OVER active — type "undo" (or press F9) to rewind your last mistake.');
    return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: next.gameOver, victory: next.victory };
  }

  if (cmd.verb === 'inventory') {
    const next = cloneState(prevState);
    addLog(next, output, 'SYSTEM', `INVENTORY: ${next.inventory.length ? next.inventory.join(', ') : '(empty)'}`);
    return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: null, victory: next.victory };
  }

  if (cmd.verb === 'score') {
    const next = cloneState(prevState);
    addLog(next, output, 'SYSTEM', `SCORE: ${next.score} / ${next.maxScore}`);
    return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: null, victory: next.victory };
  }

  if (cmd.verb === 'manual') {
    const next = cloneState(prevState);
    addLog(next, output, 'SYSTEM', 'Press [F1] for the full Patrolman\'s Field Guide, or check objectives on the right.');
    return { state: next, output, text: output.join('\n'), sfx: 'tick', scoreDelta: 0, sceneChanged: false, gameOver: null, victory: next.victory, meta: { openManual: true } };
  }

  const snapshot = makeSnapshot(prevState);
  const next = cloneState(prevState);
  next.undoStack = [...prevState.undoStack.slice(-(MAX_UNDO_DEPTH - 1)), snapshot];
  next.turn += 1;
  next.log.push({ tag: 'CMD', text: `> ${rawInput}` });

  const handler = SCENE_HANDLERS[next.scene];
  const sfx = handler ? handler(next, cmd, output) : null;
  const noMatch = sfx === null;
  if (noMatch) {
    addLog(next, output, 'SYSTEM', `No effect here for "${rawInput}". Type "manual", "ask claire", or click a chip for valid procedures.`);
  }

  return {
    state: next,
    output,
    text: output.join('\n'),
    sfx: sfx || 'tick',
    scoreDelta: next.score - prevState.score,
    sceneChanged: next.scene !== prevState.scene,
    gameOver: next.gameOver,
    victory: next.victory,
    meta: noMatch ? { noMatch: true } : undefined,
  };
}
