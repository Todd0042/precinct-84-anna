import { drawGameOverOverlay } from './art-overlays.js';
import {
  drawBriefing,
  drawLockerRoom,
  drawMotorPoolYard,
} from './art-act1.js';
import {
  drawCrosswalkRedlight,
  drawPursuit,
  drawFelonyStop,
  drawInterrogationRoom,
} from './art-act2.js';
import {
  drawMotelExterior,
  drawMotelAlley,
  drawMotelLab,
} from './art-act3.js';
import {
  drawPierExterior,
  drawPierInterior,
  drawPierOffice,
  drawPierStreetTwist,
  drawEpilogue,
} from './art-act4.js';

export const SCENE_IDS = [
  'precinct_briefing',
  'precinct_locker',
  'precinct_yard',
  'crosswalk_redlight',
  'pursuit_active',
  'felony_stop',
  'interrogation_room',
  'motel_exterior',
  'motel_alley',
  'motel_lab',
  'pier84_exterior',
  'pier84_interior',
  'pier84_office',
  'pier84_street_twist',
  'epilogue_ceremony',
];

const RENDERERS = {
  precinct_briefing: drawBriefing,
  precinct_locker: drawLockerRoom,
  precinct_yard: drawMotorPoolYard,
  crosswalk_redlight: drawCrosswalkRedlight,
  pursuit_active: drawPursuit,
  felony_stop: drawFelonyStop,
  interrogation_room: drawInterrogationRoom,
  motel_exterior: drawMotelExterior,
  motel_alley: drawMotelAlley,
  motel_lab: drawMotelLab,
  pier84_exterior: drawPierExterior,
  pier84_interior: drawPierInterior,
  pier84_office: drawPierOffice,
  pier84_street_twist: drawPierStreetTwist,
  epilogue_ceremony: drawEpilogue,
};

export function renderSceneArt(fb, state, tick = 0) {
  const fn = RENDERERS[state.scene] || drawBriefing;
  fn(fb, state, tick);
  if (state.gameOver) {
    drawGameOverOverlay(fb, state.gameOver, tick);
  }
}
