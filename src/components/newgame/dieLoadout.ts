export function getDieLoadoutSlotIndex(
  equippedDieIds: readonly string[],
  dieId: string,
): number | null {
  const slotIndex = equippedDieIds.indexOf(dieId)
  return slotIndex >= 0 ? slotIndex : null
}
