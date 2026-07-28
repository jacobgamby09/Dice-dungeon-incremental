import { Droplets, Gauge, Swords } from 'lucide-react'
import type { AttackEvolutionId } from '../../game/types/dice'

interface EvolutionIconProps {
  evolutionId: AttackEvolutionId
  size?: number
}

export function EvolutionIcon({ evolutionId, size = 18 }: EvolutionIconProps) {
  if (evolutionId === 'momentum') return <Gauge aria-hidden="true" size={size} />
  if (evolutionId === 'rend') return <Droplets aria-hidden="true" size={size} />
  return <Swords aria-hidden="true" size={size} />
}
