/**
 * Sierra-style natural Verb-Noun parser for Precinct 84.
 * Normalizes synonyms, prepositions, 10-codes, and multi-word targets cleanly.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'at', 'to', 'on', 'in', 'into', 'from', 'with',
  'my', 'of', 'for', 'up', 'out', 'around', 'through', 'down', 'please',
]);

const VERB_SYNONYMS = {
  l: 'look',
  examine: 'look',
  view: 'look',
  watch: 'look',
  scan: 'look',
  check: 'inspect',
  investigate: 'inspect',
  walk: 'go',
  move: 'go',
  head: 'go',
  drive: 'go',
  exit: 'go',
  leave: 'go',
  grab: 'take',
  get: 'take',
  pick: 'take',
  equip: 'equip',
  wear: 'equip',
  put: 'equip',
  buckle: 'fasten',
  snap: 'fasten',
  fasten: 'fasten',
  call: 'radio',
  transmit: 'radio',
  dispatch: 'radio',
  request: 'radio',
  report: 'radio',
  turn: 'activate',
  switch: 'activate',
  start: 'activate',
  engage: 'activate',
  flip: 'activate',
  swerve: 'steer',
  steer: 'steer',
  pull: 'draw',
  unholster: 'draw',
  aim: 'draw',
  sheathe: 'holster',
  handcuff: 'cuff',
  arrest: 'cuff',
  frisk: 'search',
  pat: 'search',
  mirandize: 'miranda',
  collect: 'bag',
  seal: 'bag',
  secure: 'bag',
  confront: 'show',
  present: 'show',
  step: 'aside',
  stand: 'aside',
  pound: 'knock',
  bang: 'knock',
  rap: 'knock',
  chase: 'pursue',
  tackle: 'pursue',
  follow: 'track',
  match: 'compare',
  decipher: 'decode',
  translate: 'decode',
  disable: 'cut',
  snip: 'cut',
  yell: 'shout',
  announce: 'shout',
  fire: 'shoot',
  speak: 'talk',
  ask: 'talk',
  question: 'talk',
  interrogate: 'talk',
  load: 'restore',
  help: 'manual',
  guide: 'manual',
  inv: 'inventory',
  i: 'inventory',
  u: 'undo',
};

const NOUN_ALIASES = {
  briefing: 'briefing',
  roll: 'briefing',
  dooley: 'briefing',
  sgt: 'briefing',
  sergeant: 'briefing',
  blackboard: 'blackboard',
  chalkboard: 'blackboard',
  board: 'blackboard',
  bolo: 'blackboard',
  locker: 'locker',
  '84': 'locker',
  belt: 'belt',
  gear: 'belt',
  gun: 'weapon',
  revolver: 'weapon',
  '.38': 'weapon',
  service: 'weapon',
  weapon: 'weapon',
  kit: 'kit',
  key: 'keys',
  keys: 'keys',
  yard: 'yard',
  pool: 'yard',
  motor: 'yard',
  tire: 'tires',
  tires: 'tires',
  wheel: 'tires',
  wheels: 'tires',
  trunk: 'trunk',
  car: 'car',
  cruiser: 'car',
  unit: 'car',
  seatbelt: 'seatbelt',
  seat: 'seatbelt',
  pedestrian: 'pedestrian',
  man: 'pedestrian',
  commuter: 'pedestrian',
  crosswalk: 'pedestrian',
  raincoat: 'pedestrian',
  lights: 'lights',
  lightbar: 'lights',
  strobes: 'lights',
  siren: 'siren',
  left: 'left',
  right: 'right',
  lane: 'center',
  smoke: 'center',
  steady: 'center',
  tracks: 'tracks',
  alley: 'tracks',
  steam: 'tracks',
  headlights: 'tracks',
  suspect: 'suspect',
  eddie: 'suspect',
  rourke: 'suspect',
  marco: 'marco',
  vega: 'marco',
  chemist: 'marco',
  castellano: 'castellano',
  victor: 'castellano',
  viper: 'castellano',
  evidence: 'evidence',
  drugs: 'drugs',
  bricks: 'drugs',
  velvet: 'drugs',
  pager: 'pager',
  beeper: 'pager',
  recorder: 'recorder',
  tape: 'recorder',
  door: 'door',
  table: 'table',
  crumbs: 'table',
  twine: 'table',
  painting: 'painting',
  safe: 'safe',
  prints: 'prints',
  print: 'prints',
  fingerprints: 'prints',
  ledger: 'ledger',
  book: 'ledger',
  manifest: 'ledger',
  wires: 'wires',
  wire: 'wires',
  alarm: 'wires',
  box: 'wires',
  breach: 'pier',
  pier: 'pier',
  warehouse: 'pier',
  swat: 'swat',
  backup: 'swat',
  cover: 'cover',
  forklift: 'cover',
  freeze: 'freeze',
  police: 'freeze',
  enforcer: 'enforcer',
  gunman: 'enforcer',
  shooter: 'enforcer',
  desk: 'desk',
  teacup: 'desk',
  street: 'street',
  crowd: 'street',
  lamp: 'street',
  streetlamp: 'street',
  precinct: 'precinct',
  station: 'precinct',
  room: 'door',
};

export function parseCommand(rawInput) {
  const raw = String(rawInput || '').trim();
  const normalized = raw.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { raw, normalized: '', verb: '', noun: '', target: '', code: null, words: [] };
  }

  // Extract explicit radio 10-codes or Code 3 before token filtering
  const codeMatch = normalized.match(/\b(10-80|10-97|10-15|10-20|10-8|10-4|code\s*3|swat|backup)\b/);
  const code = codeMatch ? codeMatch[1].replace(/\s+/g, '') : null;

  const rawWords = normalized.split(' ');
  const words = rawWords.filter((w) => !STOP_WORDS.has(w));

  // Special full-phrase shortcuts
  if (/\bcode\s*3\b/.test(normalized) || (normalized.includes('lights') && normalized.includes('siren'))) {
    return { raw, normalized, verb: 'activate', noun: 'code3', target: 'code3', code: 'code3', words };
  }
  if (/\b(drop gun|drop weapon|disarm)\b/.test(normalized)) {
    return { raw, normalized, verb: 'order', noun: 'drop', target: 'drop', code, words };
  }
  if (/\b(police freeze|shout freeze|shout police|announce police)\b/.test(normalized) || normalized === 'freeze') {
    return { raw, normalized, verb: 'shout', noun: 'freeze', target: 'freeze', code, words };
  }
  if (/\b(stand aside|step aside|move aside)\b/.test(normalized)) {
    return { raw, normalized, verb: 'aside', noun: 'door', target: 'door', code, words };
  }
  if (/\b(hold lane|navigate smoke|keep steady)\b/.test(normalized)) {
    return { raw, normalized, verb: 'steer', noun: 'center', target: 'center', code, words };
  }
  if (/\b(lights on|turn on lights)\b/.test(normalized)) {
    return { raw, normalized, verb: 'activate', noun: 'lights', target: 'lights', code, words };
  }
  if (/\b(siren on|turn on siren)\b/.test(normalized)) {
    return { raw, normalized, verb: 'activate', noun: 'siren', target: 'siren', code, words };
  }
  if (/\b(read miranda|mirandize|read rights)\b/.test(normalized)) {
    return { raw, normalized, verb: 'miranda', noun: 'rights', target: 'rights', code, words };
  }
  if (/\b(take cover|duck behind)\b/.test(normalized)) {
    return { raw, normalized, verb: 'cover', noun: 'cover', target: 'cover', code, words };
  }
  if (/\b(return fire)\b/.test(normalized)) {
    return { raw, normalized, verb: 'shoot', noun: 'enforcer', target: 'enforcer', code, words };
  }
  if (/\b(hands up|step out|suspect out)\b/.test(normalized)) {
    return { raw, normalized, verb: 'order', noun: 'suspect', target: 'suspect', code, words };
  }
  if (/\b(signal breach|breach)\b/.test(normalized)) {
    return { raw, normalized, verb: 'breach', noun: 'pier', target: 'pier', code, words };
  }
  const saveQuitMatch = normalized.match(
    /^save(?:\s+(?!and\b|then\b|quit\b|exit\b)([a-z0-9_-]+))?(?:\s+(?:and|then))?\s+(?:quit|exit)$/
  );
  if (saveQuitMatch) {
    const slot = saveQuitMatch[1] || 'quicksave';
    return { raw, normalized, verb: 'save_quit', noun: slot, target: slot, code, words };
  }
  if (/^(?:ask claire|claire|hint|llm help|help me)\b/.test(normalized)) {
    const q = raw.replace(/^(?:ask claire|claire|hint|llm help|help me)\s*/i, '').trim();
    return { raw, normalized, verb: 'ask_claire', noun: 'claire', target: q, code, words };
  }
  if (/^ask\s+(?:eddie|castellano|suspect|dooley|sgt)\b/.test(normalized)) {
    return { raw, normalized, verb: 'ask_npc', noun: words[1] || 'suspect', target: raw, code, words };
  }
  if (/^(?:continue story|next case|case 2|case ii|sequel)\b/.test(normalized)) {
    return { raw, normalized, verb: 'continue_story', noun: 'case2', target: 'case2', code, words };
  }
  if (/^(?:continue|resume|continue shift)$/.test(normalized)) {
    return { raw, normalized, verb: 'continue_shift', noun: 'shift', target: 'shift', code, words };
  }
  const tierMatch = normalized.match(/^tier\s*([123])$/);
  if (tierMatch) {
    return { raw, normalized, verb: 'select_tier', noun: tierMatch[1], target: tierMatch[1], code, words };
  }
  if (/^(?:start|start shift|begin|play)$/.test(normalized)) {
    return { raw, normalized, verb: 'start_shift', noun: 'shift', target: 'shift', code, words };
  }
  if (/^(?:cycle model|next model|prev model)$/.test(normalized)) {
    return { raw, normalized, verb: 'cycle_model', noun: normalized.startsWith('prev') ? 'prev' : 'next', target: '', code, words };
  }

  const first = words[0] || rawWords[0];
  let verb = VERB_SYNONYMS[first] || first;

  // Handle "turn on recorder" or "walk around car"
  if (first === 'turn' && words.includes('off')) verb = 'deactivate';
  if (first === 'cut' && words.includes('headlights')) verb = 'track';

  const rest = words.slice(1);
  let noun = '';
  for (const w of rest) {
    if (NOUN_ALIASES[w]) {
      noun = NOUN_ALIASES[w];
      break;
    }
  }
  if (!noun && rest.length > 0) {
    noun = rest.join(' ');
  }

  // Handle noun-only shortcuts like "brake" or "10-8" or "10-80"
  if (first === 'brake' || first === 'slow') {
    verb = 'steer';
    noun = 'brake';
  } else if (code && (first === code || first === '10-8' || first === '10-80' || first === '10-97')) {
    verb = 'radio';
    noun = code;
  } else if (first === 'save' || first === 'restore') {
    noun = rawWords.slice(1).join('-') || 'quicksave';
  }

  return {
    raw,
    normalized,
    verb,
    noun,
    target: rest.join(' '),
    code,
    words,
  };
}
