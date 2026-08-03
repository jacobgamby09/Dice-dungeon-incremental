import { describe, expect, it } from 'vitest'
import {
  createDraftFromCanonical,
  createEditorNode,
  exportDraftTypeScript,
  exportTalentOutline,
  parseTalentDraft,
  validateTalentDraft,
} from './talentEditorModel'

describe('Talent Tree Editor model', () => {
  it('creates an isolated draft from the canonical game tree', () => {
    const first = createDraftFromCanonical()
    const second = createDraftFromCanonical()

    expect(first.nodes.length).toBeGreaterThan(10)
    expect(validateTalentDraft(first).filter((issue) => issue.severity === 'error')).toEqual([])

    first.nodes[0].name = 'Changed only in draft'
    first.layout[first.nodes[0].id].x += 100
    expect(second.nodes[0].name).not.toBe('Changed only in draft')
    expect(second.layout[second.nodes[0].id].x).not.toBe(first.layout[first.nodes[0].id].x)
  })

  it('creates unique connected draft nodes', () => {
    const draft = createDraftFromCanonical()
    const parent = draft.nodes[0]
    const first = createEditorNode('New Power', { x: 200, y: 300 }, draft.nodes, parent.id)
    draft.nodes.push(first.node)
    const second = createEditorNode('New Power', { x: 400, y: 300 }, draft.nodes, parent.id)

    expect(first.node.id).toBe('new-power')
    expect(second.node.id).toBe('new-power-2')
    expect(first.node.prerequisiteIds).toEqual([parent.id])
    expect(first.node.editorStatus).toBe('draft')
  })

  it('reports cycles, missing prerequisites and overlapping nodes', () => {
    const draft = createDraftFromCanonical()
    const first = draft.nodes[0]
    const second = draft.nodes[1]
    first.prerequisiteIds = [second.id, 'missing-node']
    second.prerequisiteIds = [first.id]
    draft.layout[second.id] = { ...draft.layout[first.id] }

    const issues = validateTalentDraft(draft)
    expect(issues.some((issue) => issue.type === 'cycle' && issue.severity === 'error')).toBe(true)
    expect(issues.some((issue) => issue.type === 'missing' && issue.severity === 'error')).toBe(true)
    expect(issues.some((issue) => issue.type === 'overlap' && issue.severity === 'warning')).toBe(true)
  })

  it('rejects malformed imports and exports implementation-safe TypeScript', () => {
    expect(parseTalentDraft({ version: 99 })).toBeNull()

    const draft = createDraftFromCanonical()
    draft.nodes[0].implementationNotes = 'A future effect'
    const output = exportDraftTypeScript(draft)

    expect(output).toContain('export const TALENTS')
    expect(output).toContain('export const TALENT_TREE_LAYOUT')
    expect(output).not.toContain('implementationNotes')
    expect(output).not.toContain('editorStatus')
  })

  it('exports only the visual outline and its directed links', () => {
    const draft = createDraftFromCanonical()
    const parent = draft.nodes.find((node) => node.id === 'battle-hardened-1')!
    const child = draft.nodes.find((node) => node.prerequisiteIds.includes(parent.id))!
    const outline = JSON.parse(exportTalentOutline(draft)) as {
      nodes: Array<{ id: string; linksTo: string[]; note: string; title: string; x: number; y: number }>
    }
    const exportedParent = outline.nodes.find((node) => node.id === parent.id)!

    expect(exportedParent.title).toBe(parent.name)
    expect(exportedParent.note).toBe(parent.description)
    expect(exportedParent.linksTo).toContain(child.id)
    expect(exportedParent.x).toBe(draft.layout[parent.id].x)
    expect(exportedParent).not.toHaveProperty('ranks')
  })
})
