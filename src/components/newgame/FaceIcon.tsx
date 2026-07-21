import { memo } from 'react'
import { Heart, Shield, Swords } from 'lucide-react'
import type { FaceType } from '../../game/types/dice'
import { FACE_META } from './faceVisuals'

interface FaceIconProps {
  type: FaceType
  size?: number
}

export const FaceIcon = memo(function FaceIcon({ type, size = 18 }: FaceIconProps) {
  const color = FACE_META[type].color
  if (type === 'attack') return <Swords aria-hidden="true" color={color} size={size} strokeWidth={2.8} />
  if (type === 'shield') return <Shield aria-hidden="true" color={color} size={size} strokeWidth={2.8} />
  return <Heart aria-hidden="true" color={color} size={size} strokeWidth={2.8} />
})
