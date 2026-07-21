const G = '#3a7a2a'
const D = '#1e4716'
const E = '#fbbf24'
const M = '#dc2626'
const B = '#78350f'
const _ = null

const GRID: (string | null)[][] = [
  [_, _, _, D, D, D, D, _, _, _],
  [_, _, D, G, G, G, G, D, _, _],
  [_, D, G, G, G, G, G, G, D, _],
  [_, D, G, E, G, G, E, G, D, _],
  [_, D, G, G, G, G, G, G, D, _],
  [_, D, G, G, M, G, M, G, D, _],
  [_, _, D, G, G, G, G, D, _, _],
  [D, G, G, G, G, G, G, G, G, D],
  [_, _, G, G, B, B, G, G, _, _],
  [_, _, G, G, G, G, G, G, _, _],
  [_, _, G, G, _, _, G, G, _, _],
  [_, _, B, B, _, _, B, B, _, _],
]

export function GoblinSprite({ size = 4 }: { size?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(10, ${size}px)`,
      gridTemplateRows: `repeat(12, ${size}px)`,
    }}>
      {GRID.flat().map((color, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            background: color ?? 'transparent',
          }}
        />
      ))}
    </div>
  )
}
