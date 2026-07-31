import { TALENT_IDS } from '../content/talents'
import type { PlayerProfile } from '../types/progression'
import { createPostDungeonOneDevProfile } from './postDungeonOnePreset'

export const FATECRAFT_START_DEV_PRESET = {
  charmSlots: 1,
  fateTokens: 0,
  ownedCharms: 0,
  pity: 0,
} as const

export function createFatecraftStartProfile(baseProfile: PlayerProfile): PlayerProfile {
  const postDungeonOneProfile = createPostDungeonOneDevProfile(baseProfile)

  return {
    ...postDungeonOneProfile,
    fateTokens: FATECRAFT_START_DEV_PRESET.fateTokens,
    fatePity: FATECRAFT_START_DEV_PRESET.pity,
    talentRanks: {
      ...postDungeonOneProfile.talentRanks,
      [TALENT_IDS.fieldStudies]: 1,
      [TALENT_IDS.fatecraft]: 1,
    },
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
  }
}
