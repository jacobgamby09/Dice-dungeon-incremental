import { Gem } from 'lucide-react'
import { useState } from 'react'
import { CHARM_DEFINITIONS } from '../../game/content/charms'
import type { CharmId } from '../../game/types/charms'

interface CharmIconProps {
  charmId: CharmId
  size?: number
}

export function CharmIcon({ charmId, size = 48 }: CharmIconProps) {
  const [failed, setFailed] = useState(false)
  const charm = CHARM_DEFINITIONS[charmId]
  if (failed) {
    return <Gem aria-hidden="true" color={charm.accent} size={size} strokeWidth={2.2} />
  }
  return (
    <img
      alt=""
      className="charm-icon"
      height={size}
      onError={() => setFailed(true)}
      src={charm.assetPath}
      width={size}
    />
  )
}
