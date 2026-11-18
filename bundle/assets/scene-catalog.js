/**
 * 160 Scene Definitions composed across 20 high-res SVGA architectural templates,
 * weather/lighting variants, prop layers, character placements, and default BGM moods.
 */

const BASE_SCENES = {
  // Exact 15 Case I scenes preserved cleanly
  precinct_briefing: { tpl: 'precinct_briefing', label: 'Precinct 84 Briefing Room', weather: 'none', bgm: 'bgm_precinct_rain', actors: [['dooley', 112, 232, 1, { outfit: 'police_uniform', prop: 'case_folder' }], ['marcus', 236, 246, 1, { outfit: 'police_uniform', prop: 'coffee_cup' }], ['claire', 318, 246, -1, { outfit: 'police_uniform', prop: 'coffee_cup', pose: 'chill' }]] },
  precinct_locker: { tpl: 'precinct_locker', label: 'Locker Room #84', weather: 'none', bgm: 'bgm_locker_prep', actors: [['marcus', 166, 242, 1, { outfit: 'police_uniform', prop: 'badge_id' }]] },
  precinct_yard: { tpl: 'precinct_yard', label: 'Motor Pool Yard', weather: 'rain', bgm: 'bgm_rain_patrol', actors: [['marcus', 102, 238, 1, { outfit: 'police_uniform' }], ['claire', 370, 238, -1, { outfit: 'police_uniform', prop: 'cigarette', pose: 'chill' }]] },
  crosswalk_redlight: { tpl: 'crosswalk_redlight', label: '4th & Union Crosswalk', weather: 'rain', cockpit: true, bgm: 'bgm_crosswalk_tension', actors: [['raincoat_man', 240, 166, 1, { umbrella: true, rossiBox: true, prop: 'rossi_box', scale: 0.72 }]] },
  pursuit_active: { tpl: 'pursuit_highway', label: 'High-Speed Pursuit', weather: 'rain', cockpit: true, bgm: 'bgm_code3_chase', actors: [] },
  felony_stop: { tpl: 'felony_railyard', label: 'Dead-End Rail Yard #3', weather: 'rain', bgm: 'bgm_felony_stop', actors: [['claire', 110, 224, 1, { pose: 'flashlight', prop: 'flashlight', outfit: 'police_uniform' }], ['marcus', 184, 226, 1, { pose: 'aim', prop: 'pistol', outfit: 'police_uniform' }], ['eddie', 286, 218, -1, { pose: 'handsup', outfit: 'bad_guy' }]] },
  interrogation_room: { tpl: 'interrogation_b', label: 'Interrogation Room B', weather: 'none', bgm: 'bgm_ia_grill', props: ['tape_recorder'], actors: [['marcus', 132, 246, 1, { prop: 'case_folder' }], ['eddie', 310, 246, -1, { pose: 'sit', prop: 'cigarette', outfit: 'bad_guy' }], ['claire', 422, 242, -1, { pose: 'chill' }]] },
  motel_exterior: { tpl: 'motel_exterior', label: 'Starlight Motor Court #209', weather: 'rain', bgm: 'bgm_neon_stalk', actors: [['claire', 182, 226, 1, { pose: 'aim', prop: 'pistol' }], ['marcus', 248, 226, 1, { pose: 'crouch', prop: 'pistol' }]] },
  motel_alley: { tpl: 'brick_alley', label: 'Flooded Motel Back Alley', weather: 'rain', bgm: 'bgm_alley_chase', actors: [['marcus', 170, 242, 1, { pose: 'run', prop: 'pistol' }], ['marco', 286, 236, -1, { pose: 'run', outfit: 'bad_guy' }]] },
  motel_lab: { tpl: 'motel_lab', label: 'Room 209 Clandestine Lab', weather: 'none', bgm: 'bgm_forensics', props: ['rossi_box', 'evidence_bag'], actors: [['marcus', 274, 242, 1, { pose: 'flashlight', prop: 'evidence_bag' }]] },
  pier84_exterior: { tpl: 'pier_exterior', label: 'Pier 84 Cold Storage', weather: 'fog', bgm: 'bgm_harbor_stealth', actors: [['claire', 134, 222, 1, { prop: 'pistol' }], ['marcus', 176, 222, 1, { pose: 'aim', prop: 'pistol' }]] },
  pier84_interior: { tpl: 'pier_floor', label: 'Pier 84 Processing Floor', weather: 'smoke', bgm: 'bgm_swat_breach', actors: [['marcus', 142, 238, 1, { pose: 'aim', prop: 'shotgun' }], ['claire', 194, 240, 1, { pose: 'kneel', prop: 'pistol' }]] },
  pier84_office: { tpl: 'pier_office', label: 'Mezzanine Office', weather: 'rain', bgm: 'bgm_boss_showdown', props: ['incinerator_fire', 'rossi_box'], actors: [['claire', 52, 238, 1, { pose: 'aim', prop: 'pistol' }], ['marcus', 102, 238, 1, { pose: 'aim', prop: 'pistol' }], ['castellano', 322, 234, -1, { outfit: 'formal', prop: 'cigar' }]] },
  pier84_street_twist: { tpl: 'pier_tracks', label: 'Pier 84 Rail Crossing', weather: 'rain', bgm: 'bgm_raincoat_mystery', props: ['police_tape', 'red_twine_clue'], actors: [['marcus', 188, 232, 1], ['claire', 238, 232, 1], ['raincoat_man', 356, 184, -1, { umbrella: true, scale: 0.78 }]] },
  epilogue_ceremony: { tpl: 'epilogue_stage', label: 'Precinct 84 Gold Shield Ceremony', weather: 'none', bgm: 'bgm_dawn_victory', actors: [['dooley', 146, 236, 1, { outfit: 'formal' }], ['marcus_offduty', 236, 236, 1, { outfit: 'formal', prop: 'badge_id' }], ['claire', 326, 236, -1, { outfit: 'formal' }]] },

  // Additional Bedroom, Domestic, Corrupt & Noir Templates for AI Blueprints
  marcus_bedroom_night: { tpl: 'marcus_bedroom', label: 'Marcus\'s Bedroom (Midnight)', weather: 'none', bgm: 'bgm_bedroom_tense', actors: [['marcus_offduty', 245, 162, 1, { outfit: 'casual', pose: 'lie_bed', prop: 'cigarette' }]] },
  marcus_bedroom_visit: { tpl: 'marcus_bedroom', label: 'Marcus\'s Bedroom (Late Visitor)', weather: 'none', bgm: 'bgm_bedroom_warm', props: ['whiskey_glasses'], actors: [['marcus_offduty', 164, 244, 1, { outfit: 'casual', prop: 'whiskey_glass', pose: 'chill' }], ['claire_offduty', 310, 244, -1, { outfit: 'formal', prop: 'whiskey_glass' }]] },
  claire_bedroom_night: { tpl: 'claire_bedroom', label: 'Claire\'s Loft Bedroom (Night)', weather: 'none', bgm: 'bgm_bedroom_tense', actors: [['claire_offduty', 92, 162, 1, { outfit: 'casual', pose: 'lie_bed', prop: 'cigarette' }]] },
  claire_bedroom_secret: { tpl: 'claire_bedroom', label: 'Claire\'s Bedroom (Hidden Files)', weather: 'none', bgm: 'bgm_betrayal_minor', props: ['rossi_box', 'case_dossier'], actors: [['claire_offduty', 172, 244, 1, { outfit: 'casual', prop: 'case_folder' }], ['marcus_offduty', 318, 244, -1, { outfit: 'casual' }]] },
  penthouse_payoff: { tpl: 'penthouse_bedroom', label: 'VIP Penthouse Suite (Payoff)', weather: 'rain', bgm: 'bgm_dirty_payoff', props: ['cash_briefcase', 'whiskey_glasses'], actors: [['marcus_offduty', 148, 244, 1, { outfit: 'formal', prop: 'whiskey_glass' }], ['commissioner_hayes', 324, 244, -1, { outfit: 'formal', prop: 'cigar' }]] },
  penthouse_afterhours: { tpl: 'penthouse_bedroom', label: 'Penthouse Bedroom (After Hours)', weather: 'none', bgm: 'bgm_bedroom_warm', props: ['whiskey_glasses'], actors: [['marcus_offduty', 245, 162, 1, { outfit: 'casual', pose: 'lie_bed' }], ['model_celeste', 350, 162, -1, { outfit: 'formal', pose: 'lie_bed', prop: 'whiskey_glass' }]] },
  parking_garage_drop: { tpl: 'parking_garage', label: 'Underground Garage (Secret Drop)', weather: 'fog', bgm: 'bgm_dirty_payoff', props: ['cash_briefcase'], actors: [['marcus', 144, 242, 1, { pose: 'chill', prop: 'cigarette' }], ['lt_malone', 318, 242, -1, { outfit: 'bad_guy', prop: 'bribe_envelope' }]] },
  diner_midnight: { tpl: 'diner_booth', label: '24-Hour Harbor Diner', weather: 'rain', bgm: 'bgm_diner_jazz', props: ['rossi_box', 'coffee_mug'], actors: [['marcus_offduty', 84, 206, 1, { outfit: 'casual', pose: 'sit', prop: 'coffee_cup' }], ['elena_rodriguez', 396, 206, -1, { outfit: 'casual', pose: 'sit', prop: 'cigarette' }]] },
};

const LOCATION_BASES = [
  ['precinct_briefing', 'Briefing Hall'],
  ['precinct_locker', 'Locker Corridor'],
  ['precinct_yard', 'Precinct Courtyard'],
  ['crosswalk_redlight', 'Downtown Intersection'],
  ['pursuit_highway', 'Harbor Expressway'],
  ['felony_railyard', 'Freight Yard'],
  ['interrogation_b', 'Interrogation Suite'],
  ['parking_garage', 'Sub-Level Garage'],
  ['diner_booth', 'All-Night Diner'],
  ['brick_alley', 'Harbor Back Alley'],
  ['motel_exterior', 'Highway Motel Lot'],
  ['motel_lab', 'Clandestine Lab'],
  ['pier_exterior', 'Dockside Cannery'],
  ['pier_floor', 'Warehouse Floor'],
  ['pier_office', 'Supervisor Office'],
  ['pier_tracks', 'Railroad Grade'],
  ['marcus_bedroom', 'Marcus\'s Apartment Bedroom'],
  ['claire_bedroom', 'Claire\'s Loft Bedroom'],
  ['penthouse_bedroom', 'Penthouse Hotel Suite'],
  ['epilogue_stage', 'City Hall / Precinct Stage'],
];

const VARIANT_MODS = [
  ['dawn', 'Dawn Light', 'none', 'bgm_dawn_victory', []],
  ['storm', 'Thunderstorm', 'rain', 'bgm_rain_patrol', []],
  ['fog', 'Harbor Fog', 'fog', 'bgm_harbor_stealth', []],
  ['crime_scene', 'Crime Scene', 'rain', 'bgm_forensics', ['police_tape']],
  ['bribe_drop', 'Clandestine Drop', 'none', 'bgm_dirty_payoff', ['cash_briefcase']],
  ['after_hours', 'Late-Night Drink', 'none', 'bgm_bedroom_warm', ['whiskey_glasses']],
  ['arson', 'Fire Aftermath', 'smoke', 'bgm_boss_showdown', ['incinerator_fire']],
];

export const SCENE_CATALOG = { ...BASE_SCENES };
for (const [tpl, titlePrefix] of LOCATION_BASES) {
  for (const [modId, modLabel, weather, bgm, props] of VARIANT_MODS) {
    const id = `${tpl}_${modId}`;
    if (SCENE_CATALOG[id]) continue;
    SCENE_CATALOG[id] = {
      tpl,
      label: `${titlePrefix} — ${modLabel}`,
      weather,
      bgm,
      props,
      actors: [['marcus', 162, 238, 1]],
    };
  }
}

export function getSceneIds() {
  return Object.keys(SCENE_CATALOG);
}
