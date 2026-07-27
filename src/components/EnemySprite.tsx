import { useEffect, useRef, useState } from 'react'

type SheetMode = 'idle' | 'attack' | 'hurt' | 'death'
type SheetDefinition = { src: string; frames: number; frameMs: number; loop: boolean }
type SheetConfig = {
  sheets: Record<SheetMode, SheetDefinition>
  crop: { x: number; y: number; w: number; h: number }
  unit: number
  minWidth: number
  nudgeX?: number
}

const SHEET_SPRITES: Record<string, SheetConfig> = {
  orc: {
    sheets: {
      idle:   { src: '/sprites/enemies/orc/Orc-Idle.png?v=8',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/orc/Orc-Attack01.png?v=8', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/orc/Orc-Hurt.png?v=8',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/orc/Orc-Death.png?v=8',    frames: 4, frameMs: 150, loop: false },
    },
    crop: { x: 0, y: 8, w: 100, h: 84 },
    unit: 18,
    minWidth: 82,
  },
  slime: {
    sheets: {
      idle:   { src: '/sprites/enemies/slime/Slime-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/slime/Slime-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/slime/Slime-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/slime/Slime-Death.png',    frames: 4, frameMs: 150, loop: false },
    },
    crop: { x: 0, y: 18, w: 100, h: 64 },
    unit: 18,
    minWidth: 78,
  },
  skeleton: {
    sheets: {
      idle:   { src: '/sprites/enemies/skeleton/Skeleton-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/skeleton/Skeleton-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/skeleton/Skeleton-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/skeleton/Skeleton-Death.png',    frames: 4, frameMs: 150, loop: false },
    },
    crop: { x: 4, y: 10, w: 92, h: 82 },
    unit: 18,
    minWidth: 78,
  },
  goblin: {
    sheets: {
      idle:   { src: '/sprites/enemies/goblin/Goblin-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/goblin/Goblin-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/goblin/Goblin-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/goblin/Goblin-Death.png',    frames: 4, frameMs: 150, loop: false },
    },
    crop: { x: 0, y: 10, w: 100, h: 82 },
    unit: 18,
    minWidth: 78,
  },
  bloodorc: {
    sheets: {
      idle:   { src: '/sprites/enemies/blood-orc/BloodOrc-Idle.png',     frames: 6, frameMs: 200, loop: true },
      attack: { src: '/sprites/enemies/blood-orc/BloodOrc-Attack01.png', frames: 6, frameMs: 100, loop: false },
      hurt:   { src: '/sprites/enemies/blood-orc/BloodOrc-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/blood-orc/BloodOrc-Death.png',    frames: 4, frameMs: 170, loop: false },
    },
    crop: { x: 0, y: 4, w: 100, h: 92 },
    unit: 19,
    minWidth: 112,
  },
  cultist: {
    sheets: {
      idle:   { src: '/sprites/enemies/cultist/Cultist-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/cultist/Cultist-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/cultist/Cultist-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/cultist/Cultist-Death.png',    frames: 4, frameMs: 155, loop: false },
    },
    crop: { x: 0, y: 2, w: 100, h: 94 },
    unit: 17,
    minWidth: 82,
  },
  shieldbearer: {
    sheets: {
      idle:   { src: '/sprites/enemies/shieldbearer/Shieldbearer-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/shieldbearer/Shieldbearer-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/shieldbearer/Shieldbearer-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/shieldbearer/Shieldbearer-Death.png',    frames: 4, frameMs: 155, loop: false },
    },
    crop: { x: 0, y: 2, w: 100, h: 94 },
    unit: 17,
    minWidth: 82,
  },
  marrowbat: {
    sheets: {
      idle:   { src: '/sprites/enemies/marrow-bat/MarrowBat-Idle.png',     frames: 4, frameMs: 180, loop: true },
      attack: { src: '/sprites/enemies/marrow-bat/MarrowBat-Attack01.png', frames: 5, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/marrow-bat/MarrowBat-Hurt.png',     frames: 3, frameMs: 120, loop: false },
      death:  { src: '/sprites/enemies/marrow-bat/MarrowBat-Death.png',    frames: 6, frameMs: 145, loop: false },
    },
    crop: { x: 0, y: 0, w: 100, h: 100 },
    unit: 17,
    minWidth: 86,
  },
  slimecrawler: {
    sheets: {
      idle:   { src: '/sprites/enemies/slime-crawler/SlimeCrawler-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/slime-crawler/SlimeCrawler-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/slime-crawler/SlimeCrawler-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/slime-crawler/SlimeCrawler-Death.png',    frames: 4, frameMs: 150, loop: false },
    },
    crop: { x: 0, y: 0, w: 100, h: 100 },
    unit: 21,
    minWidth: 112,
  },
  toxiccreep: {
    sheets: {
      idle:   { src: '/sprites/enemies/toxic-creep/ToxicCreep-Idle.png',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/toxic-creep/ToxicCreep-Attack01.png', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/toxic-creep/ToxicCreep-Hurt.png',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/toxic-creep/ToxicCreep-Death.png',    frames: 4, frameMs: 155, loop: false },
    },
    crop: { x: 0, y: 0, w: 100, h: 100 },
    unit: 18,
    minWidth: 82,
  },
  spikedbehemoth: {
    sheets: {
      idle:   { src: '/sprites/enemies/spiked-behemoth/SpikedBehemoth-Idle.png',     frames: 6, frameMs: 210, loop: true },
      attack: { src: '/sprites/enemies/spiked-behemoth/SpikedBehemoth-Attack01.png', frames: 6, frameMs: 105, loop: false },
      hurt:   { src: '/sprites/enemies/spiked-behemoth/SpikedBehemoth-Hurt.png',     frames: 4, frameMs: 135, loop: false },
      death:  { src: '/sprites/enemies/spiked-behemoth/SpikedBehemoth-Death.png',    frames: 4, frameMs: 170, loop: false },
    },
    crop: { x: 0, y: 4, w: 100, h: 92 },
    unit: 20,
    minWidth: 118,
  },
  demon: {
    sheets: {
      idle:   { src: '/sprites/enemies/demon/Demon-Idle.png?v=2',     frames: 6, frameMs: 190, loop: true },
      attack: { src: '/sprites/enemies/demon/Demon-Attack01.png?v=2', frames: 6, frameMs: 95,  loop: false },
      hurt:   { src: '/sprites/enemies/demon/Demon-Hurt.png?v=2',     frames: 4, frameMs: 130, loop: false },
      death:  { src: '/sprites/enemies/demon/Demon-Death.png?v=2',    frames: 4, frameMs: 170, loop: false },
    },
    crop: { x: 0, y: 0, w: 100, h: 100 },
    unit: 22,
    minWidth: 126,
  },
}

function SheetSprite({
  config,
  size,
  hp,
  enemyHitVersion = 0,
  enemyAttackVersion = 0,
}: {
  config: SheetConfig
  size: number
  hp?: number
  enemyHitVersion?: number
  enemyAttackVersion?: number
}) {
  const [mode, setMode] = useState<SheetMode>('idle')
  const [frame, setFrame] = useState(0)
  const prevHitVersion = useRef(enemyHitVersion)
  const prevAttackVersion = useRef(enemyAttackVersion)
  const isDead = hp !== undefined && hp <= 0

  useEffect(() => {
    if (isDead) {
      setMode('death')
      setFrame(0)
    }
  }, [isDead])

  useEffect(() => {
    if (enemyAttackVersion === prevAttackVersion.current) return
    prevAttackVersion.current = enemyAttackVersion
    if (isDead) return
    setMode('attack')
    setFrame(0)
  }, [enemyAttackVersion, isDead])

  useEffect(() => {
    if (enemyHitVersion === prevHitVersion.current) return
    prevHitVersion.current = enemyHitVersion
    setMode(isDead ? 'death' : 'hurt')
    setFrame(0)
  }, [enemyHitVersion, isDead])

  useEffect(() => {
    const sheet = config.sheets[mode]
    const id = window.setInterval(() => {
      setFrame((current) => {
        const next = current + 1
        if (next < sheet.frames) return next
        if (sheet.loop) return 0
        if (mode === 'death') return sheet.frames - 1
        setMode('idle')
        return 0
      })
    }, sheet.frameMs)

    return () => window.clearInterval(id)
  }, [config, mode])

  const sheet = config.sheets[mode]
  const { crop } = config
  const displayWidth = Math.max(config.minWidth, size * config.unit)
  const displayHeight = Math.round(displayWidth * (crop.h / crop.w))
  const scale = displayWidth / crop.w

  return (
    <div style={{
      width: displayWidth,
      height: displayHeight,
      overflow: 'visible',
      position: 'relative',
      transform: config.nudgeX ? `translateX(${config.nudgeX}px)` : undefined,
      filter: 'drop-shadow(2px 2px 0 #000)',
    }}>
      <div style={{
        width: crop.w,
        height: crop.h,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundImage: `url(${sheet.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${frame * 100 + crop.x}px -${crop.y}px`,
        imageRendering: 'pixelated',
      }} />
    </div>
  )
}



export function EnemySprite({
  enemyName,
  size = 6,
  hp,
  enemyHitVersion,
  enemyAttackVersion,
}: {
  enemyName: string
  size?: number
  hp?: number
  enemyHitVersion?: number
  enemyAttackVersion?: number
}) {
  const normalizedName = enemyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const config = SHEET_SPRITES[normalizedName] ?? SHEET_SPRITES.slime

  return (
    <SheetSprite
      config={config}
      size={size}
      hp={hp}
      enemyHitVersion={enemyHitVersion}
      enemyAttackVersion={enemyAttackVersion}
    />
  )
}
