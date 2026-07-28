import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { AwayRecapPanel } from './components/newgame/AwayRecapPanel'
import { CombatScreen } from './screens/CombatScreen'
import { DefeatScreen } from './screens/DefeatScreen'
import { DungeonSelectScreen } from './screens/DungeonSelectScreen'
import { HubScreen } from './screens/HubScreen'
import { LoadoutScreen } from './screens/LoadoutScreen'
import { PostCombatScreen } from './screens/PostCombatScreen'
import { TalentTreeScreen } from './screens/TalentTreeScreen'
import { WorkshopScreen } from './screens/WorkshopScreen'
import { useNewGameStore } from './store/newGameStore'
import './newGame.css'

export function App() {
  const screen = useNewGameStore((state) => state.screen)
  const autoCombat = useNewGameStore((state) => state.profile.settings.autoCombat)
  const runStatus = useNewGameStore((state) => state.run.status)
  const awayRecap = useNewGameStore((state) => state.awayRecap)
  const runMenuOpen = useNewGameStore((state) => state.runMenuOpen)
  const checkpointAutoCombat = useNewGameStore((state) => state.checkpointAutoCombat)
  const resumeAutoCombat = useNewGameStore((state) => state.resumeAutoCombat)
  const dismissAwayRecap = useNewGameStore((state) => state.dismissAwayRecap)

  useEffect(() => {
    if (!autoCombat || runStatus === 'inactive' || runMenuOpen) return

    const checkpoint = () => checkpointAutoCombat(Date.now())
    const resume = () => resumeAutoCombat(Date.now())
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') checkpoint()
      else resume()
    }

    if (document.visibilityState === 'visible') resume()
    else checkpoint()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', checkpoint)
    window.addEventListener('pageshow', resume)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', checkpoint)
      window.removeEventListener('pageshow', resume)
    }
  }, [
    autoCombat,
    checkpointAutoCombat,
    resumeAutoCombat,
    runMenuOpen,
    runStatus,
  ])

  let content = <HubScreen />
  if (screen === 'dungeon_select') content = <DungeonSelectScreen />
  if (screen === 'combat') content = <CombatScreen />
  if (screen === 'post_combat') content = <PostCombatScreen />
  if (screen === 'workshop') content = <WorkshopScreen />
  if (screen === 'talent_tree') content = <TalentTreeScreen />
  if (screen === 'loadout') content = <LoadoutScreen />
  if (screen === 'defeat') content = <DefeatScreen />

  return (
    <MotionConfig reducedMotion="user">
      {content}
      {awayRecap && (
        <AwayRecapPanel onDismiss={dismissAwayRecap} recap={awayRecap} />
      )}
    </MotionConfig>
  )
}
