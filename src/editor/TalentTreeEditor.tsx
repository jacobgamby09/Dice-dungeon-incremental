import {
  Check,
  Download,
  Link2,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  Unlink,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { TalentRanks } from '../game/types/progression'
import type { TalentTreePoint } from '../components/newgame/talentTreeLayout'
import { EditorTalentCanvas } from './EditorTalentCanvas'
import {
  TALENT_EDITOR_STORAGE_KEY,
  cloneDraft,
  createDraftFromCanonical,
  createEditorNode,
  exportTalentOutline,
  parseTalentDraft,
} from './talentEditorModel'
import type { EditorTalentNode, TalentTreeDraft } from './talentEditorModel'

const MAX_HISTORY = 100
const EMPTY_RANKS: TalentRanks = {}

function loadInitialDraft(): TalentTreeDraft {
  try {
    const saved = localStorage.getItem(TALENT_EDITOR_STORAGE_KEY)
    if (saved) return parseTalentDraft(JSON.parse(saved)) ?? createDraftFromCanonical()
  } catch {
    // A broken local outline must never block the editor from opening.
  }
  return createDraftFromCanonical()
}

function downloadOutline(draft: TalentTreeDraft) {
  const url = URL.createObjectURL(new Blob([exportTalentOutline(draft)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'talent-tree-outline.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function TalentTreeEditor() {
  const [draft, setDraft] = useState<TalentTreeDraft>(loadInitialDraft)
  const [selectedId, setSelectedId] = useState<string | null>(draft.nodes[0]?.id ?? null)
  const [isLinking, setIsLinking] = useState(false)
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<TalentTreeDraft[]>([])
  const [redoStack, setRedoStack] = useState<TalentTreeDraft[]>([])
  const [savedAt, setSavedAt] = useState('')
  const dragStartRef = useRef<TalentTreeDraft | null>(null)

  const selectedNode = draft.nodes.find((node) => node.id === selectedId) ?? null
  const parentNodes = selectedNode
    ? selectedNode.prerequisiteIds
        .map((id) => draft.nodes.find((node) => node.id === id))
        .filter((node): node is EditorTalentNode => Boolean(node))
    : []
  const childNodes = selectedNode
    ? draft.nodes.filter((node) => node.prerequisiteIds.includes(selectedNode.id))
    : []

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(TALENT_EDITOR_STORAGE_KEY, JSON.stringify(draft))
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 180)
    return () => window.clearTimeout(timeout)
  }, [draft])

  const commitDraft = (next: TalentTreeDraft) => {
    setUndoStack((stack) => [...stack.slice(-(MAX_HISTORY - 1)), cloneDraft(draft)])
    setRedoStack([])
    setDraft(next)
  }

  const mutateDraft = (mutate: (next: TalentTreeDraft) => void) => {
    const next = cloneDraft(draft)
    mutate(next)
    commitDraft(next)
  }

  const updateNode = (id: string, update: (node: EditorTalentNode) => void) => {
    mutateDraft((next) => {
      const node = next.nodes.find((candidate) => candidate.id === id)
      if (node) update(node)
    })
  }

  const addNode = (point: TalentTreePoint, parentId = selectedId ?? undefined) => {
    const created = createEditorNode('New Node', point, draft.nodes, parentId)
    mutateDraft((next) => {
      next.nodes.push(created.node)
      next.layout[created.node.id] = created.point
    })
    setSelectedId(created.node.id)
    setIsLinking(false)
    setLinkSourceId(null)
  }

  const addConnectedNode = () => {
    if (!selectedNode) return
    const origin = draft.layout[selectedNode.id]
    const direction = childNodes.length % 2 === 0 ? 1 : -1
    addNode({
      x: origin.x + direction * (80 + Math.floor(childNodes.length / 2) * 55),
      y: origin.y + 130,
    }, selectedNode.id)
  }

  const deleteSelectedNode = () => {
    if (!selectedNode || !window.confirm(`Delete ${selectedNode.name} and all of its links?`)) return
    mutateDraft((next) => {
      next.nodes = next.nodes.filter((node) => node.id !== selectedNode.id)
      delete next.layout[selectedNode.id]
      for (const node of next.nodes) {
        node.prerequisiteIds = node.prerequisiteIds.filter((id) => id !== selectedNode.id)
      }
    })
    setSelectedId(null)
  }

  const disconnect = (sourceId: string, targetId: string) => {
    mutateDraft((next) => {
      const target = next.nodes.find((node) => node.id === targetId)
      if (target) target.prerequisiteIds = target.prerequisiteIds.filter((id) => id !== sourceId)
    })
  }

  const startLinking = () => {
    if (!selectedNode) return
    setIsLinking(true)
    setLinkSourceId(selectedNode.id)
  }

  const handleLinkNode = (targetId: string) => {
    if (!linkSourceId) {
      setLinkSourceId(targetId)
      setSelectedId(targetId)
      return
    }
    if (targetId === linkSourceId) {
      setIsLinking(false)
      setLinkSourceId(null)
      return
    }
    mutateDraft((next) => {
      const target = next.nodes.find((node) => node.id === targetId)
      if (!target) return
      target.prerequisiteIds = target.prerequisiteIds.includes(linkSourceId)
        ? target.prerequisiteIds.filter((id) => id !== linkSourceId)
        : [...target.prerequisiteIds, linkSourceId]
    })
    setSelectedId(targetId)
    setIsLinking(false)
    setLinkSourceId(null)
  }

  const undo = () => {
    const previous = undoStack.at(-1)
    if (!previous) return
    setRedoStack((stack) => [...stack, cloneDraft(draft)])
    setUndoStack((stack) => stack.slice(0, -1))
    setDraft(cloneDraft(previous))
  }

  const redo = () => {
    const next = redoStack.at(-1)
    if (!next) return
    setUndoStack((stack) => [...stack, cloneDraft(draft)])
    setRedoStack((stack) => stack.slice(0, -1))
    setDraft(cloneDraft(next))
  }

  const reset = () => {
    if (!window.confirm('Reset this outline to the current in-game Talent Tree?')) return
    commitDraft(createDraftFromCanonical())
    setSelectedId(null)
    setIsLinking(false)
    setLinkSourceId(null)
  }

  return (
    <main className="talent-editor-shell talent-outline-editor">
      <header className="talent-editor-toolbar">
        <div className="talent-editor-brand">
          <span>LOCAL OUTLINE TOOL</span>
          <strong>TALENT TREE EDITOR</strong>
        </div>

        <div className="talent-editor-toolbar__group">
          <button
            onClick={() => {
              const origin = selectedId ? draft.layout[selectedId] : null
              addNode(origin ? { x: origin.x + 120, y: origin.y + 120 } : { x: 900, y: 900 })
            }}
            type="button"
          >
            <Plus size={17} /> Add Node
          </button>
          <button
            className={isLinking ? 'is-active' : ''}
            disabled={!selectedNode}
            onClick={startLinking}
            type="button"
          >
            <Link2 size={17} /> Add / Remove Link
          </button>
        </div>

        <div className="talent-editor-toolbar__group">
          <button aria-label="Undo" disabled={!undoStack.length} onClick={undo} type="button"><Undo2 size={17} /></button>
          <button aria-label="Redo" disabled={!redoStack.length} onClick={redo} type="button"><Redo2 size={17} /></button>
        </div>

        <div className="talent-editor-toolbar__group">
          <button onClick={() => downloadOutline(draft)} type="button"><Download size={17} /> Export Outline</button>
          <button className="is-danger" onClick={reset} type="button"><RotateCcw size={17} /> Reset</button>
        </div>

        <div className="talent-editor-save-state"><Check size={15} /> Saved {savedAt || '—'}</div>
      </header>

      <section className="talent-outline-workspace">
        <div className="talent-editor-stage">
          {isLinking ? (
            <div className="talent-editor-mode-note">
              Click another node to add or remove its link from {selectedNode?.name ?? 'the selected node'}.
            </div>
          ) : (
            <div className="talent-outline-help">Drag nodes · Double-click empty space to add · Click a node to edit</div>
          )}
          <EditorTalentCanvas
            connectingSourceId={linkSourceId}
            device="free"
            draft={draft}
            gridSize={20}
            mode={isLinking ? 'connect' : 'design'}
            onCanvasCreate={addNode}
            onConnectNode={handleLinkNode}
            onMove={(id, point) => setDraft((current) => ({ ...current, layout: { ...current.layout, [id]: point } }))}
            onMoveEnd={() => {
              if (dragStartRef.current) {
                setUndoStack((stack) => [...stack.slice(-(MAX_HISTORY - 1)), dragStartRef.current!])
                setRedoStack([])
                dragStartRef.current = null
              }
            }}
            onMoveStart={() => { dragStartRef.current = cloneDraft(draft) }}
            onSelectNode={setSelectedId}
            previewRanks={EMPTY_RANKS}
            previewXp={0}
            selectedId={selectedId}
            snapToGrid
          />
        </div>

        <aside className="talent-outline-inspector">
          {selectedNode ? (
            <>
              <header>
                <span>SELECTED NODE</span>
                <button aria-label="Delete node" className="is-danger" onClick={deleteSelectedNode} type="button"><Trash2 size={17} /></button>
              </header>

              <label>
                Title
                <input onChange={(event) => updateNode(selectedNode.id, (node) => { node.name = event.target.value })} value={selectedNode.name} />
              </label>
              <label>
                Note
                <textarea
                  onChange={(event) => updateNode(selectedNode.id, (node) => { node.description = event.target.value })}
                  placeholder="What should this node eventually do?"
                  rows={5}
                  value={selectedNode.description}
                />
              </label>

              <button className="talent-outline-primary" onClick={addConnectedNode} type="button"><Plus size={17} /> Add Connected Node</button>
              <button className={isLinking ? 'is-active' : ''} onClick={startLinking} type="button"><Link2 size={17} /> Add / Remove Link</button>

              <section className="talent-outline-links">
                <h2>Links</h2>
                {!parentNodes.length && !childNodes.length ? <p>No links yet.</p> : null}
                {parentNodes.map((node) => (
                  <div key={`parent-${node.id}`}>
                    <span><small>FROM</small>{node.name}</span>
                    <button aria-label={`Disconnect ${node.name}`} onClick={() => disconnect(node.id, selectedNode.id)} type="button"><Unlink size={15} /></button>
                  </div>
                ))}
                {childNodes.map((node) => (
                  <div key={`child-${node.id}`}>
                    <span><small>TO</small>{node.name}</span>
                    <button aria-label={`Disconnect ${node.name}`} onClick={() => disconnect(selectedNode.id, node.id)} type="button"><Unlink size={15} /></button>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <div className="talent-editor-empty-inspector">
              <Plus size={28} />
              <h2>Select a node</h2>
              <p>Edit its title and note, or double-click the canvas to create a new one.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
