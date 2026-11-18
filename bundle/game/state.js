import { PrecinctSaveStore } from '../storage.js';

export const MAX_UNDO_DEPTH = 40;

let activeSaveStore = new PrecinctSaveStore(null);

export function setActiveSaveStore(store) {
  if (!store || typeof store.saveSlot !== 'function' || typeof store.loadSlot !== 'function') {
    throw new Error('setActiveSaveStore requires a valid PrecinctSaveStore instance.');
  }
  activeSaveStore = store;
}

export function getActiveSaveStore() {
  return activeSaveStore;
}

export const SCENE_META = {
  precinct_briefing: { title: 'ACT I: PRECINCT 84 — ROLL CALL BRIEFING (21:30)', act: 'ACT I' },
  precinct_locker: { title: 'ACT I: PRECINCT 84 — LOCKER ROOM #84 (21:45)', act: 'ACT I' },
  precinct_yard: { title: 'ACT I: PRECINCT 84 — MOTOR POOL YARD (21:55)', act: 'ACT I' },
  crosswalk_redlight: { title: 'ACT II: 4TH & UNION — RED LIGHT IN THE RAIN (22:18)', act: 'ACT II' },
  pursuit_active: { title: 'ACT II: CODE 3 HIGH-SPEED PURSUIT (22:19)', act: 'ACT II' },
  felony_stop: { title: 'ACT II: DEAD-END RAIL YARD #3 — FELONY STOP (22:28)', act: 'ACT II' },
  interrogation_room: { title: 'ACT II: PRECINCT 84 — INTERROGATION ROOM B (23:10)', act: 'ACT II' },
  motel_exterior: { title: 'ACT III: STARLIGHT MOTOR COURT — ROOM 209 (23:45)', act: 'ACT III' },
  motel_alley: { title: 'ACT III: MOTEL BACK ALLEY — FOOT PURSUIT (23:48)', act: 'ACT III' },
  motel_lab: { title: 'ACT III: ROOM 209 CLANDESTINE LAB — FORENSICS (00:05)', act: 'ACT III' },
  pier84_exterior: { title: 'ACT IV: PIER 84 COLD STORAGE & CANNERY (01:25)', act: 'ACT IV' },
  pier84_interior: { title: 'ACT IV: PIER 84 PROCESSING FLOOR — BREACH! (01:32)', act: 'ACT IV' },
  pier84_office: { title: 'ACT IV: MEZZANINE OFFICE — KINGPIN SHOWDOWN (01:40)', act: 'ACT IV' },
  pier84_street_twist: { title: 'ACT IV: PIER 84 CRIME-SCENE TAPE — OUTSIDE (01:50)', act: 'ACT IV' },
  epilogue_ceremony: { title: 'EPILOGUE: GOLD SHIELD & CASE FILE #84-002 (09:00)', act: 'FINALE' },
};

export function createInitialState({
  phase = 'playing',
  aiTier = 1,
  aiModel = 'preset:default',
  storyGenMode = 'episodic',
  storyTheme = '',
  llmAvailable = false,
} = {}) {
  return {
    phase,
    aiTier,
    aiModel,
    storyGenMode,
    storyTheme,
    llmAvailable,
    intermission: null,
    tier2Script: null,
    aiCampaign: null,
    alignment: { byTheBook: 0, corruption: 0, rogue: 0 },
    scene: 'precinct_briefing',
    officerName: 'Officer Marcus Mercer',
    badge: '#084',
    partnerName: 'Officer Claire Bellamy',
    partnerBadge: '#089',
    score: 0,
    maxScore: 100,
    pursuitStage: 0,
    turn: 0,
    inventory: [],
    objectives: [
      'Listen to Sgt. Dooley\'s roll call briefing (listen briefing)',
      'Inspect chalkboard BOLO details (look blackboard)',
    ],
    awarded: {},
    flags: {
      gotBriefing: false, readBolo: false, openedLocker: false, equippedGear: false, hasKeys: false,
      inspectedTires: false, inspectedTrunk: false, inCar: false, seatbeltOn: false, called108: false,
      sawPedestrian: false, lightsOn: false, sirenOn: false, called1080: false,
      dodgedVan: false, passedTanker: false, pinnedRourke: false,
      weaponDrawn: false, inCover: false, suspectCompliant: false,
      eddieCuffed: false, eddieSearched: false, eddieMiranda: false, trunkSearched: false, baggedRourkeEvidence: false,
      recorderOn: false, showedDrugs: false, showedPager: false,
      called1097: false, inspectedMotelDoor: false, stoodAside: false, survivedTrap: false,
      corneredMarco: false, marcoCuffed: false, marcoMiranda: false,
      inspectedTable: false, foundSafe: false, dustedSafe: false, liftedPrints: false,
      comparedPrints: false, openedSafe: false, decodedLedger: false, warrantCode: '',
      swatCalled: false, alarmDisabled: false, breachedPier: false,
      pierCover: false, announcedPolice: false, enforcerDown: false,
      castellanoDisarmed: false, castellanoCuffed: false, castellanoMiranda: false,
      hasMasterLedger: false, inspectedBossDesk: false, castellanoConfessed: false, sawMastermindTwist: false,
    },
    gameOver: null,
    victory: false,
    log: [
      { tag: 'SCENE', text: '21:30 HRS — PRECINCT 84 BASEMENT BRIEFING ROOM, OAKRIDGE CITY' },
      {
        tag: 'NARRATIVE',
        text: 'Rain hammers the frosted windows. Beside you in the third row, your partner Officer Claire Bellamy (#089) slides over a styrofoam cup of black coffee with a quiet smile: "Long night ahead, Marcus."',
      },
      {
        tag: 'NARRATIVE',
        text: 'At the front podium, Sgt. Frank Dooley taps a wooden pointer against a chalkboard covered in "Blue Velvet" narcotics photos.',
      },
    ],
    undoStack: [],
  };
}

export function cloneState(state) {
  const copy = JSON.parse(JSON.stringify({ ...state, undoStack: [] }));
  copy.undoStack = Array.isArray(state.undoStack) ? state.undoStack.slice(-MAX_UNDO_DEPTH) : [];
  return copy;
}

export function makeSnapshot(state) {
  return JSON.parse(JSON.stringify({ ...state, undoStack: [] }));
}

export function addLog(state, output, tag, text) {
  output.push(text);
  state.log.push({ tag, text });
  if (state.log.length > 160) {
    state.log = state.log.slice(-160);
  }
}

export function award(state, key, points) {
  if (state.awarded[key]) return 0;
  state.awarded[key] = true;
  state.score = Math.min(state.maxScore, state.score + points);
  return points;
}

export function addItem(state, item) {
  if (!state.inventory.includes(item)) {
    state.inventory.push(item);
  }
}

export function triggerFail(state, output, title, citation, reason) {
  state.gameOver = { title, citation, reason };
  addLog(state, output, 'FAIL', `[${citation}] ${title}: ${reason}`);
  addLog(state, output, 'SYSTEM', 'Type "undo" (or press F9) to rewind before this mistake.');
  return 'gameover';
}

export function transitionTo(state, output, nextScene, objectives, introLines) {
  state.scene = nextScene;
  state.objectives = objectives;
  const meta = SCENE_META[nextScene];
  if (meta) {
    addLog(state, output, 'SCENE', `--- ${meta.title} ---`);
  }
  for (const line of introLines) {
    addLog(state, output, 'NARRATIVE', line);
  }
}

export function saveGame(state, slotName = 'quicksave', storeOverride = null) {
  const store = storeOverride || activeSaveStore;
  return store.saveSlot(slotName, makeSnapshot(state));
}

export function loadGame(slotName = 'quicksave', storeOverride = null) {
  const store = storeOverride || activeSaveStore;
  return store.loadSlot(slotName);
}
