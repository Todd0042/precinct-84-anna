import { addLog, award, addItem, triggerFail, transitionTo } from './state.js';

export function handlePierExterior(state, cmd, output) {
  const { verb, noun, code } = cmd;
  if (verb === 'look') {
    addLog(state, output, 'NARRATIVE', 'Corrugated steel warehouse at Pier 84. Armed cartel guards patrol above the loading dock. A red exterior alarm junction box hums near the side door.');
    return 'tick';
  }
  if (verb === 'radio' && (code === 'swat' || code === 'backup' || noun === 'swat')) {
    const pts = award(state, 'didSwat', 3);
    state.flags.swatCalled = true;
    addLog(state, output, 'RADIO', `You transmit Warrant Code ${state.flags.warrantCode} to Sgt. Dooley and Metro SWAT. Tactical vans glide into position dark, sniper lasers tracking the catwalk.`);
    return pts ? 'squelch' : 'tick';
  }
  if (verb === 'cut' && (noun === 'wires' || noun === 'alarm')) {
    if (!state.flags.swatCalled) {
      addLog(state, output, 'SYSTEM', 'Get Metro SWAT on perimeter first ("radio swat") before creeping up to the alarm box!');
      return 'tick';
    }
    const pts = award(state, 'didDisableAlarm', 2);
    state.flags.alarmDisabled = true;
    addLog(state, output, 'ACTION', 'While Claire covers you with her .38, you snip the perimeter alarm wire cleanly.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'breach' || (verb === 'go' && noun === 'pier')) {
    if (!state.flags.swatCalled) {
      return triggerFail(state, output, 'SOLO BREACH AMBUSH', 'TACTICAL-840', 'You attempted to breach an armed cartel fortress without Metro SWAT backup! Catwalk gunmen pinned and overwhelmed you!');
    }
    if (!state.flags.alarmDisabled) {
      return triggerFail(state, output, 'ALARM COMPROMISED', 'TACTICAL-842', 'Breaching before disabling the exterior alarm box warned Castellano upstairs—he incinerated the Master Ledger before you reached the door!');
    }
    award(state, 'didBreach', 2);
    state.flags.breachedPier = true;
    addLog(state, output, 'ALERT', 'Flashbangs thunder through Pier 84\'s cargo doors! SWAT storms the perimeter as you and Claire push onto the processing floor!');
    transitionTo(
      state,
      output,
      'pier84_interior',
      ['Take cover behind forklift (take cover)', 'Challenge occupants (shout police freeze)', 'Neutralize armed catwalk threat (return fire)'],
      ['Blue Velvet chemical vats line the cavernous floor beneath steel catwalks. A yellow forklift sits ahead while figures scramble through the flashbang smoke!']
    );
    return 'shot';
  }
  return null;
}

export function handlePierInterior(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'cover') {
    const pts = award(state, 'didPierCover', 2);
    state.flags.pierCover = true;
    addLog(state, output, 'ACTION', 'You and Claire dive behind the steel counterweight of a parked yellow forklift.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'shout' && noun === 'freeze') {
    if (!state.flags.pierCover) {
      return triggerFail(state, output, 'EXPOSED IN CROSSFIRE', 'TACTICAL-845', 'You challenged the room while standing completely exposed in the open aisle! Catwalk gunfire struck you down.');
    }
    award(state, 'didAnnounce', 2);
    state.flags.announcedPolice = true;
    addLog(state, output, 'DIALOG', '"POLICE! FREEZE! DROP YOUR WEAPONS!" Two terrified lab assistants drop to their knees with hands up—hold fire! Suddenly, Castellano\'s enforcer opens fire from the upper catwalk, pinning Claire behind a pillar!');
    return 'shot';
  }
  if (verb === 'shoot') {
    if (!state.flags.pierCover) {
      return triggerFail(state, output, 'EXPOSED IN CROSSFIRE', 'TACTICAL-846', 'Returning fire from an uncovered aisle left you exposed to catwalk gunfire!');
    }
    if (!state.flags.announcedPolice) {
      return triggerFail(state, output, 'USE-OF-FORCE VIOLATION', 'IA-910', 'You discharged your weapon before shouting "Police Freeze" or identifying unarmed threats—shooting a surrendering lab worker!');
    }
    award(state, 'didDropEnforcer', 2);
    state.flags.enforcerDown = true;
    addLog(state, output, 'ACTION', 'Deadly force authorized! You fire two controlled rounds up at the catwalk shooter, neutralizing the gunman and clearing the stairs for Claire and SWAT!');
    transitionTo(
      state,
      output,
      'pier84_office',
      [
        'Disarm Castellano (order drop gun)',
        'Holster, cuff, Mirandize & rescue Master Ledger (bag ledger)',
        'Inspect Castellano\'s desk & talk to him (inspect desk, talk castellano)',
        'Escort him outside (go street)',
      ],
      ['You and Claire burst into the glass-walled mezzanine office overlooking the harbor. Beside a roaring oil-drum incinerator, Victor "The Viper" Castellano clutches a chrome .45 and the Master Syndicate Ledger!']
    );
    return 'shot';
  }
  if (verb === 'look') {
    addLog(state, output, 'NARRATIVE', 'Smoky processing floor of Pier 84. Take cover behind the forklift and challenge cleanly.');
    return 'tick';
  }
  return null;
}

export function handlePierOffice(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'room')) {
    addLog(state, output, 'NARRATIVE', 'Mezzanine office overlooking Pier 84. Incinerator flames crackle beside a mahogany desk holding a teacup, pastry box, and the Master Ledger.');
    return 'tick';
  }
  if ((verb === 'order' && noun === 'drop') || (verb === 'draw' && noun === 'weapon')) {
    const pts = award(state, 'didDisarmBoss', 2);
    state.flags.castellanoDisarmed = true;
    state.flags.weaponDrawn = true;
    addLog(state, output, 'DIALOG', 'You and Claire train your .38s dead center as SWAT sniper lasers paint his chest: "Drop the .45 and step back from the drum, Victor!" Castellano curses and drops the pistol.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'shoot') {
    return triggerFail(state, output, 'EXCESSIVE DEADLY FORCE', 'IA-920', 'Castellano had not fired and SWAT snipers already had him boxed. Verbal disarmament was mandatory!');
  }
  if (verb === 'holster' && noun === 'weapon') {
    if (!state.flags.castellanoDisarmed) {
      addLog(state, output, 'SYSTEM', 'Disarm Castellano first ("order drop gun")!');
      return 'tick';
    }
    const pts = award(state, 'didHolsterOffice', 1);
    state.flags.weaponDrawn = false;
    addLog(state, output, 'ACTION', 'Claire keeps Castellano covered as you smoothly holster your .38.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'cuff' && (!noun || noun === 'castellano' || noun === 'suspect')) {
    if (!state.flags.castellanoDisarmed) {
      return triggerFail(state, output, 'ARMED SUSPECT', 'PD-850', 'You charged Castellano while he still held a cocked .45 automatic!');
    }
    if (state.flags.weaponDrawn) {
      return triggerFail(state, output, 'WEAPON RETENTION FAILURE', 'PD-304', 'Holster your revolver before cuffing Castellano!');
    }
    const pts = award(state, 'didCuffBoss', 1);
    state.flags.castellanoCuffed = true;
    addLog(state, output, 'ACTION', 'Click-click. Victor "The Viper" Castellano is in handcuffs.');
    return pts ? 'cuff' : 'tick';
  }
  if (verb === 'miranda') {
    if (!state.flags.castellanoCuffed) {
      addLog(state, output, 'SYSTEM', 'Cuff Castellano before reading Miranda Rights.');
      return 'tick';
    }
    const pts = award(state, 'didMirandaBoss', 1);
    state.flags.castellanoMiranda = true;
    addLog(state, output, 'DIALOG', 'You read Victor Castellano his Miranda Rights verbatim.');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'bag' || verb === 'take') && (noun === 'ledger' || noun === 'evidence')) {
    if (!state.flags.castellanoCuffed) {
      addLog(state, output, 'SYSTEM', 'Secure Castellano in cuffs first before turning toward the incinerator.');
      return 'tick';
    }
    const pts = award(state, 'didBagLedger', 2);
    state.flags.hasMasterLedger = true;
    addItem(state, 'Master Syndicate Ledger (Sealed)');
    addLog(state, output, 'EVIDENCE', 'You snatch the Master Syndicate Ledger off the rim of the roaring incinerator and seal it into evidence! Claire claps your shoulder: "Two hundred kilos and the master books! Gold shield\'s yours, Marcus!"');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'inspect' || verb === 'look') && noun === 'desk') {
    const pts = award(state, 'didInspectDesk', 1);
    state.flags.inspectedBossDesk = true;
    addLog(state, output, 'EVIDENCE', 'Claire steps onto the catwalk to wave up SWAT. On Castellano\'s mahogany desk sits a second porcelain teacup—still steaming—next to an untied white Rossi\'s Pastries box, a curl of red baker\'s twine, and round wet umbrella drops leading toward the rear fire stairs!');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'talk' && (!noun || noun === 'castellano')) {
    if (!state.flags.castellanoCuffed) {
      addLog(state, output, 'SYSTEM', 'Secure Castellano in handcuffs first.');
      return 'tick';
    }
    const pts = award(state, 'didTalkBoss', 1);
    state.flags.castellanoConfessed = true;
    addLog(state, output, 'DIALOG', 'Castellano stares toward the street, trembling: "You think I run this city, Mercer? He was sitting across my desk ten minutes ago eating a pastry, checking that damn brass pocket watch! He told me two polite beat cops in Unit 84 stopped at 4th & Union tonight just to let him cross the street before Rourke\'s car blew the light!"');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'go' && noun === 'street') {
    if (!state.flags.castellanoCuffed || !state.flags.castellanoMiranda || !state.flags.hasMasterLedger) {
      addLog(state, output, 'SYSTEM', 'Before exiting Pier 84, make sure Castellano is cuffed, Mirandized, and the Master Ledger is bagged!');
      return 'tick';
    }
    transitionTo(
      state,
      output,
      'pier84_street_twist',
      ['Scan the crowd beyond the crime-scene tape (look street)'],
      [
        'You and Claire escort a shaken Castellano down the metal stairs and out into the pulsing red-and-blue squad lights.',
        'Yellow "POLICE LINE — DO NOT CROSS" tape stretches across the rain-slicked waterfront street.',
      ]
    );
    return 'siren';
  }
  return null;
}

export function handlePierStreetTwist(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'street' || noun === 'pedestrian')) {
    award(state, 'sawMastermindTwist', 2);
    state.flags.sawMastermindTwist = true;
    addItem(state, "Red Baker's Twine (Case #84-002)");
    state.victory = true;

    addLog(state, output, 'NARRATIVE', 'Across the railroad tracks under a flickering amber streetlamp stands the exact same mild-mannered man in the damp beige raincoat with the crooked black umbrella—no pastry box now. Through the strobe glare, he clicks shut his tarnished brass pocket watch and gives you that exact same polite nod.');
    addLog(state, output, 'ALERT', 'You shout to Claire—"Across the tracks! The guy in the beige raincoat from 4th & Union!"—and vault the tape as a roaring harbor freight train cuts across the grade crossing! Ten seconds later, the caboose clears. Only a wet piece of red baker\'s twine clings to the storm drain.');
    addLog(state, output, 'DIALOG', 'Claire stares into the fog beside you: "Gone... Who the hell was that, Marcus?"');

    transitionTo(
      state,
      output,
      'epilogue_ceremony',
      ['Case I Complete! Review commendation & Case File #84-002'],
      [
        '09:00 HRS NEXT MORNING — PRECINCT 84 ASSEMBLY HALL: Captain Morales pins the Narcotics Detective Gold Shield onto your lapel as Sgt. Dooley and Officer Claire Bellamy applaud from the front row!',
        'Upstairs at your new desk, Claire drops off two coffees and a white Rossi\'s Pastries bag ("Victory cannoli, Detective"). Alone, you lock the red baker\'s twine inside a blank folder labeled: CASE FILE #84-002 // "THE MAN AT THE CROSSWALK". TO BE CONTINUED IN CASE II...',
      ]
    );
    return 'victory';
  }
  return null;
}

export function handleEpilogue(state, cmd, output) {
  if (cmd.verb === 'look' || cmd.verb === 'score') {
    addLog(state, output, 'SCENE', `FINAL EVALUATION: ${state.score}/${state.maxScore} — NARCOTICS DETECTIVE MARCUS MERCER (#084). CASE FILE #84-002 AWAITS.`);
    return 'tick';
  }
  return null;
}
