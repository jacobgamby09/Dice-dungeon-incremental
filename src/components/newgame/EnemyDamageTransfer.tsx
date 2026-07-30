import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Swords } from 'lucide-react'

export interface EnemyDamageTransferPath {
  blocked: number
  fromX: number
  fromY: number
  incoming: number
  taken: number
  toX: number
  toY: number
}

interface EnemyDamageTransferProps {
  onComplete: () => void
  path: EnemyDamageTransferPath
}

export const EnemyDamageTransfer = memo(function EnemyDamageTransfer({
  onComplete,
  path,
}: EnemyDamageTransferProps) {
  const fullyBlocked = path.blocked > 0 && path.taken === 0
  const partiallyBlocked = path.blocked > 0 && path.taken > 0
  const style = {
    left: path.fromX,
    top: path.fromY,
  } as CSSProperties

  return (
    <div aria-hidden="true" className="enemy-damage-transfer-origin" style={style}>
      <motion.div
        animate={{
          opacity: [0, 1, 1, 0],
          rotate: [0, -8, 5, 0],
          scale: [0.7, 1.1, 1, 1.35],
          x: path.toX - path.fromX,
          y: [0, 24, path.toY - path.fromY],
        }}
        className={`enemy-damage-transfer${fullyBlocked ? ' enemy-damage-transfer--blocked' : ''}${partiallyBlocked ? ' enemy-damage-transfer--partial' : ''}`}
        initial={{ opacity: 0, scale: 0.7, x: 0, y: 0 }}
        onAnimationComplete={onComplete}
        transition={{ duration: 0.58, ease: [0.3, 0.75, 0.25, 1], times: [0, 0.2, 0.78, 1] }}
      >
        {fullyBlocked ? <ShieldCheck size={18} /> : <Swords size={18} />}
        <strong>{path.incoming}</strong>
        <small>
          {fullyBlocked
            ? `${path.blocked} blocked`
            : partiallyBlocked
              ? `${path.blocked} block · ${path.taken} damage`
              : `${path.taken} damage`}
        </small>
        <span className="enemy-damage-transfer__burst" />
      </motion.div>
    </div>
  )
})
