import assert from 'node:assert/strict';

import { createInitialState } from '../bundle/game/state.js';
import {
  OUTFIT_IDS,
  HELD_PROP_CATALOG,
  STAGE_PROP_CATALOG,
  SCENE_LANDMARKS,
  resolveOutfitSpec,
  resolveLandmark,
} from '../bundle/assets/outfit-prop-catalog.js';
import { CHARACTER_CATALOG } from '../bundle/assets/character-catalog.js';
import { drawAnatomicalActor } from '../bundle/gfx/anatomy-actor.js';
import { drawPortraitCutIn } from '../bundle/gfx/portrait-painter.js';
import { drawSvgaScene } from '../bundle/gfx/scene-compositor.js';
import { createStageDirector } from '../bundle/gfx/stage-director.js';
import {
  validateChapterBlueprint,
  validateSingleIntermission,
} from '../bundle/engine/blueprint-schema.js';
import { buildStoryBiblePrompt } from '../bundle/engine/story-bible.js';
import { INTERMISSION_TRANSITIONS } from '../bundle/engine/case-context.js';
import { createXtermTuiSession } from '../bundle/ui/xterm-session.js';

function createMockTerm() {
  return { cols: 104, rows: 13, write: () => {}, onData: () => ({ dispose: () => {} }), onResize: () => ({ dispose: () => {} }) };
}

function createMockCanvasCtx() {
  const ops = [];
  const colors = [];
  let _fillStyle = '#000';
  let _strokeStyle = '#000';
  const noopGrad = { addColorStop: () => {} };
  const pushOp = (name, args) => ops.push({ name, args });
  return {
    ops,
    colors,
    get fillStyle() { return _fillStyle; },
    set fillStyle(v) { _fillStyle = v; if (typeof v === 'string') colors.push(v); },
    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(v) { _strokeStyle = v; if (typeof v === 'string') colors.push(v); },
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '12px monospace',
    globalAlpha: 1,
    save: () => pushOp('save', []),
    restore: () => pushOp('restore', []),
    translate: (x, y) => pushOp('translate', [x, y]),
    scale: (sx, sy) => pushOp('scale', [sx, sy]),
    rotate: (r) => pushOp('rotate', [r]),
    beginPath: () => pushOp('beginPath', []),
    closePath: () => pushOp('closePath', []),
    clip: () => pushOp('clip', []),
    moveTo: (x, y) => pushOp('moveTo', [x, y]),
    lineTo: (x, y) => pushOp('lineTo', [x, y]),
    quadraticCurveTo: (a, b, c, d) => pushOp('quadraticCurveTo', [a, b, c, d]),
    arc: (x, y, r, s, e) => pushOp('arc', [x, y, r, s, e]),
    ellipse: (x, y, rx, ry) => pushOp('ellipse', [x, y, rx, ry]),
    roundRect: (x, y, w, h) => pushOp('roundRect', [x, y, w, h]),
    rect: (x, y, w, h) => pushOp('rect', [x, y, w, h]),
    fillRect: (x, y, w, h) => pushOp('fillRect', [x, y, w, h]),
    strokeRect: (x, y, w, h) => pushOp('strokeRect', [x, y, w, h]),
    clearRect: (x, y, w, h) => pushOp('clearRect', [x, y, w, h]),
    fill: () => pushOp('fill', []),
    stroke: () => pushOp('stroke', []),
    fillText: (t, x, y) => pushOp('fillText', [t, x, y]),
    createLinearGradient: () => noopGrad,
    createRadialGradient: () => noopGrad,
  };
}

async function testOutfitsPropsAndArticulatedPoses() {
  console.log('1. Testing Outfits, 30+ Props, Landmarks & Articulated Rig...');
  for (const id of ['police_uniform', 'bad_guy', 'casual', 'formal', 'naked']) {
    assert.ok(OUTFIT_IDS.includes(id), `OUTFIT_IDS must include ${id}`);
  }
  assert.ok(Object.keys(HELD_PROP_CATALOG).length >= 24, 'Expected >= 24 held props');
  assert.ok(Object.keys(STAGE_PROP_CATALOG).length >= 16, 'Expected >= 16 stage props');
  for (const reqProp of ['cigarette', 'coffee_cup', 'whiskey_glass', 'pistol', 'shotgun', 'evidence_bag']) {
    assert.ok(HELD_PROP_CATALOG[reqProp], `HELD_PROP_CATALOG must include ${reqProp}`);
  }
  assert.ok(SCENE_LANDMARKS.marcus_bedroom?.bed_left, 'Bed landmark required for bedrooms');
  assert.ok(SCENE_LANDMARKS.diner_booth?.booth_left, 'Booth landmark required for diner');

  const nakedSpec = resolveOutfitSpec(CHARACTER_CATALOG.claire, 'naked');
  assert.equal(nakedSpec.isNaked, true);
  assert.equal(nakedSpec.badge, false);
  const formalMale = resolveOutfitSpec(CHARACTER_CATALOG.marcus, 'formal');
  assert.equal(formalMale.hasTie, true);

  const bedSpot = resolveLandmark('marcus_bedroom', 'bed_left');
  assert.ok(bedSpot.y < 190 && bedSpot.defaultPose === 'lie_bed', 'Bedroom bed_left should rest on mattress');

  const poses = ['walk', 'chill', 'sit', 'lie_bed', 'bend_pickup', 'smoke', 'shoot', 'down'];
  for (const outfit of ['naked', 'formal', 'casual', 'bad_guy', 'police_uniform']) {
    for (const pose of poses) {
      const ctx = createMockCanvasCtx();
      drawAnatomicalActor(ctx, 240, 220, CHARACTER_CATALOG.marcus, {
        outfit,
        pose,
        prop: pose === 'shoot' ? 'pistol' : pose === 'smoke' ? 'cigarette' : 'coffee_cup',
        walkCycle: 1.2,
        tick: 5,
      });
      assert.ok(ctx.ops.some((o) => o.name === 'rotate') || pose !== 'lie_bed', `Actor pose ${pose} must execute transforms`);
      assert.ok(ctx.ops.length > 15, `Actor pose ${pose}/${outfit} must render full anatomy`);
    }
    const pCtx = createMockCanvasCtx();
    drawPortraitCutIn(pCtx, 0, 0, 96, CHARACTER_CATALOG.claire, 'flirt', 4, { outfit, prop: 'cigarette' });
    assert.ok(pCtx.ops.length > 20, `Portrait ${outfit} must render with cigarette ember/smoke`);
  }

  const sceneCtx = createMockCanvasCtx();
  const beat = validateChapterBlueprint({
    title: 'Screenplay Visual Test',
    beats: [
      {
        id: 'b1',
        sceneId: 'marcus_bedroom_visit',
        speakerId: 'claire_offduty',
        speakerMood: 'flirt',
        actors: [
          { id: 'claire_offduty', outfit: 'naked', pose: 'lie_bed', at: 'bed_left', prop: 'cigarette' },
          { id: 'marcus_offduty', outfit: 'casual', pose: 'chill', at: 'doorway', prop: 'coffee_cup' },
        ],
        stageProps: [{ id: 'shell_casings', at: 'evidence_spot' }],
        narrative: ['Rain slides past the blinds while Claire rests on the mattress.'],
        actions: [{ label: 'Approach Bed', command: 'approach', endChapter: true }],
      },
    ],
  }, 1, false);
  const s0 = createInitialState({ phase: 'playing', aiTier: 3, aiCampaign: { active: true, chapterIdx: 0, currentBeatId: 'b1', chapters: [beat] } });
  drawSvgaScene(sceneCtx, s0, 3, { activeBeat: beat.beats.b1 });
  assert.ok(sceneCtx.ops.some((o) => o.name === 'rotate'), 'SVGA scene should rotate lie_bed actor cleanly');
  console.log('   PASS: Outfits, 30+ props, landmarks & articulated poses rendered cleanly.');
}

async function testAutoEnricherAndScreenplaySchema() {
  console.log('2. Testing Prose-to-Visual Auto-Enricher, Landmarks & Screenplay Schema...');
  const chap = validateChapterBlueprint({
    title: 'Smoke & Gunfire',
    beats: [
      {
        id: 'b1',
        sceneId: 'marcus_bedroom_night',
        speakerId: 'eddie',
        actors: [{ id: 'eddie' }, { id: 'claire_offduty' }, { id: 'marcus_offduty' }],
        narrative: [
          'Eddie smokes a cigarette in his casual jacket near the doorway.',
          'Claire lies on the bed naked under thin moonlight.',
          'Marcus spots the evidence bag near the nightstand.',
        ],
        actions: [
          {
            label: 'Grab Evidence & Shoot',
            command: 'grab_and_shoot',
            endChapter: true,
            log: 'Marcus bends down to pick up the evidence bag, then fires his pistol at Eddie.',
          },
        ],
      },
    ],
  }, 1, false);

  const b1 = chap.beats.b1;
  const eddie = b1.actors.find((a) => a.id === 'eddie');
  const claire = b1.actors.find((a) => a.id === 'claire_offduty');
  assert.equal(eddie.prop, 'cigarette', 'Auto-enricher should assign cigarette to Eddie');
  assert.equal(eddie.outfit, 'casual', 'Auto-enricher should assign casual outfit to Eddie');
  assert.equal(claire.outfit, 'naked', 'Auto-enricher should assign naked outfit to Claire');
  assert.equal(claire.pose, 'lie_bed', 'Auto-enricher should assign lie_bed pose to Claire');
  assert.ok(claire.y < 190, 'Bedroom landmark/bed positioning should clamp onto bed height');
  assert.ok(Array.isArray(b1.timeline) && b1.timeline.length >= 2, 'Beat should synthesize timeline cues');

  const act = b1.actions[0];
  assert.ok(Array.isArray(act.timeline) && act.timeline.some((c) => c.type === 'pickup'), 'Action log mentioning pickup should synthesize pickup cue');
  assert.ok(act.timeline.some((c) => c.type === 'fire'), 'Action log mentioning firing pistol should synthesize fire cue');

  const inter = validateSingleIntermission({
    sceneId: 'diner_midnight',
    speakerId: 'claire',
    lines: ['Claire sips her coffee in a formal dress in the left booth while Marcus smokes a cigarette.'],
    choices: [{ label: 'Pay Tab', command: 'pay', reply: 'Marcus drops a five.' }],
  }, 'precinct_yard->crosswalk_redlight', INTERMISSION_TRANSITIONS);
  assert.ok(Array.isArray(inter.actors) && inter.actors.length >= 1, 'Intermission must include enriched stage actors');
  assert.ok(Array.isArray(inter.timeline) && inter.timeline.length >= 1, 'Intermission must include timeline cues');
  console.log('   PASS: Prose-to-visual auto-enricher, landmarks & schema validated.');
}

async function testStageDirectorBallisticsAndZeroHpRealism() {
  console.log('3. Testing Stage Director Playback, Ballistics & Zero-HP Realism Across Tiers...');
  const director = createStageDirector();
  const sfxPlayed = [];
  const beat = validateChapterBlueprint({
    title: 'Pier Ambush',
    beats: [
      {
        id: 'b1',
        sceneId: 'pier84_interior',
        speakerId: 'marcus',
        actors: [
          { id: 'marcus', outfit: 'police_uniform', pose: 'stand', x: 80, y: 238, facing: 1 },
          { id: 'enforcer_gallo', outfit: 'bad_guy', pose: 'aim', x: 340, y: 238, facing: -1, prop: 'shotgun' },
        ],
        stageProps: [{ id: 'evidence_bag', x: 145, y: 242 }],
        timeline: [
          { type: 'move', actorId: 'marcus', to: [135, 238], speed: 'walk' },
          { type: 'pickup', actorId: 'marcus', prop: 'evidence_bag', x: 145, y: 242 },
          { type: 'speak', speakerId: 'marcus', mood: 'angry', line: 'Drop the shotgun, Gallo!', durationMs: 200 },
          { type: 'fire', shooterId: 'marcus', targetId: 'enforcer_gallo', weapon: 'pistol', outcome: 'wounded_leg' },
        ],
        actions: [
          {
            label: 'Leg Shot Suspect',
            command: 'shoot_leg',
            nextBeatId: 'b2',
            consequence: { targetId: 'enforcer_gallo', status: 'wounded_leg', shooterId: 'marcus', weapon: 'pistol' },
            log: 'You fire low into Gallo\'s knee; paramedics strap him to a gurney for County General.',
          },
          {
            label: 'Take Headshot',
            command: 'bad_peak',
            nextBeatId: 'b2',
            consequence: { targetId: 'marcus', status: 'dead', shooterId: 'enforcer_gallo', weapon: 'shotgun' },
            log: 'Unarmored point-blank blast drops you in the doorway.',
          },
        ],
      },
      {
        id: 'b2',
        sceneId: 'pier84_office',
        speakerId: 'claire',
        actors: [{ id: 'marcus' }, { id: 'enforcer_gallo' }, { id: 'claire' }],
        narrative: ['Police flood the mezzanine as the smoke clears.'],
        actions: [
          {
            label: 'Close Pier Case',
            command: 'close_case',
            endChapter: true,
            consequence: { targetId: 'castellano', status: 'dead', shooterId: 'marcus', weapon: 'pistol' },
            log: 'Castellano falls fatally beside the incinerator.',
          },
        ],
      },
    ],
  }, 1, true);

  const st = {
    ...createInitialState({ phase: 'playing', aiTier: 3 }),
    aiCampaign: { active: true, chapterIdx: 0, currentBeatId: 'b1', chapters: [beat], outline: { caseTitle: 'Zero HP Test', culpritId: 'castellano' } },
  };

  director.syncBeatStage(st, beat.beats.b1);
  let sawProjectile = false;
  let sawPickupPose = false;
  // Step through walk
  for (let i = 0; i < 10; i++) {
    director.step(55, (s) => sfxPlayed.push(s));
    if (director.getActors().some((a) => a.pose === 'bend_pickup')) sawPickupPose = true;
    if (director.getProjectiles().length > 0) sawProjectile = true;
  }
  const mAfterWalk = director.getActors().find((a) => a.id === 'marcus');
  assert.ok(mAfterWalk.x >= 120, 'Marcus should walk from x=80 toward x=135');

  // Step through pickup + speak + fire
  for (let i = 0; i < 45; i++) {
    director.step(50, (s) => sfxPlayed.push(s));
    if (director.getActors().some((a) => a.pose === 'bend_pickup')) sawPickupPose = true;
    if (director.getProjectiles().length > 0) sawProjectile = true;
  }
  const mFinal = director.getActors().find((a) => a.id === 'marcus');
  const gFinal = director.getActors().find((a) => a.id === 'enforcer_gallo');
  assert.ok(sawPickupPose, 'Director must animate bend_pickup pose during pickup cue');
  assert.equal(director.getStageProps().some((p) => p.id === 'evidence_bag'), false, 'Picked-up stage prop should leave floor');
  assert.ok(sfxPlayed.includes('shot'), 'Fire cue must trigger shot SFX');
  assert.ok(sawProjectile || director.getParticles().length > 0, 'Fire cue must emit projectile tracer or impact sparks');
  assert.equal(mFinal.prop, 'pistol', 'Shooting switches actor prop cleanly');
  assert.equal(gFinal.condition, 'wounded_leg', 'Non-fatal leg hit sets realistic wounded_leg state');
  assert.equal(gFinal.pose, 'kneel', 'Wounded-leg actor drops to kneel pose');

  // Verify zero health bars anywhere in state + Story Bible continuity + Marcus fatal rewind
  const session = createXtermTuiSession({ term: createMockTerm(), initialState: st, audioEnabled: false, tickIntervalMs: 0 });
  assert.equal('hp' in session.getState(), false, 'No HP field allowed on game state');
  session.runCmd('shoot_leg');
  const sAfterLeg = session.getState();
  assert.equal(sAfterLeg.aiCampaign.storyState.injuries.enforcer_gallo, 'wounded_leg');
  session.runCmd('close_case');
  const sAfterDead = session.getState();
  assert.ok(sAfterDead.aiCampaign.storyState.casualties.includes('castellano'), 'Fatal NPC outcome saved to casualties');
  const bible = buildStoryBiblePrompt(sAfterDead.aiCampaign, sAfterDead.alignment, sAfterDead.awarded);
  assert.ok(bible.includes('castellano') || bible.includes('Castellano'), 'Story Bible must track deceased casualties');
  assert.ok(bible.includes('wounded_leg'), 'Story Bible must track active physical wounds');

  // Rewind to b1 and trigger fatal outcome on Marcus -> Sierra-style fatal gameOver + undo
  session.setState(st);
  session.runCmd('bad_peak');
  const sDead = session.getState();
  assert.ok(sDead.gameOver && sDead.gameOver.title.includes('FATAL'), 'Fatal wound on Marcus triggers FATAL gameOver without health bars');
  session.runCmd('undo');
  assert.equal(session.getState().gameOver, null, 'Undo cleanly rewinds fatal tactical choice');
  session.dispose();
  console.log('   PASS: Stage Director, ballistics FX & zero-HP realism verified across tiers.');
}

async function main() {
  await testOutfitsPropsAndArticulatedPoses();
  await testAutoEnricherAndScreenplaySchema();
  await testStageDirectorBallisticsAndZeroHpRealism();
  console.log('\nALL SCREENPLAY STAGE / OUTFIT / PROP / BALLISTICS E2E TESTS PASSED');
}

main().catch((err) => {
  console.error('Screenplay E2E failed:', err);
  process.exit(1);
});
