/**
 * 85 Procedural Audio Assets:
 *  - 40 looping AdLib / Synth noir BGM patterns
 *  - 45 one-shot Web Audio SFX synthesizer recipes
 */

const BGM_SEEDS = [
  ['bgm_precinct_rain', 'Precinct Night Shift', 84, [36, 36, 43, 41, 39, 38, 36, 43], 'saw', 'rain_noir'],
  ['bgm_locker_prep', 'Locker Check', 92, [40, 43, 45, 43, 40, 47, 45, 43], 'tri', 'prep'],
  ['bgm_rain_patrol', 'Unit 84 Rain Patrol', 88, [36, 39, 43, 42, 41, 39, 38, 35], 'saw', 'patrol'],
  ['bgm_crosswalk_tension', '4th & Union Red Light', 78, [38, 41, 44, 41, 38, 44, 43, 37], 'sine', 'tension'],
  ['bgm_code3_chase', 'Code 3 Pursuit Synth', 138, [36, 48, 39, 51, 41, 53, 43, 55], 'square', 'chase'],
  ['bgm_felony_stop', 'Rail Yard Standoff', 102, [34, 34, 41, 40, 34, 34, 42, 41], 'saw', 'danger'],
  ['bgm_ia_grill', 'Room B Chiaroscuro', 76, [33, 36, 39, 38, 33, 40, 39, 36], 'tri', 'interrogation'],
  ['bgm_neon_stalk', 'Starlight Motel Neon', 96, [39, 43, 46, 44, 39, 46, 48, 43], 'saw', 'neon'],
  ['bgm_alley_chase', 'Back Alley Foot Chase', 132, [38, 45, 50, 45, 41, 48, 53, 48], 'square', 'chase'],
  ['bgm_forensics', 'Latent Prints Lab', 86, [41, 45, 48, 52, 41, 45, 49, 48], 'tri', 'mystery'],
  ['bgm_harbor_stealth', 'Pier 84 Harbor Fog', 74, [31, 36, 38, 37, 31, 39, 38, 35], 'sine', 'stealth'],
  ['bgm_swat_breach', 'Flashbang Tactical Breach', 142, [36, 36, 42, 43, 36, 36, 46, 43], 'square', 'action'],
  ['bgm_boss_showdown', 'Incinerator Mezzanine', 120, [35, 38, 42, 45, 35, 41, 42, 47], 'saw', 'boss'],
  ['bgm_raincoat_mystery', 'Brass Watch Motif', 70, [36, 43, 44, 43, 35, 41, 43, 39], 'sine', 'mystery'],
  ['bgm_dawn_victory', 'Gold Shield Morning', 104, [48, 52, 55, 60, 50, 54, 57, 62], 'tri', 'triumph'],
  ['bgm_bedroom_warm', 'Midnight Loft Sax', 68, [41, 45, 48, 51, 43, 47, 50, 53], 'sine', 'intimate'],
  ['bgm_bedroom_tense', '03:12 Insomnia', 72, [34, 39, 41, 44, 34, 38, 41, 43], 'tri', 'drama'],
  ['bgm_dirty_payoff', 'Envelope in the Garage', 82, [33, 36, 40, 42, 33, 39, 40, 38], 'saw', 'corrupt'],
  ['bgm_betrayal_minor', 'Compromised Badge', 74, [36, 39, 42, 41, 35, 38, 41, 39], 'sine', 'tragedy'],
  ['bgm_diner_jazz', '24-Hour Coffee Booth', 80, [43, 47, 50, 53, 41, 45, 48, 51], 'tri', 'jazz'],
];

const EXTRA_BGM_MOODS = [
  'stakeout', 'wiretap', 'courtroom', 'autopsy', 'bar_smoke', 'penthouse_silk', 'yacht_deck',
  'subway_rumble', 'evidence_tamper', 'rooftop_wind', 'blackmail', 'confession', 'undercover',
  'ambulance_wail', 'internal_affairs', 'dawn_confessional', 'double_cross', 'siren_echo', 'epilogue_twine', 'credits_noir',
];

export const BGM_CATALOG = {};
for (const [id, title, bpm, notes, wave, mood] of BGM_SEEDS) {
  BGM_CATALOG[id] = { id, title, bpm, notes, wave, mood };
}
EXTRA_BGM_MOODS.forEach((m, idx) => {
  const id = `bgm_${m}`;
  BGM_CATALOG[id] = {
    id,
    title: m.replace(/_/g, ' ').toUpperCase(),
    bpm: 74 + (idx % 6) * 10,
    notes: [36 + (idx % 5), 40 + (idx % 4), 43 + (idx % 5), 46 + (idx % 3), 38, 41, 44, 43],
    wave: idx % 3 === 0 ? 'sine' : idx % 3 === 1 ? 'tri' : 'saw',
    mood: m,
  };
});

export const CORE_SFX_LIST = [
  'siren', 'squelch', 'tick', 'cuff', 'shot', 'hazard', 'point', 'gameover', 'victory',
  'thunder', 'rain_splash', 'door_knock', 'door_creak', 'lockpick', 'camera_shutter',
  'lighter_flick', 'whiskey_pour', 'glass_clink', 'pager_beep', 'teleprinter',
  'train_horn', 'flashbang', 'heartbeat', 'footsteps', 'paper_flip', 'cash_count',
  'zipper_bag', 'wiper_thump', 'car_door', 'v8_rev', 'tire_screech', 'phone_ring',
  'hang_up', 'dial_tone', 'clock_alarm', 'tape_click', 'vault_spin', 'metal_latch',
  'whisper_hiss', 'gavel_bang', 'applause_clap', 'breath_sigh', 'bottle_open',
  'badge_pin', 'curtain_draw',
];

export const MAIN_MENU_BGM_ID = 'bgm_main_menu_cop_theme';
export const MAIN_MENU_BGM_TRACK = {
  id: MAIN_MENU_BGM_ID,
  title: 'Night Watch Cop Theme',
  bpm: 126,
  wave: 'saw',
  bassWave: 'square',
  notes: [
    52, 0, 55, 52, 57, 52, 50, 52, 59, 0, 60, 59, 57, 55, 52, 55,
    64, 0, 62, 59, 57, 55, 59, 57, 55, 52, 50, 52, 55, 57, 59, 64,
  ],
  bassNotes: [28, 40, 28, 40, 33, 45, 31, 43, 35, 47, 36, 48, 35, 43, 31, 40],
  mood: 'heroic_cop',
};

export function getBgmIds() {
  return Object.keys(BGM_CATALOG);
}
