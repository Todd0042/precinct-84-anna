import { addLog, award, addItem, triggerFail, transitionTo } from './state.js';

export function handleMotelExterior(state, cmd, output) {
  const { verb, noun, code } = cmd;
  if (verb === 'look' && (!noun || noun === 'room')) {
    addLog(state, output, 'NARRATIVE', 'Room 209 glows behind cheap curtains under flickering neon. A shadow paces nervously inside.');
    return 'tick';
  }
  if (verb === 'radio' && code === '10-97') {
    const pts = award(state, 'did1097', 2);
    state.flags.called1097 = true;
    addLog(state, output, 'RADIO', 'You radio Dispatch: "Unit 84 is 10-97 at Starlight Motor Court, Room 209."');
    return pts ? 'squelch' : 'tick';
  }
  if ((verb === 'inspect' || verb === 'look') && noun === 'door') {
    const pts = award(state, 'inspectedMotelDoor', 1);
    state.flags.inspectedMotelDoor = true;
    addLog(state, output, 'EVIDENCE', 'Sharp eyes! A taut copper tripwire runs from the brass doorknob into a drilled jamb hole—it\'s booby-trapped! Better stand aside before knocking.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'aside' || verb === 'cover') {
    const pts = award(state, 'stoodAsideMotel', 2);
    state.flags.stoodAside = true;
    addLog(state, output, 'ACTION', 'You motion Claire back against the solid brick wall and step completely clear of the wooden doorway\'s fatal funnel.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'knock' || verb === 'open') {
    if (!state.flags.stoodAside) {
      return triggerFail(state, output, 'BOOBY-TRAP FATALITY', 'TACTICAL-209', 'You knocked while standing square in front of Room 209! A rigged 12-gauge shotgun blasted straight through the plywood door!');
    }
    if (!state.flags.called1097) {
      addLog(state, output, 'SYSTEM', 'Log your 10-97 arrival with Dispatch ("radio 10-97") before making contact at Room 209!');
      return 'tick';
    }
    award(state, 'survivedTrap', 1);
    state.flags.survivedTrap = true;
    addLog(state, output, 'ALERT', 'BOOM! Birdshot tears a jagged hole straight through the empty wooden door inches from your shoulder! Glass shatters inside as Marco "The Chemist" Vega dives out the back bathroom window!');
    transitionTo(
      state,
      output,
      'motel_alley',
      ['Chase and corner Marco (pursue marco)', 'Handcuff & Mirandize him (cuff marco, read miranda)'],
      [
        'Claire shouts: "I\'ll swing Unit 84 around the alley mouth—cut him off, Marcus!"',
        'You vault the balcony railing into the flooded back alley behind Marco Vega!',
      ]
    );
    return 'shot';
  }
  return null;
}

export function handleMotelAlley(state, cmd, output) {
  const { verb } = cmd;
  if (verb === 'pursue' || verb === 'track') {
    const pts = award(state, 'didCornerMarco', 2);
    state.flags.corneredMarco = true;
    addLog(state, output, 'ACTION', 'Unit 84\'s headlights flood the far mouth of the alley as Claire boxes him in! You tackle Vega against the chain-link fence and knock a derringer clear from his coat.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'shoot') {
    return triggerFail(state, output, 'DEADLY FORCE VIOLATION', 'IA-902', 'You fired on a fleeing suspect without warning or confirming an aimed lethal weapon!');
  }
  if (verb === 'cuff') {
    if (!state.flags.corneredMarco) {
      return triggerFail(state, output, 'SUSPECT ESCAPED', 'TACTICAL-211', 'Vega is forty feet ahead sprinting toward a getaway van—pursue and corner him first!');
    }
    const pts = award(state, 'didCuffMarco', 1);
    state.flags.marcoCuffed = true;
    addLog(state, output, 'ACTION', 'You snap handcuffs onto Marco "The Chemist" Vega while Claire covers.');
    return pts ? 'cuff' : 'tick';
  }
  if (verb === 'miranda') {
    if (!state.flags.marcoCuffed) {
      addLog(state, output, 'SYSTEM', 'Cuff Marco Vega before reading his rights.');
      return 'tick';
    }
    const pts = award(state, 'marcoMiranda', 1);
    state.flags.marcoMiranda = true;
    addLog(state, output, 'DIALOG', 'You read Marco Vega his Miranda Rights and pass him to the arriving transport wagon.');
    transitionTo(
      state,
      output,
      'motel_lab',
      [
        'Inspect the worktable (inspect table)',
        'Process wall safe: dust safe -> lift prints -> compare prints -> open safe -> decode ledger',
      ],
      ['Inside Room 209, portable fans hum over beakers, blue dye, and a crooked velvet painting on the wall.']
    );
    return pts ? 'point' : 'tick';
  }
  if (verb === 'look') {
    addLog(state, output, 'NARRATIVE', 'Flooded motel alley. Marco Vega is trapped between you and Claire\'s headlights.');
    return 'tick';
  }
  return null;
}

export function handleMotelLab(state, cmd, output) {
  const { verb, noun } = cmd;
  if (verb === 'look' && (!noun || noun === 'room')) {
    addLog(state, output, 'NARRATIVE', 'Chemical flasks bubble on the worktable beside some odd crumbs. A crooked velvet painting hangs over a recessed wall safe.');
    return 'tick';
  }
  if ((verb === 'inspect' || verb === 'look') && noun === 'table') {
    const pts = award(state, 'inspectedTable', 2);
    state.flags.inspectedTable = true;
    addLog(state, output, 'EVIDENCE', 'Beside Vega\'s coffee mug sits a short scrap of red baker\'s twine and powdered cannoli sugar crumbs. Strange late-night delivery for a paranoid chemist in a thunderstorm.');
    return pts ? 'point' : 'tick';
  }
  if ((verb === 'inspect' || verb === 'look') && noun === 'painting') {
    state.flags.foundSafe = true;
    addLog(state, output, 'ACTION', 'Swinging aside the crooked velvet painting reveals a steel wall safe! Don\'t touch the handle bare-handed—dust it for prints first.');
    return 'tick';
  }
  if (verb === 'dust' && (!noun || noun === 'safe')) {
    state.flags.foundSafe = true;
    const pts = award(state, 'didDustSafe', 2);
    state.flags.dustedSafe = true;
    addLog(state, output, 'EVIDENCE', 'Using the Evidence Kit brush and gray powder, you reveal crisp latent prints on the safe dial handle.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'lift' && (!noun || noun === 'prints')) {
    if (!state.flags.dustedSafe) {
      addLog(state, output, 'SYSTEM', 'Dust the safe handle with fingerprint powder first ("dust safe").');
      return 'tick';
    }
    const pts = award(state, 'didLiftPrints', 2);
    state.flags.liftedPrints = true;
    addItem(state, 'Latent Print Card (#209-SAFE)');
    addLog(state, output, 'EVIDENCE', 'You carefully lift a clean latent thumbprint onto an evidence card.');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'compare' && (!noun || noun === 'prints')) {
    if (!state.flags.liftedPrints) {
      addLog(state, output, 'SYSTEM', 'Lift the latent print onto a card first ("lift prints").');
      return 'tick';
    }
    const pts = award(state, 'didComparePrints', 2);
    state.flags.comparedPrints = true;
    addLog(state, output, 'EVIDENCE', 'AFIS / Precinct teleprinter match confirmed: Marco Vega AND Victor "The Viper" Castellano—owner of Pier 84 Cold Storage & Cannery!');
    return pts ? 'point' : 'tick';
  }
  if (verb === 'open' && noun === 'safe') {
    if (!state.flags.liftedPrints) {
      addLog(state, output, 'SYSTEM', 'Do not touch the safe handle yet—you\'ll smudge the latent prints! Run "dust safe" and "lift prints" first.');
      return 'tick';
    }
    state.flags.openedSafe = true;
    addLog(state, output, 'ACTION', 'You crack open the unlocked safe and extract a waterproof coded shipping ledger.');
    return 'tick';
  }
  if ((verb === 'decode' || verb === 'inspect' || verb === 'read') && noun === 'ledger') {
    if (!state.flags.comparedPrints) {
      addLog(state, output, 'SYSTEM', 'Finish dusting, lifting, and comparing the safe prints before pulling the ledger.');
      return 'tick';
    }
    state.flags.openedSafe = true;
    const pts = award(state, 'didDecodeLedger', 2);
    state.flags.decodedLedger = true;
    state.flags.warrantCode = 'HARBOR-84-OMEGA';
    addItem(state, 'Coded Ledger (Warrant HARBOR-84-OMEGA)');
    addLog(state, output, 'EVIDENCE', 'Cipher decoded! Two hundred kilos of Blue Velvet packed in frozen halibut crates are loading at Pier 84 Cold Storage at 02:00 hours tonight under Bill-of-Lading / Warrant Code: HARBOR-84-OMEGA.');
    addLog(state, output, 'DIALOG', 'Claire eyes the clock: "01:25 already! That\'s the main artery, Marcus—let\'s shut Castellano down!"');
    transitionTo(
      state,
      output,
      'pier84_exterior',
      ['Request SWAT & warrant backup (radio swat)', 'Disable perimeter alarm (cut wires)', 'Signal breach (signal breach)'],
      ['Harbor fog blankets Pier 84 Cold Storage & Cannery. Armed cartel lookouts pace the upper loading dock catwalk.']
    );
    return pts ? 'point' : 'tick';
  }
  return null;
}
