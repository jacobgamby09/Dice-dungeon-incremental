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
      ) : (
        <path d="m16 3 4 6 6 2-4 5 1 8-7-4-7 4 1-8-4-5 6-2 4-6Zm-2 9v5h4v-5h-4Z" />
      )}
    </svg>
  )
}

