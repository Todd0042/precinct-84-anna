/**
 * Precinct 84 Patrolman's Field Guide ([F1] / `manual`).
 * Gives players fair, authentic Police Quest procedure rules in-world.
 */

export const POLICE_MANUAL = [
  {
    id: 'radio',
    title: 'SEC 1: RADIO 10-CODES & DISPATCH',
    lines: [
      '10-4 Ack | 10-8 On Patrol | 10-20 Location',
      '10-80 Pursuit | 10-97 On Scene | 10-15 Custody',
      'Code 3: Lights + Siren | SWAT: Tactical Backup',
    ],
  },
  {
    id: 'walkaround',
    title: 'SEC 2: LOCKER & CRUISER WALK-AROUND',
    lines: [
      '1. Take Duty Belt (.38, cuffs, kit) & keys.',
      '2. Walk-Around: inspect tires before rollout.',
      '3. Inspect trunk gear and fasten seatbelt.',
    ],
  },
  {
    id: 'felony_stop',
    title: 'SEC 3: 7-STEP FELONY STOP PROTOCOL',
    lines: [
      '1. Draw weapon behind door; order suspect out.',
      '2. Holster sidearm before cuffing; then search.',
      '3. Read Miranda rights; search trunk & bag items.',
    ],
  },
  {
    id: 'forensics_raid',
    title: 'SEC 4: FORENSICS & HARBOR TACTICAL BREACH',
    lines: [
      '1. Record interviews (recorder on + Miranda).',
      '2. Inspect door traps; stand aside before knock.',
      '3. Dust/lift/compare safe; SWAT + Warrant + Freeze.',
    ],
  },
];
