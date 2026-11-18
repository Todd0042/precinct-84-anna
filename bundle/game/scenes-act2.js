import { addLog, award, addItem, triggerFail, transitionTo } from './state.js';

export function handleCrosswalk(state, cmd, output) {
  const { verb, noun } = cmd;
  if ((verb === 'look' || verb === 'inspect') && noun === 'pedestrian') {
    const pts = award(state, 'sawPedestrian', 3);
    state.flags.sawPedestrian = true;
    addLog(state, output, 'NARRATIVE', 'An ordinary, mild-mannered man in his late fifties wears a damp beige raincoat and wire-rimmed glasses. He holds a crooked black umbrella and a white bakery box from Rossi\'s Pastries tied with red baker\'s twine.');
    addLog(state, output, 'NARRATIVE', 'Halfway across, he pauses politely for a stray dog, checks a tarnished brass pocket watch, and gives you and Claire a gentle nod. Nothing anyone would ever suspect. Claire smiles softly: "Man, Rossi\'s cannolis. Haven\'t had one in months."');
    addLog(state, output, 'ALERT', 'TWO SECONDS LATER — VROOOOM! A black 1983 Monte Carlo (4X-8821) blasts straight through the red light, throwing dirty water across the crosswalk!');
    addLog(state, output, 'DIALOG', 'Claire grabs the dash: "Marcus! Plate 4X-8821—that\'s Dooley\'s BOLO! Hit Code 3 and call 10-80!"');
    state.pursuitStage = 0;
    transitionTo(
      state,
      output,
      'pursuit_active',
      ['Activate roof lights (turn on lights)', 'Activate siren (turn on siren)', 'Report pursuit (radio 10-80)'],
      ['Unit 84 surges forward into the storm behind the fleeing Monte Carlo!']
    );
    return pts ? 'hazard' : 'hazard';
  }
  if (verb === 'look' && !noun) {
    addLog(state, output, 'NARRATIVE', 'Red light at 4th & Union. A quiet commuter in a damp beige raincoat with a Rossi\'s Pastries box and crooked black umbrella crosses in front of your headlights. Try "look pedestrian".');
    return 'tick';
  }
  if (verb === 'wait' || verb === 'go') {
    state.pursuitStage = 0;
    transitionTo(state, output, 'pursuit_active', ['Activate lights & siren (code 3)', 'Report pursuit (radio 10-80)'], ['The pedestrian steps onto the curb—and a black 1983 Monte Carlo (4X-8821) blows the red light at 60 MPH!']);
    return 'hazard';
  }
  return null;
}

function maybeAdvanceFromStage0(state, output) {
  if (state.pursuitStage === 0 && state.flags.lightsOn && state.flags.sirenOn && state.flags.called1080) {
    state.pursuitStage = 1;
    state.objectives = ['Avoid the spinning fish van at 7th & Market!'];
    addLog(state, output, 'ALERT', 'STAGE 1 — 7TH & MARKET (85 MPH): Rourke clips a fish-delivery van! It spins broadside across the right and center lanes! Claire shouts: "Left lane—gap on the curb!"');
    return 'hazard';
  }
  return null;
}

export function handlePursuit(state, cmd, output) {
  const { verb, noun, code } = cmd;
  if (state.pursuitStage === 0) {
    if (verb === 'activate' && noun === 'lights') {
      const pts = award(state, 'lightsOn', 1);
      state.flags.lightsOn = true;
      addLog(state, output, 'ACTION', 'Twin red-and-blue roof strobes ignite across the wet brick buildings.');
      return maybeAdvanceFromStage0(state, output) || (pts ? 'siren' : 'tick');
    }
    if (verb === 'activate' && noun === 'siren') {
      const pts = award(state, 'sirenOn', 1);
      state.flags.sirenOn = true;
      addLog(state, output, 'ACTION', 'The Federal wail siren screams into the night rain.');
      return maybeAdvanceFromStage0(state, output) || (pts ? 'siren' : 'tick');
    }
    if (verb === 'activate' && (noun === 'code3' || code === 'code3')) {
      const p1 = award(state, 'lightsOn', 1);
      const p2 = award(state, 'sirenOn', 1);
      state.flags.lightsOn = true;
      state.flags.sirenOn = true;
      addLog(state, output, 'ACTION', 'Code 3 engaged: red/blue lightbars flashing and wail siren howling!');
      return maybeAdvanceFromStage0(state, output) || (p1 + p2 > 0 ? 'siren' : 'tick');
    }
    if (verb === 'radio' && code === '10-80') {
      const pts = award(state, 'called1080', 2);
      state.flags.called1080 = true;
      addLog(state, output, 'RADIO', '10-80 broadcast: "Dispatch, Unit 84 in high-speed pursuit of BOLO 4X-8821, southbound on Union at 75 MPH!"');
      return maybeAdvanceFromStage0(state, output) || (pts ? 'squelch' : 'tick');
    }
    if (verb === 'steer' || verb === 'go' || verb === 'pursue') {
      if (!state.flags.lightsOn || !state.flags.sirenOn) {
        return triggerFail(state, output, 'CODE 3 PURSUIT VIOLATION', 'VC-21055', 'Pursuing a fleeing felon at high speed without emergency lights and siren (Code 3) caused a blind T-bone crash at 5th Street!');
      }
      addLog(state, output, 'SYSTEM', 'Call Dispatch 10-80 on the radio before pushing past 80 MPH!');
      return 'tick';
    }
  }

  if (state.pursuitStage === 1 && verb === 'steer') {
    if (!state.flags.inspectedTires) {
      return triggerFail(state, output, 'CATASTROPHIC TIRE BLOWOUT', 'PD-104', 'Failure to perform the pre-watch tire walk-around inspection resulted in the rusted nail blowing out your front-left tire at 85 MPH!');
    }
    if (!state.flags.seatbeltOn) {
      return triggerFail(state, output, 'UNBELTED IMPACT', 'PD-108', 'Failure to fasten your safety belt threw you violently against the steering wheel during the high-speed swerve!');
    }
    if (noun === 'left') {
      const pts = award(state, 'dodgedVan', 3);
      state.flags.dodgedVan = true;
      state.pursuitStage = 2;
      state.objectives = ['Navigate through the jackknifed tanker smoke (hold lane)'];
      addLog(state, output, 'ACTION', 'You whip Unit 84 left through the gutter gap, missing the fish van\'s steel tailgate by inches!');
      addLog(state, output, 'ALERT', 'STAGE 2 — HARBOR EXPRESSWAY (95 MPH): An 18-wheeler tanker jackknifes across the wet steel viaduct! Blinding diesel smoke swallows the road—and Rourke\'s taillights vanish!');
      return pts ? 'point' : 'tick';
    }
    return triggerFail(state, output, 'VEHICULAR COLLISION', 'EVASIVE-1', 'Failing to swerve left into the open gutter lane sent Unit 84 plowing straight into the spinning fish-delivery van!');
  }

  if (state.pursuitStage === 2 && verb === 'steer') {
    if (noun === 'center' || noun === 'brake') {
      const pts = award(state, 'passedTanker', 4);
      state.flags.passedTanker = true;
      state.pursuitStage = 3;
      state.objectives = ['Track down the escaped Monte Carlo (follow tracks)'];
      addLog(state, output, 'ACTION', 'With steady hands at ten-and-two, you hold your lane blindly through the diesel smoke and clear the jackknifed rig.');
      addLog(state, output, 'NARRATIVE', 'STAGE 3 — FOUNDRY ALLEYWAYS: Rourke has vanished into the dark industrial streets. Rain drums on the hood. Near Old Rail Yard Alley #3, faint radiator steam curls above muddy tire ruts.');
      return pts ? 'point' : 'tick';
    }
    return triggerFail(state, output, 'VIADUCT GUARDRAIL PLUNGE', 'EVASIVE-2', 'Swerving wildly inside blind diesel smoke launched Unit 84 over the Harbor Expressway guardrail!');
  }

  if (state.pursuitStage === 3 && (verb === 'track' || (verb === 'look' && noun === 'tracks') || verb === 'search')) {
    const pts = award(state, 'pinnedRourke', 4);
    state.flags.pinnedRourke = true;
    addLog(state, output, 'ACTION', 'You cut the siren, sweep the spotlight down the wet cobblestones, and follow the muddy tire tracks and radiator steam straight into Dead-End Rail Yard #3!');
    addLog(state, output, 'NARRATIVE', 'Rourke\'s black Monte Carlo hydroplanes across the slick rail ties and slams nose-first into a chain-link transformer fence!');
    transitionTo(
      state,
      output,
      'felony_stop',
      [
        'Take cover & draw weapon (draw weapon)',
        'Order suspect out (order suspect out)',
        'Holster before approaching (holster weapon)',
        'Cuff, search, Mirandize, search trunk & bag evidence',
      ],
      [
        'Steam hisses from Rourke\'s crumpled hood. He kicks the door open, hand reaching inside his leather jacket!',
        'Claire flanks right behind Unit 84\'s door with her flashlight trained: "By the book, Marcus!"',
      ]
    );
    return pts ? 'siren' : 'tick';
  }

  if (verb === 'look') {
    addLog(state, output, 'NARRATIVE', `Pursuit Stage ${state.pursuitStage}: stay sharp and check your objectives.`);
    return 'tick';
  }
  return null;
}

export function handleFelonyStop(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'car' || noun === 'suspect')) {
    addLog(state, output, 'NARRATIVE', state.flags.eddieCuffed ? 'Eddie "Skids" Rourke sits handcuffed beside Unit 84.' : 'Rourke\'s wrecked Monte Carlo hisses in the rain. Red and blue lightbars pulse across the rail yard.');
    return 'tick';
  }
  if (verb === 'draw' && noun === 'weapon') {
    if (!state.flags.equippedGear) {
      return triggerFail(state, output, 'UNARMED PATROL VIOLATION', 'PD-101', 'Your hand closed on an empty hip! You rolled out of Locker #84 without equipping your duty belt and .38 revolver!');
    }
    const pts = award(state, 'drewForStop', 2);
    state.flags.weaponDrawn = true;
    state.flags.inCover = true;
    addLog(state, output, 'ACTION', 'Taking ballistic cover behind Unit 84\'s door, you draw your .38 Special while Claire backs you with her flashlight.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'order' && noun === 'suspect') {
    if (!state.flags.weaponDrawn) {
      addLog(state, output, 'SYSTEM', 'Take cover and draw your service weapon first before issuing felony commands!');
      return 'tick';
    }
    const pts = award(state, 'orderedSuspectOut', 2);
    state.flags.suspectCompliant = true;
    addLog(state, output, 'DIALOG', 'You bark over the bullhorn: "Police! Hands where I can see them! Step away and drop to your knees!" Blinded by takedowns, Rourke drops onto the gravel.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'shoot') {
    return triggerFail(state, output, 'UNJUSTIFIED DEADLY FORCE', 'IA-900', 'You fired on a suspect who had not drawn or aimed a firearm! Internal Affairs immediately suspended your badge.');
  }
  if (verb === 'holster' && noun === 'weapon') {
    if (!state.flags.suspectCompliant) {
      addLog(state, output, 'SYSTEM', 'Keep Rourke covered until he complies and drops to his knees!');
      return 'tick';
    }
    const pts = award(state, 'holsteredAfterStop', 2);
    state.flags.weaponDrawn = false;
    addLog(state, output, 'ACTION', 'With Claire covering from ten feet back, you smoothly holster your .38 Special.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'cuff' && (!noun || noun === 'suspect')) {
    if (!state.flags.suspectCompliant) {
      return triggerFail(state, output, 'FELONY STOP PROTOCOL FAILURE', 'PD-301', 'You approached an unrestrained suspect before taking cover and ordering him onto his knees! Rourke slashed out with a switchblade!');
    }
    if (state.flags.weaponDrawn) {
      return triggerFail(state, output, 'WEAPON RETENTION FAILURE', 'PD-304', 'You attempted to cuff Rourke with your .38 revolver still drawn! Holster your weapon before approaching—he grabbed the barrel!');
    }
    const pts = award(state, 'cuffedEddie', 2);
    state.flags.eddieCuffed = true;
    addLog(state, output, 'ACTION', 'Click-click. You lock steel handcuffs securely behind Eddie Rourke\'s wrists.');
    return pts ? 'cuff' : 'tick';
  }
  if (verb === 'search' && noun === 'suspect') {
    if (!state.flags.eddieCuffed) {
      return triggerFail(state, output, 'UNCUFFED SEARCH VIOLATION', 'PD-305', 'Never search a felony suspect before handcuffing him!');
    }
    const pts = award(state, 'eddieSearched', 2);
    state.flags.eddieSearched = true;
    addItem(state, 'Burner Pager (084-CHEM // RM 209)');
    addLog(state, output, 'EVIDENCE', 'You pat Rourke down: recovering a flick-blade knife and a blinking Motorola burner pager reading: "084-CHEM // RM 209".');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'miranda') {
    if (!state.flags.eddieCuffed) {
      addLog(state, output, 'SYSTEM', 'Secure and handcuff the suspect first before reading rights.');
      return 'tick';
    }
    const pts = award(state, 'mirandizedEddie', 2);
    state.flags.eddieMiranda = true;
    addLog(state, output, 'DIALOG', 'You read Eddie Rourke his Miranda Rights verbatim from your card: "You have the right to remain silent..."');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'search' && noun === 'trunk') {
    if (!state.flags.eddieCuffed) {
      addLog(state, output, 'SYSTEM', 'Cuff and secure the suspect before turning your back to search the Monte Carlo trunk!');
      return 'tick';
    }
    const pts = award(state, 'trunkSearched', 2);
    state.flags.trunkSearched = true;
    addLog(state, output, 'EVIDENCE', 'Popping the Monte Carlo trunk reveals four vacuum-sealed bricks of bright "Blue Velvet" stamped with a crown-and-anchor seal! Claire whistles softly: "Four kilos. Slam-dunk trafficking."');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'bag' || verb === 'take') && (noun === 'evidence' || noun === 'drugs' || noun === 'pager')) {
    if (!state.flags.trunkSearched || !state.flags.eddieSearched) {
      addLog(state, output, 'SYSTEM', 'Search both the suspect ("search suspect") and the trunk ("search trunk") first.');
      return 'tick';
    }
    const pts = award(state, 'baggedRourkeEvidence', 1);
    state.flags.baggedRourkeEvidence = true;
    addItem(state, '4x Blue Velvet Bricks (Sealed)');
    addLog(state, output, 'EVIDENCE', 'Chain of custody logged: you photograph and seal the four Blue Velvet bricks and burner pager into evidence bags.');
    if (state.flags.eddieMiranda) {
      transitionTo(
        state,
        output,
        'interrogation_room',
        ['Start tape recorder (turn on recorder)', 'Confront Eddie with drugs & pager (show drugs, show pager)'],
        [
          'Unit 84 rolls back to Precinct 84. Inside Interrogation Room B, a single bulb illuminates Eddie Rourke across the steel table while Sgt. Dooley watches behind the two-way glass.',
          'Claire leans coolly against the cinderblock wall beside the reel-to-reel tape recorder.',
        ]
      );
    } else {
      addLog(state, output, 'SYSTEM', 'Evidence sealed. Type "go precinct" to transport Rourke (or "read miranda" here first!).');
    }
    return pts ? 'point' : 'tick';
  }
  if (verb === 'go' && noun === 'precinct') {
    if (!state.flags.eddieCuffed || !state.flags.baggedRourkeEvidence) {
      addLog(state, output, 'SYSTEM', 'Finish cuffing Rourke and bagging the trunk evidence before transporting back to Precinct 84.');
      return 'tick';
    }
    transitionTo(state, output, 'interrogation_room', ['Turn on tape recorder', 'Verify Miranda & confront Eddie with drugs + pager'], ['You and Claire escort Eddie Rourke into Precinct 84 Interrogation Room B.']);
    return 'tick';
  }
  return null;
}

function maybeFlipEddie(state, output) {
  if (!state.flags.showedDrugs || !state.flags.showedPager) return null;
  addLog(state, output, 'DIALOG', 'Eddie Rourke cracks, his cuffed hands shaking: "Alright! Turn that pager off! I don\'t know the top bosses—I only pick up from the cooker! Marco \'The Chemist\' Vega! Room 209 at the Starlight Motor Court on Old Highway 9—he\'s clearing out before midnight!"');
  transitionTo(
    state,
    output,
    'motel_exterior',
    ['Report arrival on radio (radio 10-97)', 'Inspect Room 209 door (inspect door)', 'Step clear before knocking (stand aside, knock door)'],
    ['Twenty minutes later, Unit 84 glides dark into the rain-drenched lot of the Starlight Motor Court. Pink and cyan neon buzzes outside Room 209.']
  );
  return 'point';
}

export function handleInterrogation(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look') {
    addLog(state, output, 'NARRATIVE', 'Interrogation Room B. Sgt. Dooley watches behind the two-way mirror, Claire leans by the wall, and the reel-to-reel recorder sits beside Eddie.');
    return 'tick';
  }
  if (verb === 'activate' && noun === 'recorder') {
    const pts = award(state, 'turnedOnRecorder', 1);
    state.flags.recorderOn = true;
    addLog(state, output, 'ACTION', 'The reel-to-reel tape spins quietly, capturing full audio for the prosecution record.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'miranda') {
    const pts = award(state, 'mirandizedEddie', 2);
    state.flags.eddieMiranda = true;
    addLog(state, output, 'DIALOG', 'You read Eddie Rourke his Miranda Rights on the record and obtain a clear waiver.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'show' || verb === 'talk') {
    if (!state.flags.recorderOn) {
      return triggerFail(state, output, 'UNRECORDED INTERROGATION', 'PD-410', 'You confronted a felony suspect without turning on the interrogation tape recorder! Defense counsel moved to suppress the unverified statement.');
    }
    if (!state.flags.eddieMiranda) {
      return triggerFail(state, output, 'MIRANDA V. ARIZONA VIOLATION', 'MIRANDA-384', 'Your interrogation confession was thrown out under Miranda v. Arizona! Always Mirandize felony suspects before custodial questioning.');
    }
    if (noun === 'drugs' || noun === 'evidence') {
      const pts = award(state, 'usedDrugsInInt', 1);
      state.flags.showedDrugs = true;
      addLog(state, output, 'DIALOG', 'You drop the four Blue Velvet bricks onto the metal table. Claire leans in: "Twenty-five to life at Statesville, Eddie. Start talking."');
      return maybeFlipEddie(state, output) || (pts ? 'point' : 'tick');
    }
    if (noun === 'pager') {
      const pts = award(state, 'usedPagerInInt', 1);
      state.flags.showedPager = true;
      addLog(state, output, 'DIALOG', 'You slide the blinking Motorola pager (084-CHEM // RM 209) across the table under Eddie\'s nose.');
      return maybeFlipEddie(state, output) || (pts ? 'point' : 'tick');
    }
    addLog(state, output, 'DIALOG', 'Eddie clams up: "I found that car, Officer." Show him the drugs and pager!');
    return 'tick';
  }
  return null;
}
