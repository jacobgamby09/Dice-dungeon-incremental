import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { TALENT_IDS } from '../../game/content/talents'
import type { TalentDefinition } from '../../game/types/progression'
import { TalentNode } from './TalentNode'
import type { TalentNodeState } from './TalentNode'
import {
  clampTalentCanvasOffset,
  getCenteredTalentCanvasOffset,
  getTalentTreePoint,
  TALENT_TREE_WORLD,
} from './talentTreeLayout'
import type { TalentTreePoint, TalentTreeViewport } from './talentTreeLayout'

export interface TalentCanvasNode {
  isActivating: boolean
  isAffordable: boolean
  isNew: boolean
  nextCost: number | null
  rank: number
  revealOrder: number
  state: TalentNodeState
  talent: TalentDefinition
}

export interface TalentCanvasFocusRequest {
  id: number
  point: TalentTreePoint
}

interface TalentTreeCanvasProps {
  chargingTalentIds: readonly string[]
  disabled: boolean
  focusRequest: TalentCanvasFocusRequest
  nodes: readonly TalentCanvasNode[]
  onClearSelection: () => void
  onSelectTalent: (talent: TalentDefinition) => void
  selectedTalentId: string | null
}

interface DragGesture {
  active: boolean
  didMove: boolean
  pointerId: number
  startOffsetX: number
  startOffsetY: number
  startPointerX: number
  startPointerY: number
}

const INITIAL_VIEWPORT: TalentTreeViewport = { height: 800, width: 384 }
const INITIAL_FOCUS = getTalentTreePoint(TALENT_IDS.battleHardenedOne)
const INITIAL_OFFSET = getCenteredTalentCanvasOffset(INITIAL_FOCUS, INITIAL_VIEWPORT)
const DRAG_THRESHOLD = 7

export function TalentTreeCanvas({
  chargingTalentIds,
  disabled,
  focusRequest,
  nodes,
  onClearSelection,
  onSelectTalent,
  selectedTalentId,
}: TalentTreeCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportSizeRef = useRef<TalentTreeViewport>(INITIAL_VIEWPORT)
  const focusPointRef = useRef(focusRequest.point)
  const suppressClickUntilRef = useRef(0)
  const dragGestureRef = useRef<DragGesture>({
    active: false,
    didMove: false,
    pointerId: -1,
    startOffsetX: 0,
    startOffsetY: 0,
    startPointerX: 0,
    startPointerY: 0,
  })
  const offsetX = useMotionValue(INITIAL_OFFSET.x)
  const offsetY = useMotionValue(INITIAL_OFFSET.y)

  const chargingTalentIdSet = useMemo(
    () => new Set(chargingTalentIds),
    [chargingTalentIds],
  )
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.talent.id, node])),
    [nodes],
  )
  const connections = useMemo(
    () => nodes.flatMap((targetNode) => (
      targetNode.talent.prerequisiteIds
        .filter((sourceId) => nodesById.has(sourceId))
        .map((sourceId) => ({
          isCharging: chargingTalentIdSet.has(targetNode.talent.id),
          source: nodesById.get(sourceId)!,
          target: targetNode,
        }))
    )),
    [chargingTalentIdSet, nodes, nodesById],
  )

  useEffect(() => {
    focusPointRef.current = focusRequest.point
  }, [focusRequest.point])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const measureAndCenter = () => {
      const rect = viewport.getBoundingClientRect()
      viewportSizeRef.current = {
        height: Math.max(1, rect.height),
        width: Math.max(1, rect.width),
      }
      const nextOffset = getCenteredTalentCanvasOffset(
        focusPointRef.current,
        viewportSizeRef.current,
      )
      offsetX.set(nextOffset.x)
      offsetY.set(nextOffset.y)
    }

    measureAndCenter()
    const resizeObserver = new ResizeObserver(measureAndCenter)
    resizeObserver.observe(viewport)

    return () => resizeObserver.disconnect()
  }, [offsetX, offsetY])

  useEffect(() => {
    const nextOffset = getCenteredTalentCanvasOffset(
      focusRequest.point,
      viewportSizeRef.current,
    )
    const xAnimation = animate(offsetX, nextOffset.x, {
      duration: 0.46,
      ease: [0.22, 0.78, 0.22, 1],
    })
    const yAnimation = animate(offsetY, nextOffset.y, {
      duration: 0.46,
      ease: [0.22, 0.78, 0.22, 1],
    })

    return () => {
      xAnimation.stop()
      yAnimation.stop()
    }
  }, [focusRequest.id, focusRequest.point, offsetX, offsetY])

  const setClampedOffset = (nextOffset: TalentTreePoint) => {
    const clampedOffset = clampTalentCanvasOffset(nextOffset, viewportSizeRef.current)
    offsetX.set(clampedOffset.x)
    offsetY.set(clampedOffset.y)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return

    dragGestureRef.current = {
      active: true,
      didMove: false,
      pointerId: event.pointerId,
      startOffsetX: offsetX.get(),
      startOffsetY: offsetY.get(),
      startPointerX: event.clientX,
      startPointerY: event.clientY,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = dragGestureRef.current
    if (!gesture.active || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startPointerX
    const deltaY = event.clientY - gesture.startPointerY
    if (!gesture.didMove && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
      gesture.didMove = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (!gesture.didMove) return

    event.preventDefault()
    setClampedOffset({
      x: gesture.startOffsetX + deltaX,
      y: gesture.startOffsetY + deltaY,
    })
  }

  const finishPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = dragGestureRef.current
    if (!gesture.active || gesture.pointerId !== event.pointerId) return

    suppressClickUntilRef.current = gesture.didMove ? performance.now() + 220 : 0
    dragGestureRef.current = { ...gesture, active: false }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() > suppressClickUntilRef.current) return
    suppressClickUntilRef.current = 0
    event.preventDefault()
    event.stopPropagation()
  }

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('[data-talent-node]')) return
    onClearSelection()
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (disabled) return
    event.preventDefault()
    setClampedOffset({
      x: offsetX.get() - event.deltaX,
      y: offsetY.get() - event.deltaY,
    })
  }

  return (
    <div
      aria-label="Talent Tree canvas. Drag to explore."
      className={`talent-canvas${disabled ? ' talent-canvas--locked' : ''}`}
      data-testid="talent-tree-canvas"
      onClick={handleCanvasClick}
      onClickCapture={handleClickCapture}
      onPointerCancel={finishPointerGesture}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      onWheel={handleWheel}
      ref={viewportRef}
      role="region"
    >
      <motion.div
        aria-hidden={disabled || undefined}
        className="talent-canvas__world"
        style={{
          height: TALENT_TREE_WORLD.height,
          width: TALENT_TREE_WORLD.width,
          x: offsetX,
          y: offsetY,
        }}
      >
        <svg
          aria-hidden="true"
          className="talent-canvas__connections"
          viewBox={`0 0 ${TALENT_TREE_WORLD.width} ${TALENT_TREE_WORLD.height}`}
        >
          {connections.map(({ isCharging, source, target }) => {
            const sourcePoint = getTalentTreePoint(source.talent.id)
            const targetPoint = getTalentTreePoint(target.talent.id)
            const connectionState = target.state === 'silhouette'
              ? 'veiled'
              : target.rank > 0
                ? 'active'
                : source.rank > 0
                  ? 'open'
                  : 'dormant'

            return (
              <g
                className={`talent-canvas-connection talent-canvas-connection--${connectionState}${isCharging ? ' talent-canvas-connection--charging' : ''}`}
                key={`${source.talent.id}-${target.talent.id}`}
              >
                <line
                  className="talent-canvas-connection__base"
                  x1={sourcePoint.x}
                  x2={targetPoint.x}
                  y1={sourcePoint.y}
                  y2={targetPoint.y}
                />
                {isCharging && (
                  <line
                    className="talent-canvas-connection__charge"
                    pathLength="1"
                    x1={sourcePoint.x}
                    x2={targetPoint.x}
                    y1={sourcePoint.y}
                    y2={targetPoint.y}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {nodes.map((node) => {
          const point = getTalentTreePoint(node.talent.id)
          const nodePosition = {
            '--talent-node-x': `${point.x}px`,
            '--talent-node-y': `${point.y}px`,
          } as CSSProperties

          return (
            <div
              className="talent-canvas__node-position"
              data-talent-id={node.talent.id}
              key={node.talent.id}
              style={nodePosition}
            >
              <TalentNode
                disabled={disabled}
                isActivating={node.isActivating}
                isAffordable={node.isAffordable}
                isNew={node.isNew}
                isSelected={selectedTalentId === node.talent.id}
                nextCost={node.nextCost}
                onSelect={onSelectTalent}
                rank={node.rank}
                revealOrder={node.revealOrder}
                state={node.state}
                talent={node.talent}
              />
            </div>
          )
        })}
      </motion.div>

      <div aria-hidden="true" className="talent-canvas__vignette" />
    </div>
  )
}
