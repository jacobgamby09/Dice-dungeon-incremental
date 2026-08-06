import { memo } from 'react'
import { Biohazard, Eraser, Heart, Shield, Sparkles, Swords, Volume2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FaceType } from '../../game/types/dice'
import { FACE_META } from './faceVisuals'

interface FaceIconProps {
  type: FaceType
  size?: number
}

const FACE_ICONS: Record<FaceType, LucideIcon> = {
  attack: Swords,
  shield: Shield,
  heal: Heart,
  poison: Biohazard,
  empower: Sparkles,
  weaken: Volume2,
  cleanse: Eraser,
}

export const FaceIcon = memo(function FaceIcon({ type, size = 18 }: FaceIconProps) {
  const color = FACE_META[type].color
  const Icon = FACE_ICONS[type]
  return <Icon aria-hidden="true" color={color} size={size} strokeWidth={2.8} />
})
