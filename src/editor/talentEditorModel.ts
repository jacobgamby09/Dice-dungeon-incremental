import { TALENTS } from '../game/content/talents'
import type {
  TalentDefinition,
  TalentEffect,
  TalentIconKey,
  TalentTrack,
} from '../game/types/progression'
import { TALENT_TREE_LAYOUT, TALENT_TREE_WORLD } from '../components/newgame/talentTreeLayout'
import type { TalentTreePoint } from '../components/newgame/talentTreeLayout'

export const TALENT_EDITOR_DRAFT_VERSION = 1
export const TALENT_EDITOR_STORAGE_KEY = 'dice-dungeon-talent-editor-draft-v1'

export type EditorDevice = 'free' | '320' | '384' | '430'
export type EditorMode = 'design' | 'preview' | 'connect'
export type EditorNodeStatus = 'production' | 'draft' | 'implementation-needed'

export interface EditorTalentNode extends TalentDefinition {
  editorStatus: EditorNodeStatus
  implementationNotes: string
}

export interface TalentTreeDraft {
  branchLabels: Record<TalentTrack, TalentTreePoint>
  layout: Record<string, TalentTreePoint>
  name: string
  nodes: EditorTalentNode[]
  version: number
  world: { height: number; width: number }
}

export interface TalentEditorIssue {
  ids: string[]
  message: string
  severity: 'error' | 'warning'
  type: 'cycle' | 'crossing' | 'duplicate' | 'missing' | 'overlap' | 'orphan' | 'outside' | 'custom'
}

const DEFAULT_BRANCH_LABELS: Record<TalentTrack, TalentTreePoint> = {
  core: { x: 900, y: 900 },
  arsenal: { x: 900, y: 715 },
  workshop: { x: 715, y: 900 },
  descent: { x: 900, y: 1085 },
  fate: { x: 1080, y: 900 },
}

export function cloneDraft(draft: TalentTreeDraft): TalentTreeDraft {
  return structuredClone(draft)
}

export function createDraftFromCanonical(): TalentTreeDraft {
  return {
    branchLabels: structuredClone(DEFAULT_BRANCH_LABELS),
    layout: structuredClone(TALENT_TREE_LAYOUT) as Record<string, TalentTreePoint>,
    name: 'Current game tree',
    nodes: TALENTS.map((talent) => ({
      ...structuredClone(talent),
      editorStatus: 'production' as const,
      implementationNotes: '',
    })),
    version: TALENT_EDITOR_DRAFT_VERSION,
    world: { ...TALENT_TREE_WORLD },
  }
}

export function slugifyTalentId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-talent'
}

export function createUniqueTalentId(name: string, nodes: readonly EditorTalentNode[]): string {
  const base = slugifyTalentId(name)
  const ids = new Set(nodes.map((node) => node.id))
  if (!ids.has(base)) return base
  let suffix = 2
  while (ids.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function createEditorNode(
  name: string,
  point: TalentTreePoint,
  nodes: readonly EditorTalentNode[],
  prerequisiteId?: string,
): { node: EditorTalentNode; point: TalentTreePoint } {
  const id = createUniqueTalentId(name, nodes)
  return {
    node: {
      id,
      name,
      description: 'Describe what this talent adds to the build.',
      editorStatus: 'draft',
      iconKey: 'battle-heart',
      implementationNotes: '',
      prerequisiteIds: prerequisiteId ? [prerequisiteId] : [],
      ranks: [{ cost: 10, effects: [{ type: 'max_hp', amount: 1 }] }],
      track: 'core',
    },
    point: { x: Math.round(point.x), y: Math.round(point.y) },
  }
}

export function getDefaultEffect(type: TalentEffect['type']): TalentEffect {
  switch (type) {
    case 'max_hp': return { type, amount: 1 }
    case 'dice_slots': return { type, amount: 1 }
    case 'grant_die': return { type, dieId: 'attack-die-1' }
    case 'roll_speed': return { type, multiplier: 0.8 }
    case 'workshop_die_faces': return { type, values: [1, 1, 1, 1, 2, 2] }
    case 'workshop_target_rerolls': return { type, amount: 1 }
    case 'xp_per_kill': return { type, amount: 1 }
    case 'soul_die_faces': return { type, values: [1, 1, 2, 2, 2, 3] }
    case 'workshop_cost_multiplier': return { type, multiplier: 0.8 }
    case 'charm_slots': return { type, amount: 1 }
    case 'unlock_auto_combat': return { type }
    case 'unlock_charms': return { type }
    case 'charm_rarity_protection': return { type, epicThreshold: 8, legendaryThreshold: 20 }
    case 'fate_drop_multiplier': return { type, multiplier: 1.15 }
    case 'imprint_drop_multiplier': return { type, multiplier: 1.15 }
    case 'imprint_forge_bonus_chance': return { type, chance: 0.12 }
    case 'dungeon_loot_multiplier': return { type, multiplier: 1.15 }
  }
}

function orientation(a: TalentTreePoint, b: TalentTreePoint, c: TalentTreePoint): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
}

function segmentsCross(
  firstA: TalentTreePoint,
  firstB: TalentTreePoint,
  secondA: TalentTreePoint,
  secondB: TalentTreePoint,
): boolean {
  return orientation(firstA, firstB, secondA) * orientation(firstA, firstB, secondB) < 0
    && orientation(secondA, secondB, firstA) * orientation(secondA, secondB, firstB) < 0
}

function findCycle(nodes: readonly EditorTalentNode[]): string[] {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const graph = new Map(nodes.map((node) => [
    node.id,
    node.prerequisiteIds.filter((id) => nodeIds.has(id)),
  ]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const path: string[] = []

  const visit = (id: string): string[] => {
    if (visiting.has(id)) return [...path.slice(path.indexOf(id)), id]
    if (visited.has(id)) return []
    visiting.add(id)
    path.push(id)
    for (const next of graph.get(id) ?? []) {
      const cycle = visit(next)
      if (cycle.length) return cycle
    }
    path.pop()
    visiting.delete(id)
    visited.add(id)
    return []
  }

  for (const node of nodes) {
    const cycle = visit(node.id)
    if (cycle.length) return cycle
  }
  return []
}

export function validateTalentDraft(draft: TalentTreeDraft): TalentEditorIssue[] {
  const issues: TalentEditorIssue[] = []
  const counts = new Map<string, number>()
  for (const node of draft.nodes) counts.set(node.id, (counts.get(node.id) ?? 0) + 1)
  for (const [id, count] of counts) {
    if (count > 1) issues.push({ ids: [id], message: `Duplicate stable ID: ${id}`, severity: 'error', type: 'duplicate' })
  }

  const nodeIds = new Set(draft.nodes.map((node) => node.id))
  for (const node of draft.nodes) {
    if (!draft.layout[node.id]) {
      issues.push({ ids: [node.id], message: `${node.name} has no layout position.`, severity: 'error', type: 'missing' })
    }
    const missing = node.prerequisiteIds.filter((id) => !nodeIds.has(id))
    if (missing.length) {
      issues.push({ ids: [node.id, ...missing], message: `${node.name} references missing prerequisites.`, severity: 'error', type: 'missing' })
    }
    if (node.editorStatus === 'implementation-needed' || node.implementationNotes.trim()) {
      issues.push({ ids: [node.id], message: `${node.name} needs gameplay implementation.`, severity: 'warning', type: 'custom' })
    }
    const point = draft.layout[node.id]
    if (point && (point.x < 50 || point.y < 50 || point.x > draft.world.width - 50 || point.y > draft.world.height - 50)) {
      issues.push({ ids: [node.id], message: `${node.name} sits outside the safe canvas area.`, severity: 'warning', type: 'outside' })
    }
  }

  const cycle = findCycle(draft.nodes)
  if (cycle.length) issues.push({ ids: cycle, message: `Prerequisite cycle: ${cycle.join(' → ')}`, severity: 'error', type: 'cycle' })

  for (let index = 0; index < draft.nodes.length; index += 1) {
    const first = draft.nodes[index]
    const firstPoint = draft.layout[first.id]
    if (!firstPoint) continue
    for (let otherIndex = index + 1; otherIndex < draft.nodes.length; otherIndex += 1) {
      const second = draft.nodes[otherIndex]
      const secondPoint = draft.layout[second.id]
      if (!secondPoint) continue
      if (Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y) < 88) {
        issues.push({ ids: [first.id, second.id], message: `${first.name} overlaps ${second.name}.`, severity: 'warning', type: 'overlap' })
      }
    }
  }

  const edges = draft.nodes.flatMap((target) => target.prerequisiteIds
    .filter((sourceId) => draft.layout[sourceId] && draft.layout[target.id])
    .map((sourceId) => ({ sourceId, targetId: target.id })))
  for (let index = 0; index < edges.length; index += 1) {
    const first = edges[index]
    for (let otherIndex = index + 1; otherIndex < edges.length; otherIndex += 1) {
      const second = edges[otherIndex]
      if ([first.sourceId, first.targetId].some((id) => id === second.sourceId || id === second.targetId)) continue
      if (segmentsCross(
        draft.layout[first.sourceId], draft.layout[first.targetId],
        draft.layout[second.sourceId], draft.layout[second.targetId],
      )) {
        issues.push({
          ids: [first.sourceId, first.targetId, second.sourceId, second.targetId],
          message: `Connections ${first.sourceId} → ${first.targetId} and ${second.sourceId} → ${second.targetId} cross.`,
          severity: 'warning',
          type: 'crossing',
        })
      }
    }
  }

  return issues
}

export function parseTalentDraft(value: unknown): TalentTreeDraft | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<TalentTreeDraft>
  if (candidate.version !== TALENT_EDITOR_DRAFT_VERSION) return null
  if (!Array.isArray(candidate.nodes) || !candidate.layout || !candidate.world || !candidate.branchLabels) return null
  if (!candidate.nodes.every((node) => node && typeof node.id === 'string' && Array.isArray(node.ranks))) return null
  return cloneDraft(candidate as TalentTreeDraft)
}

export function exportDraftJson(draft: TalentTreeDraft): string {
  return JSON.stringify(draft, null, 2)
}

export function exportTalentOutline(draft: TalentTreeDraft): string {
  return JSON.stringify({
    name: draft.name,
    nodes: draft.nodes.map((node) => ({
      id: node.id,
      linksTo: draft.nodes
        .filter((candidate) => candidate.prerequisiteIds.includes(node.id))
        .map((candidate) => candidate.id),
      note: node.description,
      title: node.name,
      x: draft.layout[node.id]?.x ?? 0,
      y: draft.layout[node.id]?.y ?? 0,
    })),
    version: 1,
  }, null, 2)
}

export function exportDraftTypeScript(draft: TalentTreeDraft): string {
  const talentIds = Object.fromEntries(draft.nodes.map((node) => [
    node.id.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase()),
    node.id,
  ]))
  const nodes = draft.nodes.map((node) => ({
    availability: node.availability,
    description: node.description,
    iconKey: node.iconKey,
    id: node.id,
    name: node.name,
    prerequisiteCount: node.prerequisiteCount,
    prerequisiteIds: node.prerequisiteIds,
    ranks: node.ranks,
    requirements: node.requirements,
    track: node.track,
  }))
  return [
    '// Generated by the local Dice Dungeon Talent Tree Editor.',
    `export const TALENT_IDS = ${JSON.stringify(talentIds, null, 2)} as const`,
    '',
    `export const TALENTS = ${JSON.stringify(nodes, null, 2)} as const`,
    '',
    `export const TALENT_TREE_LAYOUT = ${JSON.stringify(draft.layout, null, 2)} as const`,
    '',
  ].join('\n')
}

export const EDITOR_EFFECT_TYPES: TalentEffect['type'][] = [
  'max_hp',
  'dice_slots',
  'grant_die',
  'roll_speed',
  'workshop_die_faces',
  'workshop_target_rerolls',
  'xp_per_kill',
  'soul_die_faces',
  'workshop_cost_multiplier',
  'charm_slots',
  'unlock_auto_combat',
  'unlock_charms',
  'charm_rarity_protection',
]

export function isTalentTrack(value: string): value is TalentTrack {
  return ['core', 'arsenal', 'workshop', 'descent', 'fate'].includes(value)
}

export function isTalentIconKey(value: string): value is TalentIconKey {
  return [
    'battle-heart', 'twin-dice', 'shieldcraft', 'battle-heart-advanced', 'third-grip',
    'quick-draw', 'healing-arts', 'auto-roll', 'fourth-grip', 'executioner-die',
    'tower-die', 'bloodwell-die', 'volatile-temper', 'face-mastery', 'fate-seal',
    'striker-pattern', 'soul-efficiency', 'xp-efficiency', 'workshop-efficiency',
    'charm-pair', 'charm-trinity', 'fate-favor',
  ].includes(value)
}
