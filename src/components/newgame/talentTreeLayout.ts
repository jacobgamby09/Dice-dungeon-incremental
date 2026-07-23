import { TALENT_IDS, TALENTS } from '../../game/content/talents'
import { getTalentVisibility } from '../../game/progression/talents'
import type { TalentRanks } from '../../game/types/progression'

export interface TalentTreePoint {
  x: number
  y: number
}

export interface TalentTreeBounds {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

export interface TalentTreeViewport {
  height: number
  width: number
}

type TalentId = (typeof TALENT_IDS)[keyof typeof TALENT_IDS]

export const TALENT_TREE_WORLD = {
  height: 1480,
  width: 1040,
} as const

export const TALENT_TREE_LAYOUT: Record<TalentId, TalentTreePoint> = {
  [TALENT_IDS.battleHardenedOne]: { x: 520, y: 260 },
  [TALENT_IDS.twinArsenal]: { x: 520, y: 450 },
  [TALENT_IDS.shieldcraft]: { x: 520, y: 640 },
  [TALENT_IDS.battleHardenedTwo]: { x: 320, y: 850 },
  [TALENT_IDS.thirdGrip]: { x: 520, y: 850 },
  [TALENT_IDS.quickDraw]: { x: 720, y: 850 },
  [TALENT_IDS.healingArts]: { x: 520, y: 1060 },
  [TALENT_IDS.autoRoll]: { x: 720, y: 1060 },
  [TALENT_IDS.fourthGrip]: { x: 520, y: 1270 },
}

const TALENT_LAYOUT_VALUES = Object.values(TALENT_TREE_LAYOUT)
const NODE_EDGE_PADDING = 58

export const TALENT_TREE_BOUNDS: TalentTreeBounds = {
  maxX: Math.max(...TALENT_LAYOUT_VALUES.map((point) => point.x)) + NODE_EDGE_PADDING,
  maxY: Math.max(...TALENT_LAYOUT_VALUES.map((point) => point.y)) + NODE_EDGE_PADDING,
  minX: Math.min(...TALENT_LAYOUT_VALUES.map((point) => point.x)) - NODE_EDGE_PADDING,
  minY: Math.min(...TALENT_LAYOUT_VALUES.map((point) => point.y)) - NODE_EDGE_PADDING,
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function getTalentTreePoint(talentId: string): TalentTreePoint {
  const point = (TALENT_TREE_LAYOUT as Record<string, TalentTreePoint>)[talentId]
  if (!point) throw new Error(`Missing Talent Tree layout for "${talentId}".`)
  return point
}

export function clampTalentCanvasOffset(
  offset: TalentTreePoint,
  viewport: TalentTreeViewport,
): TalentTreePoint {
  const horizontalOverscan = Math.min(96, viewport.width * 0.24)
  const verticalOverscan = Math.min(112, viewport.height * 0.16)
  const horizontalCenter = viewport.width / 2
  const verticalCenter = viewport.height / 2

  return {
    x: clamp(
      offset.x,
      horizontalCenter - TALENT_TREE_BOUNDS.maxX - horizontalOverscan,
      horizontalCenter - TALENT_TREE_BOUNDS.minX + horizontalOverscan,
    ),
    y: clamp(
      offset.y,
      verticalCenter - TALENT_TREE_BOUNDS.maxY - verticalOverscan,
      verticalCenter - TALENT_TREE_BOUNDS.minY + verticalOverscan,
    ),
  }
}

export function getCenteredTalentCanvasOffset(
  point: TalentTreePoint,
  viewport: TalentTreeViewport,
): TalentTreePoint {
  return clampTalentCanvasOffset({
    x: viewport.width / 2 - point.x,
    y: viewport.height / 2 - point.y,
  }, viewport)
}

export function getTalentTreeFrontierPoint(
  talentRanks: Readonly<TalentRanks>,
): TalentTreePoint {
  const revealedPoints = TALENTS
    .filter((talent) => getTalentVisibility(talentRanks, talent) === 'revealed')
    .map((talent) => getTalentTreePoint(talent.id))

  if (revealedPoints.length === 0) {
    return getTalentTreePoint(TALENT_IDS.battleHardenedOne)
  }

  const frontierY = Math.max(...revealedPoints.map((point) => point.y))
  const frontierPoints = revealedPoints.filter((point) => point.y === frontierY)

  return {
    x: frontierPoints.reduce((total, point) => total + point.x, 0) / frontierPoints.length,
    y: frontierY,
  }
}
