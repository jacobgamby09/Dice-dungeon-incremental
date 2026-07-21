import { Biohazard, FlaskConical, Skull, Swords } from 'lucide-react'
import type React from 'react'
import { DIE_NAMES, useGameStore } from '../store/gameStore'
import type { DieType } from '../store/gameStore'
import { dieTypeStyle } from './DieCard'

const ACT_2_DICE: Array<{ type: DieType; note: string }> = [
  { type: 'blight', note: 'Poison pressure that keeps working through Shield.' },
  { type: 'fortune_teller', note: 'Bag control for choosing the right next die.' },
  { type: 'priest', note: 'Pure healing for longer, slower fights.' },
  { type: 'unique', note: 'Triple the next die, but timing matters.' },
  { type: 'jackpot', note: 'Huge spike damage with huge boss risk.' },
]

function DiceRow({ type, note }: { type: DieType; note: string }) {
  const s = dieTypeStyle[type]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 8px',
      background: '#10101c',
      border: `2px solid ${s.shadow}`,
      boxShadow: `2px 2px 0 ${s.shadow}`,
    }}>
      <div style={{
        width: 16, height: 16, flexShrink: 0,
        background: s.bg,
        border: '2px solid #000',
        boxShadow: `1px 1px 0 ${s.shadow}`,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{
          fontSize: '0.58rem', fontWeight: 900,
          color: s.bg, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {DIE_NAMES[type]}
        </span>
        <span style={{
          fontSize: '0.56rem', color: '#9ca3af',
          lineHeight: 1.35, letterSpacing: '0.04em',
        }}>
          {note}
        </span>
      </div>
    </div>
  )
}

function MechanicRow({
  icon,
  title,
  body,
  color,
}: {
  icon: React.ReactNode
  title: string
  body: string
  color: string
}) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      background: '#10101c',
      border: `2px solid ${color}`,
      boxShadow: '2px 2px 0 #000',
      padding: '8px',
    }}>
      <div style={{ width: 18, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 1 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 900,
          color, letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          fontSize: '0.58rem', color: '#cbd5e1',
          lineHeight: 1.45, letterSpacing: '0.04em',
        }}>
          {body}
        </span>
      </div>
    </div>
  )
}

export function ActIntroModal() {
  const claimActIntro = useGameStore((s) => s.claimActIntro)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      maxWidth: 384, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.94)',
      padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 336,
        background: '#05030a',
        border: '3px solid #84cc16',
        boxShadow: '0 0 28px 6px rgba(132,204,22,0.35), 6px 6px 0 #000',
        padding: '16px 14px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <Biohazard size={28} color="#a3e635" strokeWidth={2.5} />
          <span style={{
            fontSize: '0.62rem', fontWeight: 900,
            color: '#a3e635', letterSpacing: '0.24em',
            textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(163,230,53,0.75)',
          }}>
            Act 2 Begins
          </span>
          <span style={{
            fontSize: '0.95rem', fontWeight: 900,
            color: '#ecfccb', letterSpacing: '0.1em',
            textTransform: 'uppercase', textAlign: 'center',
            textShadow: '2px 2px 0 #000',
          }}>
            The Spiked Depths
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 7,
        }}>
          <MechanicRow
            icon={<FlaskConical size={17} color="#a3e635" strokeWidth={2.5} />}
            title="Venom"
            color="#65a30d"
            body="Each floor has a safe draw limit. Drawing past it adds player Venom that deals unblockable HP damage after the enemy acts."
          />
          <MechanicRow
            icon={<Swords size={17} color="#fb923c" strokeWidth={2.5} />}
            title="Boss rotation"
            color="#ea580c"
            body="The Act 2 boss cycles Shield, heavy attacks, active Thorns turns, and Pierce strikes that ignore Shield."
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: '#e5e7eb', fontSize: '0.6rem', fontWeight: 900,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          paddingTop: 2,
        }}>
          <Skull size={13} color="#a855f7" />
          New Act 2 Dice
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ACT_2_DICE.map((die) => (
            <DiceRow key={die.type} type={die.type} note={die.note} />
          ))}
        </div>

        <button
          onClick={claimActIntro}
          className="pixel-btn"
          style={{
            marginTop: 2,
            background: '#365314',
            color: '#ecfccb',
            textShadow: '1px 1px 0 #000',
            boxShadow: '3px 3px 0 #000, 0 0 12px rgba(132,204,22,0.4)',
            letterSpacing: '0.12em',
          }}
        >
          ENTER ACT 2
        </button>
      </div>
    </div>
  )
}
