import type { AttackEvolutionId } from '../../game/types/dice'

interface EvolutionIconProps {
  evolutionId: AttackEvolutionId
  size?: number
}

export function EvolutionIcon({ evolutionId, size = 18 }: EvolutionIconProps) {
  if (evolutionId === 'momentum') {
    return (
      <svg
        aria-hidden="true"
        className="evolution-icon evolution-icon--momentum"
        data-evolution-icon="momentum"
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <path d="M2.5 4.5 8.5 12l-6 7.5M8 4.5l6 7.5-6 7.5M13.5 4.5l6 7.5-6 7.5" />
      </svg>
    )
  }

  if (evolutionId === 'rend') {
    return (
      <svg
        aria-hidden="true"
        className="evolution-icon evolution-icon--rend"
        data-evolution-icon="rend"
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <path d="m8.5 2.5-3 7 3 2-4 10M15 2.5l-3 8 3 2-3 9M20 4l-2.5 6.5 2 2-2.5 7" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="evolution-icon evolution-icon--power"
      data-evolution-icon="power"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="m12 1.75 2.55 6.05 6.2 2.7-6.2 2.65L12 20l-2.55-6.85-6.2-2.65 6.2-2.7L12 1.75Z" />
      <path d="M12 6.6v7.8M8.2 10.5h7.6" />
    </svg>
  )
}
