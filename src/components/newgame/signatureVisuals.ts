import type { CSSProperties } from 'react'
import type { SignatureFaceId } from '../../game/types/dice'

interface SignatureVisual {
  accent: string
  highlight: string
  shadow: string
  surface: string
}

export const SIGNATURE_VISUALS: Record<SignatureFaceId, SignatureVisual> = {
  execute: {
    accent: '#f97316',
    highlight: '#fff7ed',
    shadow: '#431407',
    surface: '#9a3412',
  },
  fortify: {
    accent: '#38bdf8',
    highlight: '#f0f9ff',
    shadow: '#082f49',
    surface: '#075985',
  },
  drain: {
    accent: '#f43f5e',
    highlight: '#fff1f2',
    shadow: '#4c0519',
    surface: '#881337',
  },
}

export function getSignatureVisualStyle(signatureId: SignatureFaceId): CSSProperties {
  const visual = SIGNATURE_VISUALS[signatureId]
  return {
    '--signature-accent': visual.accent,
    '--signature-highlight': visual.highlight,
    '--signature-shadow': visual.shadow,
    '--signature-surface': visual.surface,
  } as CSSProperties
}
