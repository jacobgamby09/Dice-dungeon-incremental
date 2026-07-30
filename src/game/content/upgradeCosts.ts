export const BASE_FACE_CAP = 5

export function getFaceUpgradeCost(currentValue: number): number | null {
  if (currentValue >= BASE_FACE_CAP) return null
  return 1
}
