import { Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { TalentNode } from '../components/newgame/TalentNode'
import type { TalentNodeState } from '../components/newgame/TalentNode'
import type { TalentRanks } from '../game/types/progression'
import type { EditorDevice, EditorMode, TalentTreeDraft } from './talentEditorModel'
import type { TalentTreePoint } from '../components/newgame/talentTreeLayout'

interface EditorTalentCanvasProps {
  connectingSourceId: string | null
  device: EditorDevice
  draft: TalentTreeDraft
  gridSize: number
  mode: EditorMode
  onCanvasCreate: (point: TalentTreePoint) => void
  onConnectNode: (id: string) => void
  onMoveEnd: (id: string, point: TalentTreePoint) => void
  onMoveStart: (id: string) => void
  onMove: (id: string, point: TalentTreePoint) => void
  onSelectNode: (id: string) => void
  previewRanks: TalentRanks
  previewXp: number
  selectedId: string | null
  snapToGrid: boolean
}

interface PanGesture {
  pointerId: number
  startOffset: TalentTreePoint
  startPointer: TalentTreePoint
}

interface NodeGesture {
  id: string
  moved: boolean
  pointerId: number
  startPoint: TalentTreePoint
  startPointer: TalentTreePoint
}

const MIN_ZOOM = 0.45
const MAX_ZOOM = 1.5

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function getRequiredCount(draft: TalentTreeDraft, id: string): number {
  const node = draft.nodes.find((candidate) => candidate.id === id)
  if (!node) return 0
  return Math.min(node.prerequisiteIds.length, node.prerequisiteCount ?? node.prerequisiteIds.length)
}

function prerequisitesMet(draft: TalentTreeDraft, ranks: TalentRanks, id: string): boolean {
  const node = draft.nodes.find((candidate) => candidate.id === id)
  if (!node) return false
  return node.prerequisiteIds.filter((prerequisiteId) => (ranks[prerequisiteId] ?? 0) > 0).length >= getRequiredCount(draft, id)
}

function getPreviewState(
  draft: TalentTreeDraft,
  ranks: TalentRanks,
  id: string,
  xp: number,
): TalentNodeState {
  const node = draft.nodes.find((candidate) => candidate.id === id)!
  const rank = ranks[id] ?? 0
  if (rank >= node.ranks.length) return 'maxed'
  if (!prerequisitesMet(draft, ranks, id)) {
    const hasVisibleParent = node.prerequisiteIds.length === 0
      || node.prerequisiteIds.some((parentId) => prerequisitesMet(draft, ranks, parentId) || (ranks[parentId] ?? 0) > 0)
    return hasVisibleParent ? 'locked' : 'silhouette'
  }
  if (rank > 0) return 'active'
  return xp >= (node.ranks[0]?.cost ?? Number.POSITIVE_INFINITY) ? 'ready' : 'unaffordable'
}

export function EditorTalentCanvas({
  connectingSourceId,
  device,
  draft,
  gridSize,
  mode,
  onCanvasCreate,
  onConnectNode,
  onMove,
  onMoveEnd,
  onMoveStart,
  onSelectNode,
  previewRanks,
  previewXp,
  selectedId,
  snapToGrid,
}: EditorTalentCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef(draft.layout)
  const panRef = useRef<PanGesture | null>(null)
  const nodeDragRef = useRef<NodeGesture | null>(null)
  const [zoom, setZoom] = useState(0.8)
  const [offset, setOffset] = useState({ x: -520, y: -520 })
  const fitKey = draft.nodes.map((node) => node.id).join('|')

  const nodesById = useMemo(
    () => new Map(draft.nodes.map((node) => [node.id, node])),
    [draft.nodes],
  )
  const edges = useMemo(() => draft.nodes.flatMap((target) => (
    target.prerequisiteIds
      .filter((sourceId) => nodesById.has(sourceId))
      .map((sourceId) => ({ sourceId, targetId: target.id }))
  )), [draft.nodes, nodesById])

  useEffect(() => {
    layoutRef.current = draft.layout
  }, [draft.layout])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current
      const points = Object.values(layoutRef.current)
      if (!viewport || !points.length) return
      const minimumX = Math.min(...points.map((point) => point.x))
      const maximumX = Math.max(...points.map((point) => point.x))
      const minimumY = Math.min(...points.map((point) => point.y))
      const maximumY = Math.max(...points.map((point) => point.y))
      const fittedZoom = clamp(Math.min(
        (viewport.clientWidth - 90) / Math.max(100, maximumX - minimumX + 90),
        (viewport.clientHeight - 90) / Math.max(100, maximumY - minimumY + 90),
        0.85,
      ), MIN_ZOOM, MAX_ZOOM)
      setZoom(fittedZoom)
      setOffset({
        x: viewport.clientWidth / 2 - ((minimumX + maximumX) / 2) * fittedZoom,
        y: viewport.clientHeight / 2 - ((minimumY + maximumY) / 2) * fittedZoom,
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [device, fitKey])

  const setZoomAroundCenter = (nextZoom: number) => {
    const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    const viewport = viewportRef.current
    if (!viewport) {
      setZoom(clamped)
      return
    }
    const center = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }
    const worldPoint = { x: (center.x - offset.x) / zoom, y: (center.y - offset.y) / zoom }
    setOffset({ x: center.x - worldPoint.x * clamped, y: center.y - worldPoint.y * clamped })
    setZoom(clamped)
  }

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target
    if (
      event.button !== 0
      || (target instanceof Element && target.closest('[data-editor-node-id], [data-canvas-control]'))
    ) return
    panRef.current = {
      pointerId: event.pointerId,
      startOffset: offset,
      startPointer: { x: event.clientX, y: event.clientY },
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId) return
    setOffset({
      x: pan.startOffset.x + event.clientX - pan.startPointer.x,
      y: pan.startOffset.y + event.clientY - pan.startPointer.y,
    })
  }

  const finishPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleNodePointerDown = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (mode !== 'design' || event.button !== 0) return
    const point = draft.layout[id]
    if (!point) return
    nodeDragRef.current = {
      id,
      moved: false,
      pointerId: event.pointerId,
      startPoint: point,
      startPointer: { x: event.clientX, y: event.clientY },
    }
    event.stopPropagation()
  }

  const handleNodePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = nodeDragRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    if (!gesture.moved) {
      if (Math.hypot(
        event.clientX - gesture.startPointer.x,
        event.clientY - gesture.startPointer.y,
      ) < 4) return
      gesture.moved = true
      onMoveStart(gesture.id)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    let x = gesture.startPoint.x + (event.clientX - gesture.startPointer.x) / zoom
    let y = gesture.startPoint.y + (event.clientY - gesture.startPointer.y) / zoom
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
    }
    onMove(gesture.id, {
      x: clamp(Math.round(x), 0, draft.world.width),
      y: clamp(Math.round(y), 0, draft.world.height),
    })
  }

  const finishNodeDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = nodeDragRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    nodeDragRef.current = null
    if (gesture.moved) {
      onMoveEnd(gesture.id, draft.layout[gesture.id])
      event.stopPropagation()
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleNodeSelect = (id: string) => {
    if (mode === 'connect') onConnectNode(id)
    else onSelectNode(id)
  }

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (
      mode !== 'design'
      || (target instanceof Element && target.closest('[data-editor-node-id], [data-canvas-control]'))
    ) return
    const rect = event.currentTarget.getBoundingClientRect()
    onCanvasCreate({
      x: (event.clientX - rect.left - offset.x) / zoom,
      y: (event.clientY - rect.top - offset.y) / zoom,
    })
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) setZoomAroundCenter(zoom - event.deltaY * 0.002)
    else setOffset((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }))
  }

  return (
    <div className={`talent-editor-device talent-editor-device--${device}`}>
      <div
        aria-label="Editable Talent Tree canvas"
        className="talent-canvas talent-editor-canvas"
        data-testid="talent-editor-canvas"
        onDoubleClick={handleDoubleClick}
        onPointerCancel={finishPan}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={finishPan}
        onWheel={handleWheel}
        ref={viewportRef}
        role="application"
      >
        <div
          className="talent-canvas__world"
          style={{
            height: draft.world.height,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            width: draft.world.width,
          }}
        >
          {(['arsenal', 'workshop', 'descent', 'fate'] as const).map((track) => (
            <div
              className={`talent-canvas-sector talent-canvas-sector--${track === 'arsenal' ? 'north' : track === 'workshop' ? 'west' : track === 'descent' ? 'south' : 'east'}`}
              key={track}
              style={{ left: draft.branchLabels[track].x, top: draft.branchLabels[track].y }}
            >
              {track}
            </div>
          ))}

          <svg
            aria-hidden="true"
            className="talent-canvas__connections"
            viewBox={`0 0 ${draft.world.width} ${draft.world.height}`}
          >
            {edges.map((edge) => {
              const source = draft.layout[edge.sourceId]
              const target = draft.layout[edge.targetId]
              const sourceActive = (previewRanks[edge.sourceId] ?? 0) > 0
              const targetActive = (previewRanks[edge.targetId] ?? 0) > 0
              const connectionState = mode === 'preview'
                ? targetActive ? 'active' : sourceActive ? 'open' : 'dormant'
                : connectingSourceId === edge.sourceId ? 'active' : 'open'
              return (
                <g className={`talent-canvas-connection talent-canvas-connection--${connectionState}`} key={`${edge.sourceId}-${edge.targetId}`}>
                  <line className="talent-canvas-connection__base" x1={source.x} x2={target.x} y1={source.y} y2={target.y} />
                </g>
              )
            })}
            {connectingSourceId && draft.layout[connectingSourceId] ? (
              <circle
                className="talent-editor-connection-source"
                cx={draft.layout[connectingSourceId].x}
                cy={draft.layout[connectingSourceId].y}
                r="46"
              />
            ) : null}
          </svg>

          {draft.nodes.map((talent) => {
            const point = draft.layout[talent.id]
            if (!point) return null
            const rank = previewRanks[talent.id] ?? 0
            const state = mode === 'preview'
              ? getPreviewState(draft, previewRanks, talent.id, previewXp)
              : 'unaffordable'
            const nextCost = talent.ranks[rank]?.cost ?? null
            return (
              <div
                className={`talent-canvas__node-position talent-editor-node-position${selectedId === talent.id ? ' talent-editor-node-position--selected' : ''}`}
                data-editor-node-id={talent.id}
                key={talent.id}
                onPointerCancel={finishNodeDrag}
                onPointerDown={(event) => handleNodePointerDown(event, talent.id)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={finishNodeDrag}
                style={{ '--talent-node-x': `${point.x}px`, '--talent-node-y': `${point.y}px` } as CSSProperties}
              >
                <TalentNode
                  isAffordable={state === 'ready'}
                  isSelected={selectedId === talent.id}
                  nextCost={nextCost}
                  onSelect={() => handleNodeSelect(talent.id)}
                  rank={rank}
                  state={state}
                  talent={talent}
                />
                <span className="talent-editor-node-label">{talent.name}</span>
              </div>
            )
          })}
        </div>

        <div aria-label="Editor zoom controls" className="talent-canvas-zoom" data-canvas-control="true">
          <button aria-label="Zoom out" onClick={() => setZoomAroundCenter(zoom - 0.1)} type="button"><Minus size={18} /></button>
          <output>{Math.round(zoom * 100)}%</output>
          <button aria-label="Zoom in" onClick={() => setZoomAroundCenter(zoom + 0.1)} type="button"><Plus size={18} /></button>
        </div>
      </div>
    </div>
  )
}
