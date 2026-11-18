import { PAL } from '../gfx/svga-palette.js';

const CORE_CAST = {
  marcus: {
    id: 'marcus', name: 'Marcus Mercer (#084)', shortName: 'MARCUS #084', gender: 'male', role: 'Night-watch officer / Narcotics Detective',
    skin: 'marcus', hair: 'black', hairStyle: 'short', hat: 'cop_cap', badge: true,
    attireColor: PAL.COP_NAVY, attireShade: PAL.COP_DARK, pantsColor: PAL.COP_DARK,
  },
  claire: {
    id: 'claire', name: 'Claire Bellamy (#089)', shortName: 'CLAIRE #089', gender: 'female', role: 'Partner in Unit 84; complex loyalty & hidden dispatch links',
    skin: 'claire', hair: 'brunette', hairStyle: 'ponytail', hat: 'cop_cap', badge: true, slim: true,
    attireColor: PAL.COP_NAVY, attireShade: PAL.COP_DARK, pantsColor: PAL.COP_DARK,
  },
  dooley: {
    id: 'dooley', name: 'Sgt. Frank Dooley', shortName: 'SGT DOOLEY', gender: 'male', role: 'Veteran Night Watch supervisor demanding by-the-book procedure',
    skin: 'weathered', hair: 'silver', hairStyle: 'short', mustache: true, hat: null, badge: true,
    attireColor: PAL.COP_NAVY, attireShade: PAL.COP_DARK, pantsColor: PAL.COP_DARK,
  },
  morales: {
    id: 'morales', name: 'Capt. Morales', shortName: 'CAPT MORALES', gender: 'male', role: 'Precinct 84 Commander & Internal Affairs liaison',
    skin: 'olive', hair: 'black', hairStyle: 'short', mustache: true, glasses: true, badge: true,
    attireColor: PAL.SUIT_DARK, attireShade: PAL.VOID, pantsColor: PAL.SUIT_DARK,
  },
  raincoat_man: {
    id: 'raincoat_man', name: 'The Man in the Beige Raincoat', shortName: 'RAINCOAT MAN', gender: 'male', role: 'Quiet mastermind carrying a tarnished brass watch & Rossi\'s twine',
    skin: 'fair', hair: 'silver', hairStyle: 'short', glasses: true, longCoat: true, belt: true,
    attireColor: PAL.TRENCH_COAT, attireShade: PAL.TRENCH_SHADE, pantsColor: PAL.TRENCH_SHADE,
  },
  eddie: {
    id: 'eddie', name: 'Eddie "Skids" Rourke', shortName: 'EDDIE ROURKE', gender: 'male', role: 'Nervous Monte Carlo courier for Blue Velvet',
    skin: 'fair', hair: 'black', hairStyle: 'short', belt: false,
    attireColor: PAL.WOOD_DARK, attireShade: '#261409', pantsColor: PAL.SUIT_DARK,
  },
  marco: {
    id: 'marco', name: 'Marco "The Chemist" Vega', shortName: 'MARCO VEGA', gender: 'male', role: 'Paranoid Room 209 drug chemist',
    skin: 'olive', hair: 'black', hairStyle: 'short', mustache: true, belt: false,
    attireColor: '#1b5830', attireShade: '#10361c', pantsColor: PAL.SUIT_DARK,
  },
  castellano: {
    id: 'castellano', name: 'Victor "The Viper" Castellano', shortName: 'CASTELLANO', gender: 'male', role: 'Pier 84 Cold Storage kingpin terrified of his silent boss',
    skin: 'fair', hair: 'silver', hairStyle: 'short', belt: false, longCoat: true,
    attireColor: PAL.SUIT_DARK, attireShade: PAL.VOID, pantsColor: PAL.SUIT_DARK,
  },
};

// 52 Compact Archetype Recipes -> Total 60 rich distinct characters
const EXTRA_SPECS = [
  ['ia_vance', 'IA Agent Morgan Vance', 'Internal Affairs auditor', 'fair', 'blonde', 'short', 0, 1, 0, PAL.SUIT_MID],
  ['lt_malone', 'Lt. Jack Malone', 'Corrupt Vice Division officer', 'weathered', 'silver', 'short', 1, 0, 1, PAL.SUIT_DARK],
  ['clerk_mills', 'Dispatcher Dana Mills', 'Precinct 84 radio dispatcher', 'claire', 'redhead', 'ponytail', 0, 1, 1, PAL.COP_NAVY],
  ['commissioner_hayes', 'Arthur Hayes', 'Harbor Authority Commissioner', 'fair', 'silver', 'short', 1, 1, 0, PAL.SUIT_DARK],
  ['elena_rodriguez', 'Elena Vasquez', 'Investigative harbor reporter', 'olive', 'brunette', 'long', 0, 0, 0, PAL.TRENCH_COAT],
  ['snitch_ticks', 'Tommy "Ticks" Moran', 'Dockside street informant', 'weathered', 'black', 'short', 0, 0, 0, PAL.WALL_LIGHT],
  ['bartender_sal', 'Sal Benedetti', 'O\'Malley\'s Dive Bar owner', 'olive', 'silver', 'short', 1, 0, 0, PAL.WHITE_SHIRT],
  ['motel_clerk', 'Nadine Kowalski', 'Starlight Motor Court night clerk', 'claire', 'blonde', 'long', 0, 1, 0, PAL.SILK_PLUM],
  ['attorney_kane', 'Evelyn Kane', 'Mob defense attorney', 'fair', 'black', 'long', 0, 0, 0, PAL.CRIMSON],
  ['marcus_offduty', 'Marcus (Off-Duty)', 'Marcus in private clothes / bedroom scenes', 'marcus', 'black', 'short', 0, 0, 0, PAL.SUIT_MID],
  ['claire_offduty', 'Claire (Off-Duty)', 'Claire in evening coat / apartment scenes', 'claire', 'brunette', 'long', 0, 0, 0, PAL.ROBE_SILK, true],
  ['lounge_veronica', 'Veronica Thorne', 'Midnight jazz singer linked to Castellano', 'fair', 'redhead', 'long', 0, 0, 0, PAL.ROBE_SILK, true],
  ['swat_cole', 'Sgt. Derek Cole', 'Metro SWAT tactical team leader', 'deep', 'black', 'short', 0, 0, 1, '#121820'],
  ['forensic_chen', 'Dr. Lin Chen', 'Precinct 84 crime lab toxicologist', 'fair', 'black', 'ponytail', 0, 1, 0, PAL.WHITE_SHIRT],
  ['judge_sterling', 'Judge Walter Sterling', 'Night magistrate signing warrants', 'fair', 'silver', 'short', 1, 1, 0, PAL.VOID],
  ['enforcer_gallo', 'Rocco Gallo', 'Pier 84 armed catwalk enforcer', 'weathered', 'black', 'short', 1, 0, 0, PAL.SUIT_DARK],
  ['union_brennan', 'Pat Brennan', 'Longshoremen steward hiding manifests', 'weathered', 'redhead', 'short', 1, 0, 0, PAL.BRICK_MID],
  ['mechanic_ozzie', 'Ozzie Delgado', 'Motor pool garage chief mechanic', 'olive', 'black', 'short', 1, 0, 0, PAL.STEEL_MID],
  ['detective_park', 'Det. Hannah Park', 'Narcotics transfer liaison', 'fair', 'black', 'long', 0, 0, 1, PAL.TRENCH_COAT],
  ['chef_rossi', 'Matteo Rossi', 'Owner of Rossi\'s Pastries', 'olive', 'silver', 'short', 1, 0, 0, PAL.WHITE_SHIRT],
  ['courier_miles', 'Miles Vance-Jr', 'Subway stash runner', 'deep', 'black', 'short', 0, 0, 0, PAL.WALL_SLATE],
  ['witness_sara', 'Sara Lindqvist', 'Safehouse protected accountant', 'claire', 'blonde', 'long', 0, 1, 0, PAL.ROBE_SILK, true],
  ['broker_stein', 'Sidney Stein', 'Offshore money launderer', 'fair', 'silver', 'short', 0, 1, 0, PAL.SUIT_MID],
  ['capt_harbor', 'Capt. Halvor Berg', 'Norwegian freight trawler captain', 'weathered', 'blonde', 'short', 1, 0, 0, PAL.COP_DARK],
  ['paramedic_ruth', 'Ruth Alvarez', 'Harbor EMS paramedic', 'olive', 'brunette', 'ponytail', 0, 0, 0, PAL.COP_NAVY],
  ['rookie_dan', 'Officer Dan Miller', 'Probationary rookie officer', 'fair', 'blonde', 'short', 0, 0, 1, PAL.COP_NAVY],
  ['vice_carmen', 'Det. Carmen Ortiz', 'Undercover Vice operative', 'olive', 'black', 'long', 0, 0, 0, PAL.SILK_PLUM],
  ['coroner_graves', 'Dr. Silas Graves', 'County morgue medical examiner', 'fair', 'silver', 'short', 0, 1, 0, PAL.STEEL_LIT],
  ['baker_twin', 'Rosa Rossi', 'Night shift cashier at Rossi\'s', 'olive', 'brunette', 'ponytail', 0, 0, 0, PAL.BED_LINEN],
  ['pawn_irv', 'Irv Gold', '24-hour pawnshop broker', 'weathered', 'silver', 'short', 1, 1, 0, PAL.WOOD_MID],
  ['guard_ben', 'Benny Cruz', 'Warehouse night watchman', 'olive', 'black', 'short', 0, 0, 0, PAL.STEEL_DARK],
  ['bouncer_tank', 'Marcus "Tank" Kowal', 'Penthouse private security', 'fair', 'black', 'short', 0, 0, 0, PAL.VOID],
  ['waitress_mae', 'Mae Jenkins', 'All-night diner waitress', 'deep', 'black', 'ponytail', 0, 0, 0, PAL.NEON_PINK],
  ['fixer_julian', 'Julian Mercer', 'Marcus\'s estranged cousin in harbor docks', 'marcus', 'black', 'short', 1, 0, 0, PAL.WOOD_DARK],
  ['chemist_eva', 'Eva Volkov', 'Imported synthetic opiate chemist', 'claire', 'blonde', 'long', 0, 1, 0, PAL.WHITE_SHIRT],
  ['fed_agent_roy', 'Agent Roy Keller', 'Federal DEA taskforce handler', 'fair', 'black', 'short', 0, 1, 1, PAL.SUIT_DARK],
  ['mayor_kincaid', 'Mayor Thomas Kincaid', 'Oakridge City Hall patron', 'fair', 'silver', 'short', 0, 0, 0, PAL.SUIT_DARK],
  ['snitch_pip', 'Pippa "Pip" Reyes', 'Underworld club courier', 'olive', 'redhead', 'long', 0, 0, 0, PAL.NEON_CYAN],
  ['dealer_brick', 'Louie "Bricks" DeLuca', 'Street boss on 7th & Market', 'weathered', 'black', 'short', 1, 0, 0, PAL.BRICK_RED],
  ['priest_donovan', 'Father Donovan', 'Dockside St. Jude confessor', 'fair', 'silver', 'short', 0, 1, 0, PAL.VOID],
  ['lawyer_shaw', 'Dorian Shaw', 'Assistant District Attorney', 'deep', 'black', 'short', 0, 1, 0, PAL.SUIT_MID],
  ['photographer_lee', 'Kenji Sato', 'Night crime-scene photographer', 'fair', 'black', 'short', 0, 1, 0, PAL.WOOD_MID],
  ['sniper_diaz', 'Officer Maya Diaz', 'SWAT perimeter marksman', 'olive', 'brunette', 'ponytail', 0, 0, 1, '#121820'],
  ['model_celeste', 'Celeste Moreau', 'Penthouse informant & socialite', 'claire', 'blonde', 'long', 0, 0, 0, PAL.ROBE_SILK, true],
  ['tech_norman', 'Norman Bateson', 'Wiretap & radio frequency tech', 'fair', 'chestnut', 'short', 0, 1, 0, PAL.STEEL_MID],
  ['driver_tony', 'Tony "Two-Tone" Ricci', 'Getaway cabbie on Harbor Blvd', 'olive', 'black', 'short', 1, 0, 0, PAL.AMBER_DIM],
  ['nurse_holly', 'Nurse Holly Grant', 'Mercy General ER triage nurse', 'fair', 'redhead', 'ponytail', 0, 0, 0, PAL.WHITE_SHIRT],
  ['captain_tug', 'Old MacAllister', 'Fog-bound tugboat skipper', 'weathered', 'silver', 'short', 1, 0, 0, PAL.COP_DARK],
  ['ia_sasha', 'Agent Sasha Bell', 'Secret Internal Affairs undercover partner', 'marcus', 'black', 'ponytail', 0, 0, 1, PAL.TRENCH_COAT],
  ['boss_shadow', 'The Architect', 'Voice behind the brass pocket watch syndicate', 'fair', 'silver', 'short', 0, 1, 0, PAL.VOID],
  ['suspect_zero', 'Unknown Vagrant', 'Rail yard midnight witness', 'weathered', 'chestnut', 'short', 1, 0, 0, PAL.WOOD_DARK],
  ['rival_det', 'Det. Vance Thorne', 'Corrupt rival detective framing Unit 84', 'fair', 'chestnut', 'short', 0, 0, 1, PAL.SUIT_MID],
];

export const CHARACTER_CATALOG = { ...CORE_CAST };
for (const [id, name, role, skin, hair, hairStyle, mustache, glasses, badge, attireColor, robe = false] of EXTRA_SPECS) {
  CHARACTER_CATALOG[id] = {
    id,
    name,
    shortName: name.toUpperCase().slice(0, 14),
    role,
    skin,
    hair,
    hairStyle,
    mustache: Boolean(mustache),
    glasses: Boolean(glasses),
    badge: Boolean(badge),
    hat: badge && attireColor === PAL.COP_NAVY ? 'cop_cap' : null,
    attireColor,
    attireShade: PAL.SUIT_DARK,
    pantsColor: PAL.SUIT_DARK,
    robe: Boolean(robe),
    slim: hairStyle === 'long' || hairStyle === 'ponytail',
    gender: (id === 'ia_vance' || hairStyle === 'long' || hairStyle === 'ponytail') ? 'female' : 'male',
  };
}

export function getCharacterList() {
  return Object.values(CHARACTER_CATALOG);
}
