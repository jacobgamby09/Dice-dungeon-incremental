import {
  Bot,
  Cross,
  Dices,
  Hand,
  HeartPulse,
  Layers3,
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
  Link2,
  Network,
  Clover,
  Droplets,
  Search,
  Badge,
  Pickaxe,
  RotateCcw,
  Recycle,
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
  'executioner-die': Skull,
  'tower-die': ShieldCheck,
  'bloodwell-die': Droplets,
  'volatile-temper': Flame,
  'face-mastery': Sparkles,
  'fate-seal': Gem,
  'striker-pattern': Sword,
  'soul-efficiency': Coins,
  'xp-efficiency': BookOpen,
  'workshop-efficiency': Hammer,
  'charm-pair': Link2,
  'charm-trinity': Network,
  'fate-favor': Clover,
  'occult-prospecting': Search,
  'resonant-etching': Badge,
  'deep-delver': Pickaxe,
  'forge-overcharge': Zap,
  reforging: RotateCcw,
  'careful-salvage': Recycle,
  'auto-forge': Bot,
}

interface TalentIconProps {
  iconKey: TalentIconKey
  size?: number
}

export function TalentIcon({ iconKey, size = 25 }: TalentIconProps) {
  const Icon = TALENT_ICONS[iconKey]
  return <Icon aria-hidden="true" size={size} strokeWidth={2.4} />
}
