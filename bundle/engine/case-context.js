/**
 * Scoped narrative context (non-spoiler), character dossiers, and Tier 2
 * intermission triggers derived from Precinct 84: Case I — Blue Velvet (STORY.md).
 */

export const CHARACTER_PROFILES = {
  marcus: 'Officer Marcus Mercer (#084): African American night-watch officer, cool under pressure, by-the-book, aiming for Narcotics Detective.',
  claire: 'Officer Claire Bellamy (#089): Sharp-witted dark-brunette partner riding shotgun in Unit 84. Supportive and observant; (secret long-arc note: only reveal suspicion subtly in Case II+, never spoil in Case I).',
  dooley: 'Sgt. Frank Dooley: Veteran Night Watch briefing supervisor pushing clean procedure for Capt. Morales.',
  eddie: 'Eddie "Skids" Rourke: Nervous wheelman of black 1983 Monte Carlo (4X-8821) moving Blue Velvet bricks for Marco Vega.',
  marco: 'Marco "The Chemist" Vega: Paranoid Blue Velvet cooker hiding in Starlight Motor Court Room 209 with a shotgun tripwire.',
  castellano: 'Victor "The Viper" Castellano: Owner of Pier 84 Cold Storage & Cannery; terrified of his silent boss.',
  raincoat: 'The Man in the Beige Raincoat: Mild-mannered mastermind with wire-rimmed glasses, crooked black umbrella, tarnished brass pocket watch, and white Rossi\'s Pastries box tied with red baker\'s twine.',
};

export const SCENE_CONTEXT = {
  precinct_briefing: {
    bullets: ['21:30 Night Watch roll call with Sgt. Dooley and partner Claire.', 'Review the Blue Velvet BOLO (black 83 Monte Carlo 4X-8821, Eddie Rourke) before heading to Locker #84.'],
    missingChecks: [
      ['gotBriefing', 'listen briefing'],
      ['readBolo', 'look blackboard'],
    ],
    nextHint: 'listen briefing, look blackboard, then go locker',
  },
  precinct_locker: {
    bullets: ['21:45 Locker Room #84.', 'Open locker #84, take your Duty Belt & Field Evidence Kit, grab Unit 84 keys off the pegboard, then go yard.'],
    missingChecks: [
      ['openedLocker', 'open locker'],
      ['equippedGear', 'take belt'],
      ['hasKeys', 'take keys'],
    ],
    nextHint: 'open locker, take belt, take keys, go yard',
  },
  precinct_yard: {
    bullets: ['21:55 Rainy Motor Pool Yard.', 'Mandatory pre-watch walk-around: check tires (catch any hazard) and trunk, enter car, fasten seatbelt, radio 10-8.'],
    missingChecks: [
      ['inspectedTires', 'inspect tires'],
      ['inspectedTrunk', 'inspect trunk'],
      ['inCar', 'enter car'],
      ['seatbeltOn', 'fasten seatbelt'],
      ['called108', 'radio 10-8'],
    ],
    nextHint: 'inspect tires, inspect trunk, enter car, fasten seatbelt, radio 10-8',
  },
  crosswalk_redlight: {
    bullets: ['22:18 Stopped at 4th & Union red light in rain.', 'Observe the polite pedestrian crossing in front of your headlights before traffic breaks loose.'],
    missingChecks: [['sawPedestrian', 'look pedestrian']],
    nextHint: 'look pedestrian',
  },
  pursuit_active: {
    bullets: ['22:19 High-speed pursuit of black 83 Monte Carlo 4X-8821.', 'Stage 0: lights, siren (Code 3) & radio 10-80. Stage 1: fish van (swerve left). Stage 2: blind diesel smoke (hold lane). Stage 3: follow tracks.'],
    missingChecks: [
      ['lightsOn', 'turn on lights'],
      ['sirenOn', 'turn on siren'],
      ['called1080', 'radio 10-80'],
    ],
    nextHint: 'lights + siren + radio 10-80 -> swerve left -> hold lane -> follow tracks',
  },
  felony_stop: {
    bullets: ['22:28 Dead-End Rail Yard #3 Felony Stop.', 'Strict 7-step order: draw weapon -> order suspect out -> holster weapon -> cuff suspect -> search suspect -> read miranda -> search trunk -> bag evidence.'],
    missingChecks: [
      ['weaponDrawn', 'draw weapon'],
      ['suspectCompliant', 'order suspect out'],
      ['eddieCuffed', 'cuff suspect'],
      ['eddieSearched', 'search suspect'],
      ['eddieMiranda', 'read miranda'],
      ['trunkSearched', 'search trunk'],
      ['baggedRourkeEvidence', 'bag evidence'],
    ],
    nextHint: 'draw weapon -> order suspect out -> holster weapon -> cuff suspect -> search -> miranda -> trunk -> bag evidence',
  },
  interrogation_room: {
    bullets: ['23:10 Interrogation Room B with Eddie Rourke.', 'Turn on tape recorder and ensure Miranda is read before confronting him with the Blue Velvet bricks and pager.'],
    missingChecks: [
      ['recorderOn', 'turn on recorder'],
      ['eddieMiranda', 'read miranda'],
      ['showedDrugs', 'show drugs'],
      ['showedPager', 'show pager'],
    ],
    nextHint: 'turn on recorder, read miranda, show drugs, show pager',
  },
  motel_exterior: {
    bullets: ['23:45 Starlight Motor Court Room 209.', 'Radio 10-97, inspect doorknob for traps, stand aside clear of the door funnel, then knock door.'],
    missingChecks: [
      ['called1097', 'radio 10-97'],
      ['inspectedMotelDoor', 'inspect door'],
      ['stoodAside', 'stand aside'],
      ['survivedTrap', 'knock door'],
    ],
    nextHint: 'radio 10-97, inspect door, stand aside, knock door',
  },
  motel_alley: {
    bullets: ['23:48 Flooded back alley pursuit of Marco Vega.', 'Corner him cleanly, cuff marco, and read miranda without unjustifiable deadly force.'],
    missingChecks: [
      ['corneredMarco', 'pursue marco'],
      ['marcoCuffed', 'cuff marco'],
      ['marcoMiranda', 'read miranda'],
    ],
    nextHint: 'pursue marco, cuff marco, read miranda',
  },
  motel_lab: {
    bullets: ['00:05 Clandestine lab inside Room 209.', 'Inspect the worktable clues, dust safe before touching, lift prints, compare prints, open safe, and decode ledger.'],
    missingChecks: [
      ['inspectedTable', 'inspect table'],
      ['dustedSafe', 'dust safe'],
      ['liftedPrints', 'lift prints'],
      ['comparedPrints', 'compare prints'],
      ['decodedLedger', 'decode ledger'],
    ],
    nextHint: 'inspect table, dust safe, lift prints, compare prints, open safe, decode ledger',
  },
  pier84_exterior: {
    bullets: ['01:25 Pier 84 Cold Storage & Cannery.', 'Call Metro SWAT with warrant HARBOR-84-OMEGA and cut the exterior alarm wires before breaching.'],
    missingChecks: [
      ['swatCalled', 'radio swat'],
      ['alarmDisabled', 'cut wires'],
      ['breachedPier', 'signal breach'],
    ],
    nextHint: 'radio swat, cut wires, signal breach',
  },
  pier84_interior: {
    bullets: ['01:32 Flashbang breach inside Pier 84.', 'Take cover behind yellow forklift, shout "police freeze" to separate surrendering workers, then return fire at the catwalk shooter.'],
    missingChecks: [
      ['pierCover', 'take cover'],
      ['announcedPolice', 'shout police freeze'],
      ['enforcerDown', 'return fire'],
    ],
    nextHint: 'take cover -> shout police freeze -> return fire',
  },
  pier84_office: {
    bullets: ['01:40 Mezzanine Office with Victor Castellano by an incinerator.', 'Order drop gun -> holster -> cuff castellano -> read miranda -> bag ledger -> inspect desk -> talk castellano -> go street.'],
    missingChecks: [
      ['castellanoDisarmed', 'order drop gun'],
      ['castellanoCuffed', 'cuff castellano'],
      ['castellanoMiranda', 'read miranda'],
      ['hasMasterLedger', 'bag ledger'],
      ['inspectedBossDesk', 'inspect desk'],
      ['castellanoConfessed', 'talk castellano'],
    ],
    nextHint: 'order drop gun -> holster weapon -> cuff castellano -> read miranda -> bag ledger -> inspect desk -> talk castellano -> go street',
  },
  pier84_street_twist: {
    bullets: ['01:50 Rainy waterfront street outside yellow tape.', 'Scan the street across the railroad tracks (look street) to spot the figure leaving one last clue.'],
    missingChecks: [['sawMastermindTwist', 'look street']],
    nextHint: 'look street',
  },
  epilogue_ceremony: {
    bullets: ['09:00 Narcotics Detective promotion & Case File #84-002.', 'Type "score" or "continue story" to launch the AI Case #84-002 sequel.'],
    missingChecks: [],
    nextHint: 'continue story (or score)',
  },
};

export const INTERMISSION_TRANSITIONS = {
  'precinct_yard->crosswalk_redlight': {
    title: 'RADIO INTERMISSION: PATROL ROLLOUT (22:08)',
    promptNote: 'Marcus and Claire roll Unit 84 out into pouring rain on Harbor Blvd. Comment briefly on whether tires and trunk were inspected cleanly, plus banter over dispatch radio.',
  },
  'interrogation_room->motel_exterior': {
    title: 'INTERMISSION: CODE 2 TO HIGHWAY 9 (23:32)',
    promptNote: 'After Eddie Rourke flipped on Marco Vega in Room B, Unit 84 speeds north in heavy rain toward Starlight Motor Court Room 209. Keep dialogue tight and tense.',
  },
  'motel_lab->pier84_exterior': {
    title: 'INTERMISSION: WARRANT HARBOR-84-OMEGA (01:05)',
    promptNote: 'Forensics matched Castellano\'s prints and decoded the 200kg shipment at Pier 84. En route in fog, Marcus and Claire prep Metro SWAT coordination.',
  },
};

export function hasIntermissionTransition(fromScene, toScene) {
  return Boolean(INTERMISSION_TRANSITIONS[`${fromScene}->${toScene}`]);
}

export function buildScopedHelpContext(state) {
  const ctx = SCENE_CONTEXT[state.scene] || { bullets: [], missingChecks: [], nextHint: 'look' };
  const f = state.flags || {};
  const missing = ctx.missingChecks.filter(([key]) => !f[key]).map(([, cmd]) => cmd);
  const done = ctx.missingChecks.filter(([key]) => Boolean(f[key])).map(([, cmd]) => cmd);
  return {
    scene: state.scene,
    score: `${state.score}/${state.maxScore}`,
    bullets: ctx.bullets,
    completedSteps: done,
    pendingSteps: missing,
    suggestedCommands: ctx.nextHint,
    inventory: state.inventory.slice(),
    recentLog: state.log.slice(-6).map((l) => `[${l.tag}] ${l.text}`),
    gameOver: state.gameOver ? `${state.gameOver.citation}: ${state.gameOver.reason}` : null,
  };
}
