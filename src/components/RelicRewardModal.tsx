import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { MAX_RELICS, RELICS, type RelicId } from '../relics'

export function RelicRewardModal() {
  const activeRelics = useGameStore((s) => s.activeRelics)
  const relicChoices = useGameStore((s) => s.relicChoices)
  const context = useGameStore((s) => s.relicRewardContext)
  const claimRelic = useGameStore((s) => s.claimRelic)
  const skipRelicReward = useGameStore((s) => s.skipRelicReward)
  const [pendingRelic, setPendingRelic] = useState<RelicId | null>(null)

  if (relicChoices.length === 0) return null

  const isFull = activeRelics.length >= MAX_RELICS
  const pending = pendingRelic ? RELICS[pendingRelic] : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      maxWidth: 384, margin: '0 auto',
      background: 'rgba(0,0,0,0.86)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        background: '#12121f',
        border: '3px solid #fbbf24',
        boxShadow: '0 0 28px rgba(251,191,36,0.35), 5px 5px 0 #000',
        padding: 14,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.62rem', color: '#fbbf24', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            {context === 'boss' ? 'boss relic' : 'starting relic'}
          </div>
          <div style={{ fontSize: '1.05rem', color: '#fff7ed', fontWeight: 900, marginTop: 5 }}>
            CHOOSE 1 RELIC
          </div>
          <div style={{ fontSize: '0.72rem', color: '#aeb7c5', lineHeight: 1.45, marginTop: 4 }}>
            Relics last for this run. You can carry up to {MAX_RELICS}.
          </div>
        </div>

        {pending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              background: '#0a0a14', border: `2px solid ${pending.accent}`,
              padding: 8,
            }}>
              <img src={pending.icon} alt="" style={{ width: 42, height: 42, imageRendering: 'pixelated' }} />
              <div>
                <div style={{ fontSize: '0.86rem', color: pending.accent, fontWeight: 900 }}>{pending.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#d1d5db', lineHeight: 1.5 }}>{pending.description}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#fef3c7', lineHeight: 1.45 }}>
              Your relic slots are full. Replace one relic, or skip this reward.
            </div>
            {activeRelics.map((id) => {
              const relic = RELICS[id]
              return (
                <button
                  key={id}
                  className="pixel-btn"
                  onClick={() => claimRelic(pending.id, id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#1f2937',
                    border: `2px solid ${relic.accent}`,
                    padding: 8, minHeight: 50, textAlign: 'left',
                  }}
                >
                  <img src={relic.icon} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated', flexShrink: 0 }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.76rem', color: relic.accent, fontWeight: 900 }}>REPLACE {relic.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#aeb7c5', lineHeight: 1.35 }}>{relic.description}</span>
                  </span>
                </button>
              )
            })}
            <button
              className="pixel-btn"
              onClick={skipRelicReward}
              style={{ background: '#374151', height: 46, fontSize: '0.78rem' }}
            >
              KEEP CURRENT RELICS
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relicChoices.map((id) => {
              const relic = RELICS[id]
              return (
                <button
                  key={id}
                  className="pixel-btn"
                  onClick={() => isFull ? setPendingRelic(id) : claimRelic(id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr',
                    gap: 10,
                    alignItems: 'center',
                    background: '#0a0a14',
                    border: `2px solid ${relic.accent}`,
                    boxShadow: `3px 3px 0 #000`,
                    padding: 8,
                    minHeight: 68,
                    textAlign: 'left',
                  }}
                >
                  <img src={relic.icon} alt="" style={{ width: 46, height: 46, imageRendering: 'pixelated' }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.84rem', color: relic.accent, fontWeight: 900 }}>{relic.name}</span>
                    <span style={{ fontSize: '0.76rem', color: '#d1d5db', lineHeight: 1.45 }}>{relic.description}</span>
                  </span>
                </button>
              )
            })}
            <button
              className="pixel-btn"
              onClick={skipRelicReward}
              style={{
                marginTop: 4,
                background: '#3f3f46',
                height: 44,
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              SKIP RELIC
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
