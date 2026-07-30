import {
  Bot,
  Cross,
  Dices,
  Hand,
  HeartPulse,
  Layers3,
  Map,
  Skull,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Flame,
  Gem,
  Zap,
  BookOpen,
  Coins,
  Hammer,
  Sword,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TalentIconKey } from '../../game/types/progression'

const TALENT_ICONS: Record<TalentIconKey, LucideIcon> = {
  'battle-heart': HeartPulse,
  'twin-dice': Dices,
  shieldcraft: ShieldPlus,
  'second-descent': Map,
  'battle-heart-advanced': Shield,
  'third-grip': Hand,
  'quick-draw': Zap,
  'healing-arts': Cross,
  'auto-roll': Bot,
  'fourth-grip': Layers3,
  'executioner-die': Skull,
  'tower-die': ShieldCheck,
  'volatile-temper': Flame,
  'face-mastery': Sparkles,
  'fate-seal': Gem,
  'striker-pattern': Sword,
  'soul-efficiency': Coins,
  'xp-efficiency': BookOpen,
  'workshop-efficiency': Hammer,
}

interface TalentIconProps {
  iconKey: TalentIconKey
  size?: number
}

export function TalentIcon({ iconKey, size = 25 }: TalentIconProps) {
  const Icon = TALENT_ICONS[iconKey]
  return <Icon aria-hidden="true" size={size} strokeWidth={2.4} />
}
