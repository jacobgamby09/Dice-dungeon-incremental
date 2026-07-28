import type { CSSProperties } from 'react'
import type { AttackEvolutionId } from '../../game/types/dice'

interface EvolutionVisual {
  accent: string
  highlight: string
  shadow: string
  surface: string
}

export const EVOLUTION_VISUALS: Record<AttackEvolutionId, EvolutionVisual> = {
  power: {
    accent: '#fde68a',
    highlight: '#fff7d6',
    shadow: '#3f2306',
    surface: '#854d0e',
  },
  momentum: {
    accent: '#67e8f9',
    highlight: '#ecfeff',
    shadow: '#082f49',
    surface: '#155e75',
  },
  rend: {
    accent: '#fb7185',
    highlight: '#ffe4e6',
    shadow: '#4c0519',
    surface: '#881337',
  },
}

export function getEvolutionVisualStyle(evolutionId: AttackEvolutionId): CSSProperties {
  const visual = EVOLUTION_VISUALS[evolutionId]
  return {
    '--evolution-accent': visual.accent,
    '--evolution-highlight': visual.highlight,
    '--evolution-shadow': visual.shadow,
    '--evolution-surface': visual.surface,
  } as CSSProperties
}
