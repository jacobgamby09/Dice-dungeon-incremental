import { IMPRINT_DEFINITIONS, createImprintInstance } from '../content/imprints'
import type { DieFaces, DieInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { ImprintDropReceipt, ImprintId, ImprintInstance } from '../types/imprints'

export function applyImprintsToDice(
  dice: readonly DieInstance[],
  imprints: readonly ImprintInstance[],
): DieInstance[] {
  return dice.map((die) => ({
    ...die,
    faces: die.faces.map((face) => {
      const instance = imprints.find((candidate) => (
        candidate.attachment?.dieId === die.id
        && candidate.attachment.faceId === face.id
      ))
      if (!instance) return { ...face }
      const definition = IMPRINT_DEFINITIONS[instance.definitionId]
      return {
        ...face,
        type: definition.type,
        value: Math.max(face.value, definition.baseValue) + Math.max(0, instance.refinement),
        imprint: {
          instanceId: instance.id,
          definitionId: definition.id,
          name: definition.name,
          description: definition.description,
          rarity: definition.rarity,
          effectKind: definition.effectKind,
          refinement: Math.max(0, instance.refinement),
        },
      }
    }) as DieFaces,
  }))
}

export function applyForgedFaceToBaseDie(
  baseDie: DieInstance,
  forgedEffectiveDie: DieInstance,
  faceId: string,
): DieInstance {
  const forgedFace = forgedEffectiveDie.faces.find((face) => face.id === faceId)
  if (!forgedFace) return baseDie
  return {
    ...baseDie,
    faces: baseDie.faces.map((face) => (
      face.id === faceId
        ? {
            ...face,
            value: forgedFace.value,
          }
        : face
    )) as DieFaces,
  }
}

export function canAttachImprint(
  dice: readonly DieInstance[],
  imprints: readonly ImprintInstance[],
  imprintId: string,
  dieId: string,
  faceId: string,
): boolean {
  const imprint = imprints.find((candidate) => candidate.id === imprintId)
  const die = dice.find((candidate) => candidate.id === dieId)
  const face = die?.faces.find((candidate) => candidate.id === faceId)
  if (!imprint || !die || !face || face.signature) return false
  const definition = IMPRINT_DEFINITIONS[imprint.definitionId]
  if (definition.type !== face.type) return false
  const occupied = imprints.some((candidate) => (
    candidate.id !== imprintId && candidate.attachment?.dieId === dieId
  ))
  if (occupied) return false
  if (definition.rarity === 'legendary') {
    return !imprints.some((candidate) => (
      candidate.id !== imprintId
      && candidate.attachment
      && IMPRINT_DEFINITIONS[candidate.definitionId].rarity === 'legendary'
    ))
  }
  return true
}

export function rollImprintDrop(options: {
  dungeonId: DungeonId
  floor: number
  isBoss: boolean
  clearCount: number
  owned: readonly ImprintInstance[]
  random?: () => number
  dropMultiplier?: number
  huntActive?: boolean
}): ImprintId | null {
  const random = options.random ?? Math.random
  const ownedIds = new Set(options.owned.map((instance) => instance.definitionId))
  if (
    (options.dungeonId === 'prototype-depths' || options.dungeonId === 'blighted-depths')
    && options.isBoss
    && options.clearCount === 0
  ) {
    const guaranteedId = options.dungeonId === 'prototype-depths' ? 'lead-edge' : 'venom-edge'
    if (!ownedIds.has(guaranteedId)) return guaranteedId
  }

  const candidates = (Object.values(IMPRINT_DEFINITIONS) as typeof IMPRINT_DEFINITIONS[ImprintId][])
    .filter((definition) => (
      definition.dungeonId === options.dungeonId && !ownedIds.has(definition.id)
    ))
  if (candidates.length === 0) return null

  const depthMultiplier = 0.55 + Math.max(1, options.floor) * 0.09
  const bossMultiplier = options.isBoss ? 5 : 1
  const chances: Record<ImprintId, number> = {
    'lead-edge': 0.016,
    'relay-strike': 0.008,
    crescendo: 0.002,
    'venom-edge': 0.018,
    'purging-aegis': 0.009,
    'plague-bloom': 0.0025,
  }
  const roll = Math.min(0.999999, Math.max(0, random()))
  let cursor = 0
  for (const candidate of candidates) {
    const huntMultiplier = options.huntActive ? 1.75 : 1
    cursor += chances[candidate.id] * depthMultiplier * bossMultiplier
      * Math.max(0, options.dropMultiplier ?? 1) * huntMultiplier
    if (roll < cursor) return candidate.id
  }
  return null
}

export function grantImprint(
  owned: readonly ImprintInstance[],
  definitionId: ImprintId,
  instanceId: string,
): ImprintInstance[] {
  if (owned.some((instance) => instance.definitionId === definitionId)) return [...owned]
  return [...owned, createImprintInstance(definitionId, instanceId)]
}

export function grantImprintDrop(
  owned: readonly ImprintInstance[],
  definitionId: ImprintId,
  instanceId: string,
): {
  imprints: ImprintInstance[]
  receipt: ImprintDropReceipt | null
} {
  if (owned.some((instance) => instance.definitionId === definitionId || instance.id === instanceId)) {
    return { imprints: [...owned], receipt: null }
  }
  const instance = createImprintInstance(definitionId, instanceId)
  return {
    imprints: [...owned, instance],
    receipt: { definitionId, instanceId: instance.id },
  }
}

export function getVerifiedImprintDropIds(
  receipts: readonly ImprintDropReceipt[],
  owned: readonly ImprintInstance[] = [],
): ImprintId[] {
  const ownedById = new Map(owned.map((instance) => [instance.id, instance.definitionId]))
  return receipts.flatMap((receipt) => (
    ownedById.get(receipt.instanceId) === receipt.definitionId
      ? [receipt.definitionId]
      : []
  ))
}
