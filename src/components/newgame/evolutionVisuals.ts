import type { CSSProperties } from 'react'
import type { FaceEvolutionId } from '../../game/types/dice'

interface EvolutionVisual {
  accent: string
  highlight: string
  shadow: string
  surface: string
}

export const EVOLUTION_VISUALS: Record<FaceEvolutionId, EvolutionVisual> = {
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
  bastion: {
    accent: '#93c5fd',
    highlight: '#eff6ff',
    shadow: '#172554',
    surface: '#1d4ed8',
  },
  reserve: {
    accent: '#a5b4fc',
    highlight: '#eef2ff',
    shadow: '#1e1b4b',
    surface: '#3730a3',
  },
  spikes: {
    accent: '#c4b5fd',
    highlight: '#f5f3ff',
    shadow: '#3b0764',
    surface: '#6d28d9',
  },
  restoration: {
    accent: '#86efac',
    highlight: '#f0fdf4',
    shadow: '#052e16',
    surface: '#15803d',
  },
  regrowth: {
    accent: '#5eead4',
    highlight: '#f0fdfa',
    shadow: '#042f2e',
    surface: '#0f766e',
  },
  overflow: {
    accent: '#bef264',
    highlight: '#f7fee7',
    shadow: '#1a2e05',
    surface: '#4d7c0f',
  },
}

export function getEvolutionVisualStyle(evolutionId: FaceEvolutionId): CSSProperties {
  const visual = EVOLUTION_VISUALS[evolutionId]
  return {
    '--evolution-accent': visual.accent,
    '--evolution-highlight': visual.highlight,
    '--evolution-shadow': visual.shadow,
    '--evolution-surface': visual.surface,
  } as CSSProperties
}
