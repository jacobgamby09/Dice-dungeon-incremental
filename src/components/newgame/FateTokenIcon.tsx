import { memo } from 'react'

interface FateTokenIconProps {
  size?: number
}

export const FateTokenIcon = memo(function FateTokenIcon({
  size = 18,
}: FateTokenIconProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="fate-token-icon"
      height={size}
      src="/sprites/charms/fate-token.png"
      width={size}
    />
  )
})
