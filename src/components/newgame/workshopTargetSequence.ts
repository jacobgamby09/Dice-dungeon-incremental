export function createForwardTargetSequence(
  faceIds: readonly string[],
  targetFaceId: string,
  previousTargetFaceId: string | null = null,
  minimumTicks = 10,
): string[] {
  if (faceIds.length === 0 || !faceIds.includes(targetFaceId)) return []

  const previousIndex = previousTargetFaceId
    ? faceIds.indexOf(previousTargetFaceId)
    : -1
  const startIndex = previousIndex >= 0
    ? (previousIndex + 1) % faceIds.length
    : 0
  const sequence: string[] = []
  let index = startIndex

  do {
    sequence.push(faceIds[index])
    index = (index + 1) % faceIds.length
  } while (
    sequence.length < Math.max(1, minimumTicks)
    || sequence.at(-1) !== targetFaceId
  )

  return sequence
}

export function getTargetTickDelay(index: number, totalTicks: number): number {
  if (totalTicks <= 1) return 45
  const progress = index / (totalTicks - 1)
  return Math.round(42 + (progress ** 2) * 112)
}
