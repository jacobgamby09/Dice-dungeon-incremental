import type { FaceEvolutionId } from '../../game/types/dice'

interface EvolutionIconProps {
  evolutionId: FaceEvolutionId
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

  const paths: Partial<Record<FaceEvolutionId, string>> = {
    bastion: 'M4 3h16v7c0 5.2-3.2 9.3-8 11-4.8-1.7-8-5.8-8-11V3Zm4 5h8M8 12h8',
    reserve: 'M5 4h14v16H5V4Zm4 4h6v5H9V8Zm3 5v5',
    spikes: 'M3 18 7 6l3 7 2-10 3 10 2-7 4 12H3Z',
    restoration: 'M12 20s-8-4.6-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.4-8 10-8 10Zm0-9v5m-2.5-2.5h5',
    regrowth: 'M12 21V9m0 4c-4 0-7-2.2-7-6 4 0 7 2.2 7 6Zm0 3c4 0 7-2.2 7-6-4 0-7 2.2-7 6Z',
    overflow: 'M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Zm-3 12c1.7 1.2 4.3 1.2 6 0',
  }
  const familyPath = paths[evolutionId]
  if (familyPath) {
    return (
      <svg
        aria-hidden="true"
        className={`evolution-icon evolution-icon--${evolutionId}`}
        data-evolution-icon={evolutionId}
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <path d={familyPath} />
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
