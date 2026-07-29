import type { CSSProperties } from 'react'
import { Hammer } from 'lucide-react'
import type { WorkshopDieFace } from '../../game/types/workshop'
import { PhysicalDieCube } from './PhysicalDieCube'

interface WorkshopDieProps {
  appliedAmount: number | null
  faces: readonly WorkshopDieFace[]
  rolledFaceId: string | null
  stage: 'idle' | 'rolling' | 'landed'
}

export function WorkshopDie({
  appliedAmount,
  faces,
  rolledFaceId,
  stage,
}: WorkshopDieProps) {
  const rolledFaceIndex = Math.max(
    0,
    faces.findIndex((face) => face.id === rolledFaceId),
  )
  const isRolling = stage === 'rolling'
  const isLanded = stage === 'landed'

  return (
    <article
      aria-label={isRolling
        ? 'Workshop Die rolling'
        : isLanded
          ? `Workshop Die rolled plus ${appliedAmount ?? 1}`
          : `Workshop Die faces ${faces.map((face) => face.value).join(', ')}`}
      className={`workshop-power-die workshop-power-die--${stage}${(appliedAmount ?? 0) > 1 ? ' workshop-power-die--jackpot' : ''}`}
    >
      <PhysicalDieCube
        className="workshop-power-die__cube"
        faceIndex={rolledFaceIndex}
        faces={faces.map((face) => ({
          className: 'workshop-power-die__side',
          content: (
            <>
              <strong>{face.value}</strong>
              <Hammer size={18} />
            </>
          ),
          id: face.id,
          style: {
            '--side-color': '#f5cf72',
            '--side-surface': '#715318',
          } as CSSProperties,
        }))}
        rollDuration={0.9}
        stage={stage}
      />
    </article>
  )
}
