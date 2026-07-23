import {
  Bot,
  Cross,
  Dices,
  Hand,
  HeartPulse,
  Layers3,
  Shield,
  ShieldPlus,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TalentIconKey } from '../../game/types/progression'

const TALENT_ICONS: Record<TalentIconKey, LucideIcon> = {
  'battle-heart': HeartPulse,
  'twin-dice': Dices,
  shieldcraft: ShieldPlus,
  'battle-heart-advanced': Shield,
  'third-grip': Hand,
  'quick-draw': Zap,
  'healing-arts': Cross,
  'auto-roll': Bot,
  'fourth-grip': Layers3,
}

interface TalentIconProps {
  iconKey: TalentIconKey
  size?: number
}

export function TalentIcon({ iconKey, size = 25 }: TalentIconProps) {
  const Icon = TALENT_ICONS[iconKey]
  return <Icon aria-hidden="true" size={size} strokeWidth={2.4} />
}
