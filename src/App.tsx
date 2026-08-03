import { MotionConfig } from 'framer-motion'
import { CombatScreen } from './screens/CombatScreen'
import { DefeatScreen } from './screens/DefeatScreen'
import { DungeonSelectScreen } from './screens/DungeonSelectScreen'
import { HubScreen } from './screens/HubScreen'
import { LoadoutScreen } from './screens/LoadoutScreen'
import { PostCombatScreen } from './screens/PostCombatScreen'
import { TalentTreeScreen } from './screens/TalentTreeScreen'
import { WorkshopScreen } from './screens/WorkshopScreen'
import { FateSanctumScreen } from './screens/FateSanctumScreen'
import { ImprintsScreen } from './screens/ImprintsScreen'
import { useNewGameStore } from './store/newGameStore'
import './newGame.css'
import './styles/arcade/index.css'

export function App() {
  const screen = useNewGameStore((state) => state.screen)

  let content = <HubScreen />
  if (screen === 'dungeon_select') content = <DungeonSelectScreen />
  if (screen === 'combat') content = <CombatScreen />
  if (screen === 'post_combat') content = <PostCombatScreen />
  if (screen === 'workshop') content = <WorkshopScreen />
  if (screen === 'fate_sanctum') content = <FateSanctumScreen />
  if (screen === 'imprints') content = <ImprintsScreen />
  if (screen === 'talent_tree') content = <TalentTreeScreen />
  if (screen === 'loadout') content = <LoadoutScreen />
  if (screen === 'defeat') content = <DefeatScreen />

  return (
    <MotionConfig reducedMotion="user">
      {content}
    </MotionConfig>
  )
}
