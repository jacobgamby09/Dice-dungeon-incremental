import type { DieFace, DieType } from './store/gameStore'

export const DIE_ROLES: Record<DieType, string> = {
  white: 'Reliable damage die.',
  blue: 'Defensive die that builds Shield with a little damage.',
  green: 'Hybrid sustain die with healing and light damage.',
  cursed: 'Penalty die. Every face is a Skull and it cannot be unequipped.',
  heavy: 'High damage die with meaningful bust risk.',
  paladin: 'Pure sustain die. Great for surviving, but deals no damage.',
  gambler: 'Boom-or-bust damage die with blanks and Skulls.',
  scavenger: 'Economy and defense die that earns Souls safely.',
  wall: 'Pure Shield die for defensive turns.',
  jackpot: 'Unique spike damage die. Huge payoff, huge risk.',
  vampire: 'Unique lifesteal die that turns offense into sustain.',
  priest: 'Unique healing engine with no offense.',
  fortune_teller: 'Unique control die that lets you choose upcoming draws.',
  joker: 'Forge catalyst die. It exists to merge with another die type.',
  unique: 'Unique multiplier die that triples the next die effect.',
  blight: 'Poison die that stacks unblockable delayed damage.',
  rejuvenator: 'Healing-over-time die with Shield and craftable blanks.',
  mirror: 'Unique copy die that repeats the previous die face.',
  vessel: 'Long-term Forge project die. It starts blank, then tempers as every face is shaped.',
  warden: 'Defensive anti-bust die that seals Skulls back into the bag.',
  bulwark: 'Shield-combo die that turns built Shield into damage.',
}

export const DIE_TIPS: Partial<Record<DieType, string>> = {
  cursed: 'Cursed dice make every turn more dangerous because three Skulls causes a bust.',
  heavy: 'Best when you can stop early or protect yourself from busts.',
  paladin: 'Pairs well with Poison, Lifesteal, and slower Act 2 fights.',
  gambler: 'Dangerous into Thorns because one big hit can reflect hard.',
  scavenger: 'Good when you want more Forge options without giving up all defense.',
  wall: 'Strong against normal attacks, weak against Pierce/Corrosive damage.',
  jackpot: 'Try to avoid using it on active Thorns turns.',
  vampire: 'Can stabilize aggressive builds by healing while dealing damage.',
  priest: 'Buys time for Poison, Rejuvenator, and control builds.',
  fortune_teller: 'If multiplied, it can choose multiple upcoming dice.',
  joker: 'Use it in The Forge as universal merge material. The Joker is consumed and the other die levels up.',
  unique: 'Auto-roll stops on this die so you can decide what to multiply.',
  blight: 'Poison bypasses Shield and keeps ticking down each enemy phase.',
  rejuvenator: 'Stacks additively. When merged, only HP per tick increases; duration stays the same. A 2 HP / 2 turn buff plus 1 HP / 1 turn becomes 3 HP / 3 turns, then decays each tick.',
  mirror: 'Does nothing if there is no previous die face to copy.',
  vessel: 'The Vessel cannot be merged normally. It can recraft shaped faces directly; when all six faces match its current Tempered level, it advances to the next craft quality.',
  warden: 'Seal removes a rolled Skull from this turn and returns that die to the draw pile. The danger is delayed, not deleted.',
  bulwark: 'Shield Bash deals damage equal to your current Shield without spending that Shield.',
}

export const FACE_DESCRIPTIONS: Record<DieFace['type'], string> = {
  damage: 'Adds damage to this turn. Applied when you Attack.',
  shield: 'Adds Shield for this turn. Shield blocks normal enemy damage.',
  heal: 'Restores HP up to your max HP.',
  skull: 'Adds a Skull. Three Skulls in one turn causes a bust.',
  souls: 'Adds Run Souls immediately. They are lost if you die before fleeing.',
  lifesteal: 'Deals damage and heals you for the same amount.',
  choose_next: 'Opens the bag picker and lets you choose the next die drawn.',
  wildcard: 'Joker face. No combat effect; The Joker is used as universal merge material in The Forge.',
  blank: 'No combat effect. Blank faces can be crafted into useful faces at The Forge.',
  purified_skull: 'An inert Skull. It does not count toward busting.',
  multiplier: 'Multiplies the next die effect, then resets.',
  poison: 'Adds Poison to the enemy when you Attack. Poison ignores Shield, ticks after the enemy acts, then decays by 1.',
  hot: 'Adds healing over time. Both healing amount and duration stack, then both decay each tick.',
  mirror: 'Repeats the previous die face. If the previous face was a setup effect, it repeats that setup.',
  seal: 'Removes a rolled Skull from this turn and returns that die to the draw pile.',
  shield_bash: 'Deals damage equal to your current Shield. Your Shield is not spent.',
}

export function describeFace(face: DieFace): string {
  if (face.type === 'hot') {
    return `Heal ${face.value} HP for ${face.duration ?? 1} turn${(face.duration ?? 1) === 1 ? '' : 's'}. Stacks amount and duration.`
  }
  if (face.type === 'seal') return `Seal ${face.value} Skull${face.value === 1 ? '' : 's'} back into the draw pile.`
  if (face.type === 'shield_bash') return 'Shield Bash: deal damage equal to your current Shield.'
  if (face.type === 'multiplier') return `Multiply the next die effect by x${face.value}.`
  if (face.value > 0 && ['damage', 'shield', 'heal', 'souls', 'lifesteal', 'poison'].includes(face.type)) {
    return `${face.value} ${FACE_DESCRIPTIONS[face.type]}`
  }
  return FACE_DESCRIPTIONS[face.type]
}
