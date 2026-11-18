import { addLog, award, addItem, transitionTo } from './state.js';

export function handleBriefing(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'room' || noun === 'briefing')) {
    addLog(state, output, 'NARRATIVE', 'Sgt. Dooley stands beside the chalkboard. Claire whispers to check the BOLO before heading to Locker #84.');
    return 'tick';
  }
  if ((verb === 'listen' || verb === 'talk') && (!noun || noun === 'briefing')) {
    const pts = award(state, 'gotBriefing', 2);
    state.flags.gotBriefing = true;
    addLog(state, output, 'DIALOG', 'Sgt. Dooley: "Two more harbor kids hit Mercy General tonight from \'Blue Velvet\'—synthetic heroin stamped with a crown-and-anchor. Watch for Eddie \'Skids\' Rourke in a black \'83 Monte Carlo, plate 4X-8821."');
    addLog(state, output, 'DIALOG', 'Dooley nods at you and Claire: "Capt. Morales has a Narcotics Detective gold shield opening next month. Go strictly by the book tonight, Mercer."');
    state.objectives = [state.flags.readBolo ? 'Head to Locker Room (go locker)' : 'Read the BOLO board (look blackboard)'];
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'look' || verb === 'read' || verb === 'inspect') && noun === 'blackboard') {
    const pts = award(state, 'readBolo', 2);
    state.flags.readBolo = true;
    addLog(state, output, 'EVIDENCE', 'You jot down the BOLO in your pocket pad: 1983 Black Chevy Monte Carlo | Plate: 4X-8821 | Suspect: Eddie "Skids" Rourke.');
    state.objectives = ['Head to Locker Room (go locker)'];
    return pts ? 'point' : 'tick';
  }
  if (verb === 'go' && noun === 'locker') {
    if (!state.flags.gotBriefing) {
      addLog(state, output, 'SYSTEM', 'Roll call is still underway—listen to Sgt. Dooley first ("listen briefing").');
      return 'tick';
    }
    transitionTo(
      state,
      output,
      'precinct_locker',
      ['Open Locker #84 (open locker)', 'Equip belt & Evidence Kit (take belt)', 'Grab Unit 84 keys (take keys)', 'Go to motor pool (go yard)'],
      [
        'Claire heads upstairs to log the patrol sheet: "Meet you by Cruiser 84 in five, partner."',
        'Inside the locker room stand rows of gray steel lockers. Locker #84 faces the key pegboard.',
      ]
    );
    return 'tick';
  }
  return null;
}

export function handleLocker(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'room' || noun === 'locker')) {
    addLog(
      state,
      output,
      'NARRATIVE',
      state.flags.openedLocker
        ? 'Locker #84 stands open beside the Cruiser #84 ignition key pegboard.'
        : 'Steel Locker #84 is latched shut. Unit 84 keys hang on the wall pegboard.'
    );
    return 'tick';
  }
  if (verb === 'open' && noun === 'locker') {
    const pts = award(state, 'openedLocker', 1);
    state.flags.openedLocker = true;
    addLog(state, output, 'NARRATIVE', 'You swing open Locker #84, revealing your Duty Belt (.38 Special, handcuffs, Motorola HT-220 portable radio, PR-24 baton, notebook) and Field Evidence Kit.');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'equip' || verb === 'take') && (noun === 'belt' || noun === 'kit' || noun === 'weapon')) {
    if (!state.flags.openedLocker) {
      addLog(state, output, 'SYSTEM', 'Locker #84 is closed. Try "open locker" first.');
      return 'tick';
    }
    const pts = award(state, 'equippedGear', 4);
    state.flags.equippedGear = true;
    addItem(state, 'Duty Belt (.38, Cuffs, Radio, Baton)');
    addItem(state, 'Field Evidence Kit');
    addLog(state, output, 'ACTION', 'Equipped Duty Belt (loaded .38 Special, steel handcuffs, Motorola HT-220 portable radio, PR-24 baton, pad) and Field Evidence Kit.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'take' && noun === 'keys') {
    const pts = award(state, 'hasKeys', 2);
    state.flags.hasKeys = true;
    addItem(state, 'Unit 84 Ignition & Trunk Keys');
    addLog(state, output, 'ACTION', 'You grab Patrol Unit 84 ignition and trunk keys off the pegboard.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'go' && noun === 'yard') {
    transitionTo(
      state,
      output,
      'precinct_yard',
      ['Walk-around: inspect tires & trunk', 'Get in cruiser (enter car)', 'Fasten seatbelt', 'Call in service (radio 10-8)'],
      [
        'Stepping out into the pouring rain, Patrol Unit 84 idles beneath a sodium floodlight.',
        'Claire waits by the passenger door with two clipboards: "Rain\'s coming down hard, Marcus. Ready for your walk-around?"',
      ]
    );
    return 'tick';
  }
  return null;
}

export function handleYard(state, cmd, output) {
  const { verb, noun, code } = cmd;
  if (verb === 'look' && (!noun || noun === 'yard' || noun === 'car')) {
    addLog(state, output, 'NARRATIVE', 'Unit 84 gleams in the floodlight rain. Academy rules require inspecting the tires and trunk before hitting the street.');
    return 'tick';
  }
  if ((verb === 'inspect' || verb === 'look') && (noun === 'tires' || noun === 'car')) {
    const pts = award(state, 'inspectedTires', 4);
    state.flags.inspectedTires = true;
    addLog(state, output, 'EVIDENCE', 'Good catch! Kneeling by the front-left wheel, your beam hits a rusted roofing nail wedged against the valve stem! The motor pool mechanic swaps on a fresh spare immediately.');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'inspect' || verb === 'search' || verb === 'open') && noun === 'trunk') {
    const pts = award(state, 'inspectedTrunk', 2);
    state.flags.inspectedTrunk = true;
    addLog(state, output, 'ACTION', 'You inspect Unit 84\'s trunk: road flares, first-aid kit, and shotgun lock are all accounted for.');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'enter' || verb === 'go') && noun === 'car') {
    if (!state.flags.hasKeys) {
      addLog(state, output, 'SYSTEM', 'You left Unit 84\'s keys back in the locker room! Go back ("go locker") and "take keys".');
      return 'tick';
    }
    const pts = award(state, 'inCar', 1);
    state.flags.inCar = true;
    addLog(state, output, 'ACTION', 'You slide behind the steering wheel of Unit 84 while Claire settles into the passenger seat.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'go' && noun === 'locker') {
    transitionTo(state, output, 'precinct_locker', ['Collect missing locker gear or keys'], ['You jog back inside the precinct locker room.']);
    return 'tick';
  }
  if (verb === 'fasten' && noun === 'seatbelt') {
    if (!state.flags.inCar) {
      addLog(state, output, 'SYSTEM', 'Climb inside Unit 84 first ("enter car").');
      return 'tick';
    }
    const pts = award(state, 'seatbeltOn', 1);
    state.flags.seatbeltOn = true;
    addLog(state, output, 'ACTION', 'Click. Seatbelt fastened strictly per Academy code.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'radio' && code === '10-8') {
    if (!state.flags.inCar) {
      addLog(state, output, 'SYSTEM', 'Get inside Unit 84 before keying the dash radio ("enter car").');
      return 'tick';
    }
    award(state, 'called108', 1);
    state.flags.called108 = true;
    addLog(state, output, 'RADIO', 'Claire keys the Motorola mic: "Dispatch, Unit 84—Mercer and Bellamy—is 10-8, rolling out on East Harbor patrol."');
    transitionTo(
      state,
      output,
      'crosswalk_redlight',
      ['Observe the intersection and crosswalk (look pedestrian)'],
      [
        'You roll Unit 84 out onto rain-slicked 4th & Union and stop for a red traffic signal.',
        'Wipers thump rhythmically across the glass. An ordinary pedestrian carrying a white bakery box and umbrella steps into the crosswalk ahead of your headlights.',
      ]
    );
    return 'squelch';
  }
  return null;
}
