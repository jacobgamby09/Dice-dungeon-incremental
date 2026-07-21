import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { RELICS, type RelicId } from '../relics'

export function RelicHud() {
  const activeRelics = useGameStore((s) => s.activeRelics)
  const lastRelicTrigger = useGameStore((s) => s.lastRelicTrigger)
  const [selectedRelic, setSelectedRelic] = useState<RelicId | null>(null)

  if (activeRelics.length === 0) return null

  const selected = selectedRelic ? RELICS[selectedRelic] : null

  return (
    <div style={{
      position: 'relative',
      background: '#0f0f1a',
      borderBottom: '3px solid #000',
      padding: '7px 16px 8px',
      minHeight: 50,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        {activeRelics.map((id) => {
          const relic = RELICS[id]
          const isTriggered = lastRelicTrigger?.id === id
          return (
            <motion.button
              key={id}
              className="pixel-btn"
              onClick={() => setSelectedRelic(selectedRelic === id ? null : id)}
              animate={isTriggered ? {
                boxShadow: [
                  `2px 2px 0 #000, 0 0 0 ${relic.accent}`,
                  `2px 2px 0 #000, 0 0 14px ${relic.accent}`,
                  `2px 2px 0 #000, 0 0 0 ${relic.accent}`,
                ],
              } : {}}
              transition={{ duration: 0.75 }}
              style={{
                width: 38,
                height: 38,
                padding: 2,
                background: '#111827',
                border: `2px solid ${selectedRelic === id ? '#fff7ed' : relic.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={relic.name}
            >
              <img
                src={relic.icon}
                alt=""
                style={{ width: 30, height: 30, imageRendering: 'pixelated' }}
              />
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {lastRelicTrigger && (
          <motion.div
            key={lastRelicTrigger.version}
            style={{
              position: 'absolute',
              left: '50%',
              top: -6,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              fontSize: '0.64rem',
              fontWeight: 900,
              color: RELICS[lastRelicTrigger.id].accent,
              textShadow: '1px 1px 0 #000, 0 0 7px #000',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 0], y: [8, -4, -12] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            {RELICS[lastRelicTrigger.id].shortName}: {lastRelicTrigger.label}
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <div style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 'calc(100% + 6px)',
          zIndex: 80,
          display: 'grid',
          gridTemplateColumns: '42px 1fr',
          gap: 9,
          alignItems: 'center',
          background: '#09090f',
          border: `2px solid ${selected.accent}`,
          boxShadow: '4px 4px 0 #000',
          padding: 8,
        }}>
          <img src={selected.icon} alt="" style={{ width: 38, height: 38, imageRendering: 'pixelated' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: selected.accent, fontWeight: 900 }}>{selected.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#d1d5db', lineHeight: 1.5, marginTop: 4 }}>
              {selected.description}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
