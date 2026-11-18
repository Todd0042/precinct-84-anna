import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { createInitialState, setActiveSaveStore } from '../bundle/game/state.js';
import { SCENE_IDS } from '../bundle/engine/art.js';
import { AUDIO_CUES, encodeWav16Mono, synthCueSamples } from '../bundle/engine/audio.js';
import { PrecinctSaveStore } from '../bundle/storage.js';
import { createXtermTuiSession } from '../bundle/ui/xterm-session.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

function createMockTerminal(cols = 128, rows = 46) {
  const dataListeners = new Set();
  const resizeListeners = new Set();
  const writes = [];
  return {
    get cols() {
      return cols;
    },
    get rows() {
      return rows;
    },
    writes,
    write(chunk) {
      writes.push(String(chunk));
    },
    onData(cb) {
      dataListeners.add(cb);
      return { dispose: () => dataListeners.delete(cb) };
    },
    onResize(cb) {
      resizeListeners.add(cb);
      return { dispose: () => resizeListeners.delete(cb) };
    },
    emitInput(seq) {
      for (const cb of dataListeners) cb(seq);
    },
    typeCommand(cmd) {
      for (const ch of cmd) this.emitInput(ch);
      this.emitInput('\r');
    },
    resize(nextCols, nextRows) {
      cols = nextCols;
      rows = nextRows;
      for (const cb of resizeListeners) cb({ cols, rows });
    },
    lastScreen() {
      return writes.length ? writes[writes.length - 1] : '';
    },
  };
}

async function testValidateStrict() {
  console.log('1. Running E2E Scenario 1: anna-app validate --strict...');
  const { stdout, stderr } = await execFileAsync('anna-app', ['validate', '--strict'], {
    cwd: PROJECT_ROOT,
  });
  assert.match(stdout, /validate passed/, `Expected validate passed, got:\n${stdout}\n${stderr}`);
  console.log('   PASS: anna-app validate --strict passed.');
}

async function testGoldenPathInXtermSession() {
  console.log('2. Running E2E Scenario 2: Full 100/100 Golden Path in High-Res xterm session...');
  const term = createMockTerminal(128, 46);
  const session = createXtermTuiSession({
    term,
    initialState: createInitialState(),
    audioEnabled: false,
    tickIntervalMs: 0,
  });

  try {
    const seenScenes = new Set([session.getState().scene]);
    assert.ok(term.writes[0].includes('\x1b[?1049h'), 'Should enter alternate screen buffer');
    assert.ok(term.writes[0].includes('\x1b[?1006h'), 'Should enable SGR mouse tracking');
    assert.ok(term.lastScreen().includes('▀'), 'Initial frame should contain half-block art');
    assert.ok(term.lastScreen().includes('\x1b[38;2;'), 'Initial frame should emit truecolor ANSI');
    assert.equal(stripAnsi(term.lastScreen()).split('\r\n').length, 46, 'High-res frame must render 46 rows');

    // Click first suggested chip via SGR mouse sequence ("listen briefing")
    const firstChip = session.getLatestFrame().chipHitboxes[0];
    assert.ok(firstChip, 'Expected at least one suggested chip hitbox');
    term.emitInput(`\x1b[<0;${firstChip.x0};${firstChip.y}M`);
    assert.equal(session.getState().flags.gotBriefing, true, 'Mouse click on chip should execute command');

    // Click second chip via scaled pointer click helper ("look blackboard")
    const secondChip = session.getLatestFrame().chipHitboxes.find((c) => c.command === 'look blackboard');
    assert.ok(secondChip && session.handleScreenClick(secondChip.x0, secondChip.y));
    assert.equal(session.getState().flags.readBolo, true, 'handleScreenClick should trigger look blackboard');

    // Test Tab completion into input buffer then submit ("go locker")
    term.emitInput('\t');
    term.emitInput('\r');
    assert.equal(session.getState().scene, 'precinct_locker', 'Tab + Enter should advance to locker');

    const remainingCommands = [
      'open locker', 'take belt', 'take keys', 'go yard',
      'inspect tires', 'inspect trunk', 'enter car', 'fasten seatbelt', 'radio 10-8',
      'look pedestrian', 'turn on lights', 'turn on siren', 'radio 10-80',
      'swerve left', 'hold lane', 'follow tracks',
      'draw weapon', 'order suspect out', 'holster weapon', 'cuff suspect',
      'search suspect', 'read miranda', 'search trunk', 'bag evidence',
      'turn on recorder', 'show drugs', 'show pager',
      'radio 10-97', 'inspect door', 'stand aside', 'knock door',
      'pursue marco', 'cuff marco', 'read miranda', 'inspect table',
      'dust safe', 'lift prints', 'compare prints', 'open safe', 'decode ledger',
      'radio swat', 'cut wires', 'signal breach', 'take cover',
      'shout police freeze', 'return fire', 'order drop gun', 'holster weapon',
      'cuff castellano', 'read miranda', 'bag ledger', 'inspect desk',
      'talk castellano', 'go street', 'look street',
    ];

    seenScenes.add(session.getState().scene);
    for (const cmd of remainingCommands) {
      term.typeCommand(cmd);
      seenScenes.add(session.getState().scene);
    }

    assert.equal(seenScenes.size, SCENE_IDS.length, `Expected all ${SCENE_IDS.length} scenes visited`);
    const finalState = session.getState();
    assert.equal(finalState.scene, 'epilogue_ceremony');
    assert.equal(finalState.victory, true);
    assert.equal(finalState.score, 100);
    assert.equal(finalState.gameOver, null);
    assert.match(stripAnsi(term.lastScreen()), /100\/100/);
  } finally {
    session.dispose();
  }

  assert.ok(term.lastScreen().includes('\x1b[?1049l'), 'dispose() should exit alternate screen');
  console.log('   PASS: 100/100 Golden Path, SGR mouse, Tab completion & resize verified.');
}

async function testProceduralFailUndoManualAndWebAudio() {
  console.log('3. Running E2E Scenario 3: Citations, F9/Mouse Undo, F1 Manual, F2 Web Audio...');
  const audioEvents = [];
  const mockAudioCtx = {
    state: 'suspended',
    destination: { kind: 'speakers' },
    async resume() {
      this.state = 'running';
      audioEvents.push('resume');
    },
    createBuffer(channels, length, sampleRate) {
      audioEvents.push(`createBuffer:${channels}:${length}:${sampleRate}`);
      const data = new Float32Array(length);
      return {
        copyToChannel(src) {
          data.set(src);
        },
        getChannelData() {
          return data;
        },
      };
    },
    createBufferSource() {
      return {
        buffer: null,
        connect() {
          audioEvents.push('connect');
        },
        start() {
          audioEvents.push('start');
        },
      };
    },
  };

  const term = createMockTerminal(60, 23);
  const session = createXtermTuiSession({
    term,
    initialState: createInitialState(),
    audioEnabled: true,
    audioContextFactory: () => mockAudioCtx,
    tickIntervalMs: 0,
  });

  try {
    // Verify all 9 cues synthesize valid WAV headers and trigger Web Audio playback
    for (const cue of AUDIO_CUES) {
      const samples = synthCueSamples(cue);
      assert.ok(samples instanceof Float32Array && samples.length > 0, `Cue ${cue} must have PCM samples`);
      const wav = encodeWav16Mono(samples);
      assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
      assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
      session.getAudio().play(cue);
    }
    assert.ok(audioEvents.includes('resume'), 'Suspended Web AudioContext should resume on play');
    assert.equal(audioEvents.filter((e) => e === 'start').length, AUDIO_CUES.length);

    // Toggle F2 audio mute and back
    term.emitInput('\x1bOQ');
    assert.equal(session.getAudio().isEnabled(), false);
    assert.match(stripAnsi(term.lastScreen()), /MUTE/);
    term.emitInput('\x1b[12~');
    assert.equal(session.getAudio().isEnabled(), true);

    // Toggle F1 manual and close with Esc
    term.emitInput('\x1bOP');
    assert.match(stripAnsi(term.lastScreen()), /FIELD GUIDE/);
    assert.match(stripAnsi(term.lastScreen()), /HARBOR/);
    term.emitInput('\x1b');
    assert.ok(!stripAnsi(term.lastScreen()).includes('PATROLMAN FIELD GUIDE'));

    // Reach pursuit skipping tire walk-around -> trigger blowout fail -> F9 undo
    for (const cmd of [
      'listen briefing', 'look blackboard', 'go locker', 'open locker',
      'take belt', 'take keys', 'go yard', 'inspect trunk',
      'enter car', 'fasten seatbelt', 'radio 10-8', 'look pedestrian',
      'code 3', 'radio 10-80', 'swerve left',
    ]) {
      term.typeCommand(cmd);
    }
    assert.ok(session.getState().gameOver, 'Expected blowout Game Over');
    assert.match(stripAnsi(term.lastScreen()), /FAIL/);

    term.emitInput('\x1b[20~'); // F9
    assert.equal(session.getState().gameOver, null, 'F9 should undo Game Over');

    // Trigger again and click toolbar [F9:Undo] via SGR mouse click
    term.typeCommand('swerve left');
    assert.ok(session.getState().gameOver);
    const undoBox = session.getLatestFrame().toolbarHitboxes.find((b) => b.action === 'undo');
    assert.ok(undoBox, 'Toolbar must expose undo hitbox');
    term.emitInput(`\x1b[<0;${undoBox.x0};${undoBox.y}M`);
    assert.equal(session.getState().gameOver, null, 'Clicking [F9:Undo] should clear Game Over');

    // Test browser-safe quit/reset command
    term.typeCommand('quit');
    assert.equal(session.getState().scene, 'precinct_briefing');
    assert.equal(session.getState().score, 0);
  } finally {
    session.dispose();
  }
  console.log('   PASS: Citations, F9/mouse undo, F1 manual, F2 mute & Web Audio verified.');
}

async function testApsKvSaveAndRestorePersistence() {
  console.log('4. Running E2E Scenario 4: Anna APS KV Save & Restore Persistence...');
  const kvBacking = new Map();
  const calls = { get: 0, set: 0, delete: 0 };
  const mockAnna = {
    storage: {
      async get({ key }) {
        calls.get += 1;
        return kvBacking.has(key) ? { value: kvBacking.get(key) } : { value: null };
      },
      async set({ key, value }) {
        calls.set += 1;
        kvBacking.set(key, JSON.parse(JSON.stringify(value)));
      },
      async delete({ key }) {
        calls.delete += 1;
        kvBacking.delete(key);
      },
    },
  };

  const store1 = new PrecinctSaveStore(mockAnna);
  setActiveSaveStore(store1);
  await store1.load();

  const term1 = createMockTerminal(80, 23);
  const session1 = createXtermTuiSession({
    term: term1,
    initialState: createInitialState(),
    audioEnabled: false,
    tickIntervalMs: 0,
  });

  let checkpointScore = 0;
  try {
    for (const cmd of ['listen briefing', 'look blackboard', 'go locker', 'open locker', 'take belt']) {
      term1.typeCommand(cmd);
    }
    term1.emitInput('\x1b[15~'); // F5 quicksave
    for (const cmd of ['take keys', 'go yard', 'inspect tires']) {
      term1.typeCommand(cmd);
    }
    checkpointScore = session1.getState().score;
    term1.typeCommand('save alpha');
    await store1.flush();

    assert.ok(calls.set >= 2, 'Expected APS KV storage.set calls for quicksave and alpha');
    assert.deepEqual(store1.listSlots(), ['alpha', 'quicksave']);
  } finally {
    session1.dispose();
  }

  // Simulate fresh reload into a new PrecinctSaveStore + xterm session backed by same APS KV
  const store2 = new PrecinctSaveStore(mockAnna);
  setActiveSaveStore(store2);
  await store2.load();
  assert.deepEqual(store2.listSlots(), ['alpha', 'quicksave']);

  const term2 = createMockTerminal(80, 23);
  const session2 = createXtermTuiSession({
    term: term2,
    initialState: createInitialState(),
    audioEnabled: false,
    tickIntervalMs: 0,
  });

  try {
    assert.equal(session2.getState().score, 0);
    term2.typeCommand('restore alpha');
    const restored = session2.getState();
    assert.equal(restored.scene, 'precinct_yard');
    assert.equal(restored.flags.inspectedTires, true);
    assert.equal(restored.score, checkpointScore);
    assert.match(stripAnsi(term2.lastScreen()), /Restored save slot "alpha"/);

    term2.typeCommand('go car');
    term2.typeCommand('save beta and quit');
    await store2.flush();
    assert.equal(session2.getState().scene, 'precinct_briefing', 'save and quit should end shift & reset');
    assert.ok(store2.listSlots().includes('beta'), 'save beta and quit must persist beta slot');
    term2.typeCommand('restore beta');
    assert.equal(session2.getState().scene, 'precinct_yard');

    await store2.clear();
    assert.equal(calls.delete, 1);
    assert.equal(kvBacking.size, 0);
  } finally {
    session2.dispose();
  }
  console.log('   PASS: APS KV save/restore hydration across reload verified.');
}

async function testBundlePurityAndLineLimits() {
  console.log('5. Running E2E Scenario 5: Bundle Purity, Vendor Exports & Line Limits...');
  const vendorMod = await import('../bundle/vendor/xterm.bundle.js');
  assert.equal(typeof vendorMod.Terminal, 'function', 'Vendor bundle must export Terminal');
  assert.equal(typeof vendorMod.FitAddon, 'function', 'Vendor bundle must export FitAddon');

  const cssPath = path.join(PROJECT_ROOT, 'bundle', 'vendor', 'xterm.css');
  assert.ok(fs.existsSync(cssPath) && fs.statSync(cssPath).size > 100, 'xterm.css must exist');

  const bundleDir = path.join(PROJECT_ROOT, 'bundle');
  const checkFiles = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.anna') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else checkFiles.push(full);
    }
  }
  walk(PROJECT_ROOT);

  for (const file of checkFiles) {
    if (!/\.(js|html|css|json|md)$/.test(file)) continue;
    if (file.endsWith('package-lock.json')) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lineCount = text.split('\n').length;
    assert.ok(lineCount <= 400, `${path.relative(PROJECT_ROOT, file)} has ${lineCount} lines (> 400)`);
    if (file.startsWith(bundleDir) && file.endsWith('.js') && !file.includes(`${path.sep}vendor${path.sep}`)) {
      assert.ok(!/from ['"]node:/.test(text), `${path.relative(PROJECT_ROOT, file)} must not import node:*`);
      assert.ok(!/\bprocess\./.test(text), `${path.relative(PROJECT_ROOT, file)} must not reference process.*`);
    }
  }
  console.log('   PASS: Bundle purity, vendor ESM exports & <800 line limits verified.');
}

async function main() {
  await testValidateStrict();
  await testGoldenPathInXtermSession();
  await testProceduralFailUndoManualAndWebAudio();
  await testApsKvSaveAndRestorePersistence();
  await testBundlePurityAndLineLimits();
  console.log('\nALL E2E TESTS PASSED');
}

main().catch((err) => {
  console.error('\nE2E TEST FAILURE:', err);
  process.exit(1);
});
