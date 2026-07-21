export const BASE_FACE_CAP = 5

const UPGRADE_COSTS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 40,
  4: 100,
}

export function getFaceUpgradeCost(currentValue: number): number | null {
  if (currentValue >= BASE_FACE_CAP) return null
  return UPGRADE_COSTS[currentValue] ?? null
}

