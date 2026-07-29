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
  height: 1800,
  width: 1800,
} as const

export const TALENT_TREE_LAYOUT: Record<TalentId, TalentTreePoint> = {
  [TALENT_IDS.battleHardenedOne]: { x: 900, y: 900 },

  [TALENT_IDS.twinArsenal]: { x: 900, y: 780 },
  [TALENT_IDS.shieldcraft]: { x: 900, y: 650 },
  [TALENT_IDS.thirdGrip]: { x: 900, y: 520 },
  [TALENT_IDS.healingArts]: { x: 830, y: 390 },
  [TALENT_IDS.fourthGrip]: { x: 970, y: 390 },
  [TALENT_IDS.executionerDoctrine]: { x: 690, y: 390 },

  [TALENT_IDS.volatileTemper]: { x: 780, y: 900 },
  [TALENT_IDS.faceMastery]: { x: 650, y: 900 },

  [TALENT_IDS.autoCombat]: { x: 900, y: 1020 },
  [TALENT_IDS.quickDraw]: { x: 900, y: 1150 },
  [TALENT_IDS.battleHardenedTwo]: { x: 900, y: 1280 },
  [TALENT_IDS.secondDescent]: { x: 830, y: 1410 },
  [TALENT_IDS.towerDiscipline]: { x: 970, y: 1410 },

  [TALENT_IDS.fatecraft]: { x: 1020, y: 900 },
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
  scale = 1,
): TalentTreePoint {
  const horizontalOverscan = Math.min(96, viewport.width * 0.24)
  const verticalOverscan = Math.min(112, viewport.height * 0.16)
  const horizontalCenter = viewport.width / 2
  const verticalCenter = viewport.height / 2

  return {
    x: clamp(
      offset.x,
      horizontalCenter - TALENT_TREE_BOUNDS.maxX * scale - horizontalOverscan,
      horizontalCenter - TALENT_TREE_BOUNDS.minX * scale + horizontalOverscan,
    ),
    y: clamp(
      offset.y,
      verticalCenter - TALENT_TREE_BOUNDS.maxY * scale - verticalOverscan,
      verticalCenter - TALENT_TREE_BOUNDS.minY * scale + verticalOverscan,
    ),
  }
}

export function getCenteredTalentCanvasOffset(
  point: TalentTreePoint,
  viewport: TalentTreeViewport,
  scale = 1,
): TalentTreePoint {
  return clampTalentCanvasOffset({
    x: viewport.width / 2 - point.x * scale,
    y: viewport.height / 2 - point.y * scale,
  }, viewport, scale)
}

export function getZoomedTalentCanvasOffset(
  offset: TalentTreePoint,
  anchor: TalentTreePoint,
  currentScale: number,
  nextScale: number,
  viewport: TalentTreeViewport,
): TalentTreePoint {
  const scaleRatio = nextScale / currentScale
  return clampTalentCanvasOffset({
    x: anchor.x - (anchor.x - offset.x) * scaleRatio,
    y: anchor.y - (anchor.y - offset.y) * scaleRatio,
  }, viewport, nextScale)
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

  const center = getTalentTreePoint(TALENT_IDS.battleHardenedOne)
  const distances = revealedPoints.map((point) => (
    Math.hypot(point.x - center.x, point.y - center.y)
  ))
  const frontierDistance = Math.max(...distances)
  const frontierPoints = revealedPoints.filter((_, index) => (
    Math.abs(distances[index] - frontierDistance) < 0.01
  ))

  return {
    x: frontierPoints.reduce((total, point) => total + point.x, 0) / frontierPoints.length,
    y: frontierPoints.reduce((total, point) => total + point.y, 0) / frontierPoints.length,
  }
}
