import type { ImprintId, ImprintRarity } from '../../game/types/imprints'

interface ImprintIconProps {
  id: ImprintId
  rarity?: ImprintRarity
  size?: number
}

export function ImprintIcon({ id, rarity = 'rare', size = 32 }: ImprintIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`imprint-icon imprint-icon--${rarity}`}
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      {id === 'lead-edge' ? (
        <path d="M5 25 22 8l5-3-3 5L8 27H5v-2Zm5-1-2-2 3-3 2 2-3 3Z" />
      ) : id === 'relay-strike' ? (
        <path d="M5 11h8v4H9v3h4v4H5v-4h2v-3H5v-4Zm14-1h8v4h-2v4h2v4h-8v-4h4v-4h-4v-4Zm-6 4h6v4h-6v-4Z" />
      ) : id === 'venom-edge' ? (
        <path d="m5 25 14-14 3 3L8 28H5v-3Zm16-21 6 6-3 3-6-6 3-3Zm-8 18 3-3 2 2-3 3-2-2Z" />
      ) : id === 'purging-aegis' ? (
        <path d="M16 3 27 7v8c0 7-5 11-11 14C10 26 5 22 5 15V7l11-4Zm0 5-6 2v5c0 4 2 7 6 9 4-2 6-5 6-9v-5l-6-2Zm-1 3h2v3h3v2h-3v3h-2v-3h-3v-2h3v-3Z" />
      ) : id === 'plague-bloom' ? (
        <path d="M16 4c2 4 5 4 8 2 1 5-1 8-5 10 4 1 6 4 6 8-4 1-7-1-9-4-2 3-5 5-9 4 0-4 2-7 6-8-4-2-6-5-5-10 3 2 6 2 8-2Zm0 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      ) : (
        <path d="m16 3 4 6 6 2-4 5 1 8-7-4-7 4 1-8-4-5 6-2 4-6Zm-2 9v5h4v-5h-4Z" />
      )}
    </svg>
  )
}
