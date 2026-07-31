import { memo } from 'react'

interface CurrencyIconProps {
  currency: 'souls' | 'xp'
  size?: number
}

const CURRENCY_ASSET_PATHS = {
  souls: '/sprites/currency/soul-icon.png',
  xp: '/sprites/currency/xp-icon.png',
} as const

export const CurrencyIcon = memo(function CurrencyIcon({
  currency,
  size = 18,
}: CurrencyIconProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={`currency-icon currency-icon--${currency}`}
      height={size}
      src={CURRENCY_ASSET_PATHS[currency]}
      width={size}
    />
  )
})
