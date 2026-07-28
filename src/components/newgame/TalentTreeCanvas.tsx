import { animate, motion, useMotionValue } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  getZoomedTalentCanvasOffset,
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

interface PinchGesture {
  active: boolean
  startDistance: number
  startScale: number
  worldX: number
  worldY: number
}

const INITIAL_VIEWPORT: TalentTreeViewport = { height: 800, width: 384 }
const INITIAL_FOCUS = getTalentTreePoint(TALENT_IDS.battleHardenedOne)
const INITIAL_OFFSET = getCenteredTalentCanvasOffset(INITIAL_FOCUS, INITIAL_VIEWPORT)
const DRAG_THRESHOLD = 7
const MIN_ZOOM = 0.65
const MAX_ZOOM = 1.4
const ZOOM_STEP = 0.15

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function getPinchMetrics(points: readonly TalentTreePoint[]) {
  const [first, second] = points
  if (!first || !second) return null

  return {
    center: {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    },
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  }
}

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
  const activePointersRef = useRef(new Map<number, TalentTreePoint>())
  const pinchGestureRef = useRef<PinchGesture>({
    active: false,
    startDistance: 0,
    startScale: 1,
    worldX: 0,
    worldY: 0,
  })
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
  const scaleRef = useRef(1)
  const [scale, setScale] = useState(1)

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
        scaleRef.current,
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
      scaleRef.current,
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

  const setClampedOffset = (
    nextOffset: TalentTreePoint,
    nextScale = scaleRef.current,
  ) => {
    const clampedOffset = clampTalentCanvasOffset(
      nextOffset,
      viewportSizeRef.current,
      nextScale,
    )
    offsetX.set(clampedOffset.x)
    offsetY.set(clampedOffset.y)
  }

  const setZoomAt = (requestedScale: number, anchor?: TalentTreePoint) => {
    const nextScale = clampZoom(requestedScale)
    const currentScale = scaleRef.current
    if (Math.abs(nextScale - currentScale) < 0.001) return

    const viewport = viewportSizeRef.current
    const zoomAnchor = anchor ?? {
      x: viewport.width / 2,
      y: viewport.height / 2,
    }
    const nextOffset = getZoomedTalentCanvasOffset(
      { x: offsetX.get(), y: offsetY.get() },
      zoomAnchor,
      currentScale,
      nextScale,
      viewport,
    )

    scaleRef.current = nextScale
    setScale(nextScale)
    offsetX.set(nextOffset.x)
    offsetY.set(nextOffset.y)
  }

  const startSinglePointerDrag = (
    pointerId: number,
    point: TalentTreePoint,
  ) => {
    dragGestureRef.current = {
      active: true,
      didMove: false,
      pointerId,
      startOffsetX: offsetX.get(),
      startOffsetY: offsetY.get(),
      startPointerX: point.x,
      startPointerY: point.y,
    }
  }

  const startPinch = () => {
    const metrics = getPinchMetrics([...activePointersRef.current.values()])
    if (!metrics || metrics.distance === 0) return

    const currentScale = scaleRef.current
    pinchGestureRef.current = {
      active: true,
      startDistance: metrics.distance,
      startScale: currentScale,
      worldX: (metrics.center.x - offsetX.get()) / currentScale,
      worldY: (metrics.center.y - offsetY.get()) / currentScale,
    }
    dragGestureRef.current.active = false
    suppressClickUntilRef.current = performance.now() + 220
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return
    const target = event.target
    if (target instanceof Element && target.closest('[data-canvas-control]')) return

    const viewportRect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: event.clientX - viewportRect.left,
      y: event.clientY - viewportRect.top,
    }
    activePointersRef.current.set(event.pointerId, point)

    if (activePointersRef.current.size >= 2) {
      startPinch()
      return
    }

    startSinglePointerDrag(event.pointerId, point)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return
    const viewportRect = event.currentTarget.getBoundingClientRect()
    const pointerPoint = {
      x: event.clientX - viewportRect.left,
      y: event.clientY - viewportRect.top,
    }
    activePointersRef.current.set(event.pointerId, pointerPoint)

    if (pinchGestureRef.current.active && activePointersRef.current.size >= 2) {
      const metrics = getPinchMetrics([...activePointersRef.current.values()])
      if (!metrics) return

      const pinch = pinchGestureRef.current
      const nextScale = clampZoom(
        pinch.startScale * (metrics.distance / pinch.startDistance),
      )
      scaleRef.current = nextScale
      setScale(nextScale)
      setClampedOffset({
        x: metrics.center.x - pinch.worldX * nextScale,
        y: metrics.center.y - pinch.worldY * nextScale,
      }, nextScale)
      suppressClickUntilRef.current = performance.now() + 220
      event.preventDefault()
      return
    }

    const gesture = dragGestureRef.current
    if (!gesture.active || gesture.pointerId !== event.pointerId) return

    const deltaX = pointerPoint.x - gesture.startPointerX
    const deltaY = pointerPoint.y - gesture.startPointerY
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
    const wasPinching = pinchGestureRef.current.active
    activePointersRef.current.delete(event.pointerId)

    if (wasPinching && activePointersRef.current.size < 2) {
      pinchGestureRef.current.active = false
      suppressClickUntilRef.current = performance.now() + 220
      const remainingPointer = [...activePointersRef.current.entries()][0]
      if (remainingPointer) {
        startSinglePointerDrag(remainingPointer[0], remainingPointer[1])
        dragGestureRef.current.didMove = true
      }
    } else if (gesture.active && gesture.pointerId === event.pointerId) {
      suppressClickUntilRef.current = gesture.didMove ? performance.now() + 220 : 0
      dragGestureRef.current = { ...gesture, active: false }
    }

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
    if (
      target instanceof Element
      && target.closest('[data-talent-node], [data-canvas-control]')
    ) return
    onClearSelection()
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (disabled) return
    event.preventDefault()

    if (event.ctrlKey || event.metaKey) {
      const viewportRect = event.currentTarget.getBoundingClientRect()
      setZoomAt(scaleRef.current - event.deltaY * 0.0025, {
        x: event.clientX - viewportRect.left,
        y: event.clientY - viewportRect.top,
      })
      return
    }

    setClampedOffset({
      x: offsetX.get() - event.deltaX,
      y: offsetY.get() - event.deltaY,
    })
  }

  return (
    <div
      aria-label="Talent Tree canvas. Drag to explore and pinch to zoom."
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
          scale,
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

      <div
        aria-label="Talent Tree zoom controls"
        className="talent-canvas-zoom"
        data-canvas-control="true"
      >
        <button
          aria-label="Zoom out Talent Tree"
          disabled={disabled || scale <= MIN_ZOOM}
          onClick={() => setZoomAt(scaleRef.current - ZOOM_STEP)}
          type="button"
        >
          <Minus aria-hidden="true" size={18} />
        </button>
        <output aria-label={`${Math.round(scale * 100)}% zoom`}>
          {Math.round(scale * 100)}%
        </output>
        <button
          aria-label="Zoom in Talent Tree"
          disabled={disabled || scale >= MAX_ZOOM}
          onClick={() => setZoomAt(scaleRef.current + ZOOM_STEP)}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  )
}
