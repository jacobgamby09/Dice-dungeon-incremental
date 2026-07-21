import { CombatScreen } from './screens/CombatScreen'
import { DefeatScreen } from './screens/DefeatScreen'
import { DungeonSelectScreen } from './screens/DungeonSelectScreen'
import { HubScreen } from './screens/HubScreen'
import { PostCombatScreen } from './screens/PostCombatScreen'
import { WorkshopScreen } from './screens/WorkshopScreen'
import { useNewGameStore } from './store/newGameStore'
import './newGame.css'

export function App() {
  const screen = useNewGameStore((state) => state.screen)

  let content = <HubScreen />
  if (screen === 'dungeon_select') content = <DungeonSelectScreen />
  if (screen === 'combat') content = <CombatScreen />
  if (screen === 'post_combat') content = <PostCombatScreen />
  if (screen === 'workshop') content = <WorkshopScreen />
  if (screen === 'defeat') content = <DefeatScreen />

  return <MotionConfig reducedMotion="user">{content}</MotionConfig>
}
import { MotionConfig } from 'framer-motion'
