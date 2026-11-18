import { PAL } from '../gfx/svga-palette.js';

export const OUTFIT_IDS = ['default', 'police_uniform', 'bad_guy', 'casual', 'formal', 'naked'];

export const OUTFIT_CATALOG = {
  default: { label: 'Catalog Default' },
  police_uniform: { label: 'Oakridge PD Uniform' },
  bad_guy: { label: 'Underworld Street / Trench' },
  casual: { label: 'Off-Duty Casual' },
  formal: { label: 'Formal Suit / Evening Gown' },
  naked: { label: 'Undressed / Bare Skin' },
};

export const POSE_IDS = [
  'stand', 'walk', 'run', 'chill', 'sit', 'sit_relaxed', 'lie_bed', 'bend_pickup',
  'smoke', 'sip', 'talk_gesture', 'crouch', 'aim', 'shoot', 'handsup', 'kneel',
  'cuff', 'flashlight', 'hit', 'down',
];

export const HELD_PROP_CATALOG = {
  cigarette: { kind: 'smoke', mouth: true, label: 'Lit Cigarette' },
  cigar: { kind: 'smoke', mouth: true, label: 'Fat Cigar' },
  coffee_cup: { kind: 'drink', mouth: true, label: 'Steaming Coffee Cup' },
  whiskey_glass: { kind: 'drink', mouth: true, label: 'Whiskey Lowball' },
  beer_bottle: { kind: 'drink', mouth: true, label: 'Longneck Beer Bottle' },
  pistol: { kind: 'weapon', label: 'Service 9mm Pistol' },
  shotgun: { kind: 'weapon', long: true, label: 'Pump 12-Gauge Shotgun' },
  smg: { kind: 'weapon', long: true, label: 'Submachine Gun' },
  sniper_rifle: { kind: 'weapon', long: true, label: 'Scoped Marksman Rifle' },
  knife: { kind: 'melee', label: 'Switchblade Knife' },
  baton: { kind: 'melee', label: 'Police Nightstick' },
  crowbar: { kind: 'melee', label: 'Steel Pry Bar' },
  flashlight: { kind: 'tool', label: 'Maglite Flashlight' },
  handcuffs: { kind: 'gear', label: 'Steel Handcuffs' },
  walkie_talkie: { kind: 'gear', label: 'Motorola Channel-1 Radio' },
  badge_id: { kind: 'gear', label: 'Gold Shield Badge' },
  case_folder: { kind: 'doc', label: 'Case #84 Dossier' },
  notepad: { kind: 'doc', label: 'Detective Pocket Pad' },
  evidence_bag: { kind: 'evidence', label: 'Sealed Evidence Bag' },
  tape_recorder: { kind: 'gear', label: 'Microcassette Recorder' },
  camera: { kind: 'gear', label: '35mm Crime Camera' },
  magnifying_glass: { kind: 'tool', label: 'Forensic Lens' },
  cash_briefcase: { kind: 'loot', label: 'Steel Cash Briefcase' },
  bribe_envelope: { kind: 'loot', label: 'Thick Cash Envelope' },
  rossi_box: { kind: 'loot', label: 'Rossi Pastry Box' },
  brass_watch: { kind: 'evidence', label: 'Tarnished Brass Watch' },
  motel_key: { kind: 'evidence', label: 'Room #209 Brass Key' },
  burner_phone: { kind: 'gear', label: 'Motorola Brick / Pager' },
  syringe: { kind: 'evidence', label: 'Blue Velvet Vial' },
  umbrella: { kind: 'cover', label: 'Black Rain Umbrella' },
  duffel_bag: { kind: 'loot', label: 'Heavy Harbor Duffel' },
};

export const STAGE_PROP_CATALOG = {
  police_tape: { label: 'Police Line Tape' },
  cash_briefcase: { label: 'Cash Briefcase' },
  whiskey_glasses: { label: 'Whiskey Glasses' },
  rossi_box: { label: 'Rossi Pastry Box' },
  incinerator_fire: { label: 'Incinerator Fire' },
  red_twine_clue: { label: 'Red Baker Twine' },
  tape_recorder: { label: 'Interview Tape Deck' },
  shell_casings: { label: 'Spent Brass Casings' },
  blood_stain: { label: 'Dark Blood Pool' },
  chalk_outline: { label: 'Crime-Scene Chalk Outline' },
  evidence_marker: { label: 'Numbered Evidence Cone' },
  broken_glass: { label: 'Shattered Glass Shards' },
  cigarette_butt: { label: 'Smoldering Butt' },
  dropped_pistol: { label: 'Dropped Sidearm' },
  burn_barrel: { label: 'Smoking Burn Barrel' },
  open_safe: { label: 'Cracked Wall Safe' },
  wiretap_deck: { label: 'Reel-to-Reel Wiretap' },
  corpse_sheet: { label: 'Morgue Body Sheet' },
  barricade_cone: { label: 'Traffic Cone' },
  coffee_mug: { label: 'Ceramic Coffee Mug' },
  syringe_vial: { label: 'Dropped Blue Vial' },
  motel_key: { label: 'Dropped Motel Key' },
  case_dossier: { label: 'Spilled Case Dossier' },
  evidence_bag: { label: 'Sealed Evidence Bag' },
};

export const SCENE_LANDMARKS = {
  marcus_bedroom: {
    bed_left: { x: 245, y: 162, facing: 1, defaultPose: 'lie_bed' },
    bed_right: { x: 350, y: 162, facing: -1, defaultPose: 'lie_bed' },
    nightstand: { x: 158, y: 162, facing: 1, defaultPose: 'stand' },
    window: { x: 96, y: 236, facing: 1, defaultPose: 'chill' },
    doorway: { x: 416, y: 242, facing: -1, defaultPose: 'stand' },
    center: { x: 268, y: 242, facing: 1, defaultPose: 'stand' },
    evidence_spot: { x: 184, y: 244, facing: 1, defaultPose: 'stand' },
  },
  claire_bedroom: {
    bed_left: { x: 92, y: 162, facing: 1, defaultPose: 'lie_bed' },
    bed_right: { x: 195, y: 162, facing: -1, defaultPose: 'lie_bed' },
    nightstand: { x: 304, y: 162, facing: -1, defaultPose: 'stand' },
    window: { x: 368, y: 236, facing: -1, defaultPose: 'chill' },
    doorway: { x: 422, y: 242, facing: -1, defaultPose: 'stand' },
    center: { x: 248, y: 242, facing: 1, defaultPose: 'stand' },
    evidence_spot: { x: 296, y: 244, facing: -1, defaultPose: 'stand' },
  },
  penthouse_bedroom: {
    bed_left: { x: 245, y: 162, facing: 1, defaultPose: 'lie_bed' },
    bed_right: { x: 350, y: 162, facing: -1, defaultPose: 'lie_bed' },
    nightstand: { x: 158, y: 162, facing: 1, defaultPose: 'stand' },
    doorway: { x: 416, y: 242, facing: -1, defaultPose: 'stand' },
    center: { x: 210, y: 244, facing: 1, defaultPose: 'chill' },
    evidence_spot: { x: 228, y: 184, facing: 1, defaultPose: 'stand' },
  },
  diner_booth: {
    booth_left: { x: 84, y: 206, facing: 1, defaultPose: 'sit' },
    booth_right: { x: 396, y: 206, facing: -1, defaultPose: 'sit' },
    table: { x: 220, y: 164, facing: 1, defaultPose: 'stand' },
    counter: { x: 240, y: 242, facing: 1, defaultPose: 'chill' },
    doorway: { x: 432, y: 238, facing: -1, defaultPose: 'stand' },
    center: { x: 240, y: 242, facing: 1, defaultPose: 'stand' },
    evidence_spot: { x: 240, y: 170, facing: 1, defaultPose: 'sit' },
  },
  default: {
    cover_left: { x: 112, y: 234, facing: 1, defaultPose: 'kneel' },
    cover_right: { x: 368, y: 234, facing: -1, defaultPose: 'kneel' },
    doorway: { x: 412, y: 234, facing: -1, defaultPose: 'stand' },
    center: { x: 240, y: 238, facing: 1, defaultPose: 'stand' },
    evidence_spot: { x: 256, y: 244, facing: 1, defaultPose: 'stand' },
    desk_chair: { x: 190, y: 228, facing: 1, defaultPose: 'sit' },
    cruiser_cover: { x: 136, y: 234, facing: 1, defaultPose: 'crouch' },
  },
};

export function resolveOutfitSpec(charSpec = {}, outfitId = 'default') {
  const id = OUTFIT_CATALOG[outfitId] ? outfitId : 'default';
  if (id === 'police_uniform') {
    return {
      outfitId: id,
      attireColor: PAL.COP_NAVY,
      attireShade: PAL.COP_DARK,
      pantsColor: PAL.COP_DARK,
      collarColor: PAL.WHITE_SHIRT,
      hasTie: true,
      hasGown: false,
      badge: true,
      belt: true,
      hat: charSpec.hat || 'cop_cap',
      isNaked: false,
    };
  }
  if (id === 'bad_guy') {
    return {
      outfitId: id,
      attireColor: '#1c161e',
      attireShade: '#100c12',
      pantsColor: '#12131a',
      collarColor: '#581822',
      hasTie: false,
      hasGown: false,
      badge: false,
      belt: true,
      hat: charSpec.hat === 'cop_cap' ? null : (charSpec.hat || null),
      isNaked: false,
    };
  }
  if (id === 'casual') {
    return {
      outfitId: id,
      attireColor: charSpec.gender === 'female' ? '#3a506b' : '#4a3b32',
      attireShade: '#28201c',
      pantsColor: '#22304a',
      collarColor: '#cad2de',
      hasTie: false,
      hasGown: false,
      badge: false,
      belt: false,
      hat: null,
      isNaked: false,
    };
  }
  if (id === 'formal') {
    const isFemale = charSpec.gender === 'female';
    return {
      outfitId: id,
      attireColor: isFemale ? PAL.SILK_PLUM : '#161922',
      attireShade: isFemale ? '#3c1022' : '#0b0d14',
      pantsColor: isFemale ? PAL.SILK_PLUM : '#12151e',
      collarColor: isFemale ? null : PAL.WHITE_SHIRT,
      hasTie: !isFemale,
      hasGown: isFemale,
      badge: false,
      belt: !isFemale,
      hat: null,
      isNaked: false,
    };
  }
  if (id === 'naked') {
    return {
      outfitId: id,
      attireColor: null,
      attireShade: null,
      pantsColor: null,
      collarColor: null,
      hasTie: false,
      hasGown: false,
      badge: false,
      belt: false,
      hat: null,
      isNaked: true,
    };
  }
  return {
    outfitId: 'default',
    attireColor: charSpec.attireColor || PAL.COP_NAVY,
    attireShade: charSpec.attireShade || PAL.COP_DARK,
    pantsColor: charSpec.pantsColor || PAL.SUIT_DARK,
    collarColor: charSpec.robe ? PAL.BED_LINEN : PAL.WHITE_SHIRT,
    hasTie: Boolean(charSpec.badge),
    hasGown: Boolean(charSpec.robe),
    badge: Boolean(charSpec.badge),
    belt: charSpec.belt !== false && !charSpec.robe,
    hat: charSpec.hat || null,
    isNaked: false,
  };
}

export function snapOutfitId(raw, fallback = 'default') {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return fallback;
  if (OUTFIT_CATALOG[s]) return s;
  if (/naked|nude|undress|bare/.test(s)) return 'naked';
  if (/formal|suit|tux|gown|evening/.test(s)) return 'formal';
  if (/casual|streetwear|jeans|hoodie|off.?duty|tee|jacket/.test(s)) return 'casual';
  if (/bad|villain|thug|mob|enforcer|leather|criminal/.test(s)) return 'bad_guy';
  if (/police|cop|uniform|patrol|swat/.test(s)) return 'police_uniform';
  return fallback;
}

export function snapPropId(raw, fallback = null) {
  const s = String(raw || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (!s) return fallback;
  if (HELD_PROP_CATALOG[s]) return s;
  if (/cig|smoke/.test(s)) return /cigar\b/.test(s) ? 'cigar' : 'cigarette';
  if (/coffee|espresso|mug/.test(s)) return 'coffee_cup';
  if (/whiskey|bourbon|scotch|drink|glass/.test(s)) return 'whiskey_glass';
  if (/beer|bottle/.test(s)) return 'beer_bottle';
  if (/shotgun|12.?gauge/.test(s)) return 'shotgun';
  if (/smg|submachine/.test(s)) return 'smg';
  if (/sniper|rifle/.test(s)) return 'sniper_rifle';
  if (/pistol|gun|revolver|9mm|sidearm/.test(s)) return 'pistol';
  if (/flash|torch/.test(s)) return 'flashlight';
  if (/cuff/.test(s)) return 'handcuffs';
  if (/radio|walkie|mic/.test(s)) return 'walkie_talkie';
  if (/badge|shield/.test(s)) return 'badge_id';
  if (/evidence/.test(s)) return 'evidence_bag';
  if (/folder|dossier|file/.test(s)) return 'case_folder';
  if (/briefcase/.test(s)) return 'cash_briefcase';
  if (/envelope|bribe|cash/.test(s)) return 'bribe_envelope';
  if (/rossi|pastry/.test(s)) return 'rossi_box';
  if (/watch/.test(s)) return 'brass_watch';
  if (/key/.test(s)) return 'motel_key';
  if (/phone|pager|burner/.test(s)) return 'burner_phone';
  if (/syringe|vial/.test(s)) return 'syringe';
  return fallback;
}

export function snapStagePropId(raw, fallback = 'evidence_marker') {
  const s = String(raw || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (STAGE_PROP_CATALOG[s]) return s;
  if (/shell|casing|brass/.test(s)) return 'shell_casings';
  if (/blood/.test(s)) return 'blood_stain';
  if (/chalk|outline/.test(s)) return 'chalk_outline';
  if (/evidence/.test(s)) return HELD_PROP_CATALOG.evidence_bag && s === 'evidence_bag' ? 'evidence_bag' : 'evidence_marker';
  if (/glass/.test(s)) return 'broken_glass';
  if (/cig|butt/.test(s)) return 'cigarette_butt';
  if (/pistol|gun/.test(s)) return 'dropped_pistol';
  if (/briefcase/.test(s)) return 'cash_briefcase';
  if (/rossi|box/.test(s)) return 'rossi_box';
  if (/coffee|mug/.test(s)) return 'coffee_mug';
  return fallback;
}

export function snapPoseId(raw, fallback = 'stand') {
  const s = String(raw || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (POSE_IDS.includes(s)) return s;
  if (/bed|lie|laying|lying|sleep/.test(s)) return 'lie_bed';
  if (/sit|booth|seat/.test(s)) return 'sit';
  if (/pick|bend|grab/.test(s)) return 'bend_pickup';
  if (/chill|lean|relax|lounge/.test(s)) return 'chill';
  if (/smoke|drag/.test(s)) return 'smoke';
  if (/sip|drink/.test(s)) return 'sip';
  if (/shoot|fire|blast/.test(s)) return 'shoot';
  if (/aim|draw/.test(s)) return 'aim';
  if (/walk|stroll/.test(s)) return 'walk';
  if (/run|sprint|chase/.test(s)) return 'run';
  if (/dead|down|prone|collapse|unconscious/.test(s)) return 'down';
  if (/hit|shot|stagger|flinch/.test(s)) return 'hit';
  if (/hand/.test(s)) return 'handsup';
  if (/kneel/.test(s)) return 'kneel';
  if (/crouch|cover|duck/.test(s)) return 'crouch';
  return fallback;
}

export function resolveLandmark(tpl = 'default', at = null, fallbackIdx = 0) {
  const map = SCENE_LANDMARKS[tpl] || SCENE_LANDMARKS.default;
  const key = String(at || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (key && map[key]) return { ...map[key], landmark: key };
  if (key && SCENE_LANDMARKS.default[key]) return { ...SCENE_LANDMARKS.default[key], landmark: key };
  if (/bed/.test(key) && map.bed_left) return { ...map.bed_left, landmark: 'bed_left' };
  if (/booth|sit|table/.test(key) && map.booth_left) return { ...map.booth_left, landmark: 'booth_left' };
  const defaults = [
    { x: 136, y: 238, facing: 1, defaultPose: 'stand' },
    { x: 245, y: 238, facing: -1, defaultPose: 'stand' },
    { x: 356, y: 238, facing: -1, defaultPose: 'stand' },
    { x: 76, y: 240, facing: 1, defaultPose: 'stand' },
  ];
  return defaults[fallbackIdx % defaults.length];
}

export function inferVisualsFromProse(text = '') {
  const t = String(text || '').toLowerCase();
  if (!t) return {};
  const out = {};
  if (/\b(naked|nude|undressed|bare skin|unclothed)\b/.test(t)) out.outfit = 'naked';
  else if (/\b(tuxedo|formal suit|tailored suit|evening gown|dress|formal)\b/.test(t)) out.outfit = 'formal';
  else if (/\b(casual|jeans|t-shirt|hoodie|off-duty jacket|casual jacket)\b/.test(t)) out.outfit = 'casual';
  else if (/\b(leather jacket|bad guy|mobster|enforcer|thug coat)\b/.test(t)) out.outfit = 'bad_guy';
  else if (/\b(police uniform|patrol uniform|in uniform)\b/.test(t)) out.outfit = 'police_uniform';

  if (/\b(cigarette|smokes|smoking|lit a cig|ash|puff)\b/.test(t)) out.prop = 'cigarette';
  else if (/\b(cigar)\b/.test(t)) out.prop = 'cigar';
  else if (/\b(coffee|espresso|sips her coffee|mug)\b/.test(t)) out.prop = 'coffee_cup';
  else if (/\b(whiskey|bourbon|scotch|tumbler)\b/.test(t)) out.prop = 'whiskey_glass';
  else if (/\b(beer|bottle)\b/.test(t)) out.prop = 'beer_bottle';
  else if (/\b(shotgun|12-gauge)\b/.test(t)) out.prop = 'shotgun';
  else if (/\b(submachine|smg)\b/.test(t)) out.prop = 'smg';
  else if (/\b(pistol|revolver|9mm|sidearm|service weapon|fires his gun|draws his gun)\b/.test(t)) out.prop = 'pistol';
  else if (/\b(flashlight|beam|torch)\b/.test(t)) out.prop = 'flashlight';
  else if (/\b(evidence bag|bag the)\b/.test(t)) out.prop = 'evidence_bag';
  else if (/\b(handcuff|cuffs)\b/.test(t)) out.prop = 'handcuffs';
  else if (/\b(briefcase)\b/.test(t)) out.prop = 'cash_briefcase';
  else if (/\b(bribe|cash envelope|thick envelope)\b/.test(t)) out.prop = 'bribe_envelope';
  else if (/\b(rossi|pastry box)\b/.test(t)) out.prop = 'rossi_box';
  else if (/\b(dossier|case folder|file)\b/.test(t)) out.prop = 'case_folder';

  if (/\b(lies on the bed|lying on the bed|in bed|on the mattress|lays down|sleeping)\b/.test(t)) {
    out.pose = 'lie_bed';
    out.at = 'bed_left';
  } else if (/\b(bends down|bend over|picks up|pick up|kneels to grab)\b/.test(t)) {
    out.pose = 'bend_pickup';
  } else if (/\b(booth|sits|sitting|seated)\b/.test(t)) {
    out.pose = 'sit';
    if (/\bleft booth\b/.test(t)) out.at = 'booth_left';
    else if (/\bright booth\b/.test(t)) out.at = 'booth_right';
  } else if (/\b(chilling|lounges|leans against|relaxed)\b/.test(t)) out.pose = 'chill';
  else if (/\b(fires|shoots|opens fire)\b/.test(t)) out.pose = 'shoot';
  else if (/\b(aims|draws weapon|points gun)\b/.test(t)) out.pose = 'aim';
  else if (/\b(hands up|surrenders)\b/.test(t)) out.pose = 'handsup';
  else if (/\b(collapsed|dead on the floor|drops dead)\b/.test(t)) out.pose = 'down';
  else if (/\b(doorway)\b/.test(t)) out.at = 'doorway';
  return out;
}

export function inferActorVisualsFromLines(actorId, charSpec = {}, lines = []) {
  const stop = new Set(['the', 'and', 'man', 'off', 'duty', 'det', 'sgt', 'capt', 'agent', 'officer']);
  const tokens = [
    String(actorId || '').toLowerCase().replace(/[^a-z_]/g, '').split('_')[0],
    ...String(charSpec?.shortName || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/),
    ...String(charSpec?.name || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/),
  ].filter((w) => w.length >= 3 && !stop.has(w));
  const clauses = lines
    .flatMap((l) => String(l || '').split(/(?<=[.!?])\s+|(?:\bwhile\b|\band then\b)/i))
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = {};
  for (const c of clauses) {
    const lc = c.toLowerCase();
    if (!tokens.some((tok) => new RegExp(`\\b${tok}\\b`).test(lc))) continue;
    Object.assign(merged, inferVisualsFromProse(c));
  }
  return merged;
}
