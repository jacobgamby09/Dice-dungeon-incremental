import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import type { PlayerProfile } from '../types/progression'

export const EARLY_QOL_TEST_TALENT_PATH = [
  TALENT_IDS.battleHardenedOne,
  TALENT_IDS.twinArsenal,
  TALENT_IDS.autoCombat,
  TALENT_IDS.shieldcraft,
  TALENT_IDS.quickDraw,
] as const

export const EARLY_QOL_TEST_XP = EARLY_QOL_TEST_TALENT_PATH.reduce(
  (total, talentId) => total + TALENTS_BY_ID[talentId].ranks[0].cost,
  0,
)

export function createEarlyQolTestProfile(baseProfile: PlayerProfile): PlayerProfile {
  return {
    ...baseProfile,
    xp: EARLY_QOL_TEST_XP,
  }
}
