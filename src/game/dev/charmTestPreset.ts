import { TALENT_IDS } from '../content/talents'
import type { CharmId } from '../types/charms'
import type { PlayerProfile } from '../types/progression'
import { createPostDungeonOneDevProfile } from './postDungeonOnePreset'

export const CHARM_TEST_DEV_PRESET = {
  fateTokens: 15,
  ownedCharms: 3,
  equippedCharms: 2,
  pity: 4,
} as const

export function createCharmTestProfile(baseProfile: PlayerProfile): PlayerProfile {
  const postDungeonOneProfile = createPostDungeonOneDevProfile(baseProfile)

  return {
    ...postDungeonOneProfile,
    fateTokens: CHARM_TEST_DEV_PRESET.fateTokens,
    fatePity: CHARM_TEST_DEV_PRESET.pity,
    talentRanks: {
      ...postDungeonOneProfile.talentRanks,
      [TALENT_IDS.fieldStudies]: 1,
      [TALENT_IDS.fatecraft]: 1,
      [TALENT_IDS.wovenPair]: 1,
    },
    charmRanks: {
      'blade-rhythm': 1,
      'echo-knot': 1,
      'ward-clock': 1,
    },
    equippedCharmIds: ['blade-rhythm', 'ward-clock'] satisfies CharmId[],
    pendingFateDraw: null,
    recentFateOperationIds: [],
  }
}
