export function shuffleDieIds(
  dieIds: readonly string[],
  rng: () => number = Math.random,
): string[] {
  const shuffled = [...dieIds]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const boundedRoll = Math.min(0.999999999, Math.max(0, rng()))
    const swapIndex = Math.floor(boundedRoll * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}
