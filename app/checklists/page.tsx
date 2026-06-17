'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  ClipboardList,
  Eye,
  Loader2,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, MEMBER_GROUP_LABELS } from '@/lib/utils'
import { BeltSwatch } from '@/components/ui/BeltSwatch'
import {
  getAssignmentScopeLabel,
  getEffectiveTemplateUsage,
  getMatchingMembersForTemplate,
  getTemplateUsageLabel,
  isExamTemplateName,
  isTemplateActive,
  memberMatchesAssignment,
} from '@/lib/checklists'
import type {
  ChecklistAssignment,
  ChecklistItem,
  ChecklistTemplate,
  Graduation,
  Member,
} from '@/types'

type PageTab = 'items' | 'assignments' | 'preview'

interface PreviewMember extends Pick<Member, 'id' | 'first_name' | 'last_name' | 'group_type' | 'graduation_id'> {
  graduation?: Pick<Graduation, 'name' | 'border_color'> | null
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function createEmptyAssignment(templateId: string): Omit<ChecklistAssignment, 'id' | 'created_at' | 'updated_at'> {
  return {
    template_id: templateId,
    scope_type: 'all',
    group_type: null,
    graduation_ids: [],
    member_ids: [],
    priority: 100,
    is_active: true,
  }
}

export default function ChecklistsPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [allAssignments, setAllAssignments] = useState<ChecklistAssignment[]>([])
  const [members, setMembers] = useState<PreviewMember[]>([])
  const [graduations, setGraduations] = useState<Graduation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PageTab>('items')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [memberSearchByAssignment, setMemberSearchByAssignment] = useState<Record<string, string>>({})

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateDetails(selectedTemplateId)
    }
  }, [selectedTemplateId])

  async function loadBaseData() {
    setLoading(true)

    const [{ data: templateRows }, { data: graduationRows }, { data: memberRows }, { data: assignmentRows }] = await Promise.all([
      supabase.from('checklist_templates').select('*').order('created_at'),
      supabase.from('graduations').select('*').order('rank_order'),
      supabase.from('members').select('id, first_name, last_name, group_type, graduation_id, graduations(name, border_color)').order('first_name'),
      supabase.from('checklist_assignments').select('*').order('priority'),
    ])

    const normalizedMembers = ((memberRows || []) as (PreviewMember & { graduations?: Graduation | Graduation[] | null })[])
      .map(member => ({
        ...member,
        graduation: firstRelation(member.graduations) as PreviewMember['graduation'],
      }))

    const nextTemplates = (templateRows || []) as ChecklistTemplate[]
    const preferredTemplate = nextTemplates.find(template => isExamTemplateName(template.name)) || nextTemplates[0] || null

    setTemplates(nextTemplates)
    setGraduations((graduationRows || []) as Graduation[])
    setMembers(normalizedMembers)
    setAllAssignments((assignmentRows || []) as ChecklistAssignment[])
    setSelectedTemplateId(current => current || preferredTemplate?.id || null)
    setLoading(false)
  }

  async function loadTemplateDetails(templateId: string) {
    const [{ data: itemRows }, { data: assignmentRows }] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('template_id', templateId).order('sort_order'),
      supabase.from('checklist_assignments').select('*').eq('template_id', templateId).order('priority'),
    ])

    setItems((itemRows || []) as ChecklistItem[])
    setAllAssignments(prev => {
      const nextAssignments = (assignmentRows || []) as ChecklistAssignment[]
      const assignmentsByOtherTemplates = prev.filter(assignment => assignment.template_id !== templateId)
      return [...assignmentsByOtherTemplates, ...nextAssignments]
    })
  }

  async function createTemplate() {
    const { data } = await supabase
      .from('checklist_templates')
      .insert({
        name: `Neue ${templates.some(template => getEffectiveTemplateUsage(template) === 'member') ? 'Checkliste' : 'Mitglieder-Checkliste'}`,
        usage_type: 'member',
        is_active: true,
        is_default: false,
      })
      .select()
      .single()

    if (!data) return

    const template = data as ChecklistTemplate
    const assignmentSeed = createEmptyAssignment(template.id)

    const { data: assignmentRow } = await supabase
      .from('checklist_assignments')
      .insert(assignmentSeed)
      .select()
      .single()

    setTemplates(prev => [...prev, template])
    setSelectedTemplateId(template.id)
    if (assignmentRow) {
      setAllAssignments(prev => [...prev, assignmentRow as ChecklistAssignment])
    }
    setItems([])
    setActiveTab('items')
  }

  async function updateTemplate(templateId: string, patch: Partial<ChecklistTemplate>) {
    setTemplates(prev => prev.map(template => (
      template.id === templateId ? { ...template, ...patch } : template
    )))

    await supabase.from('checklist_templates').update(patch).eq('id', templateId)
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm('Diese Checkliste inkl. aller Punkte und Zuweisungen löschen?')) return

    await supabase.from('checklist_templates').delete().eq('id', templateId)

    setTemplates(prev => prev.filter(template => template.id !== templateId))
    setAllAssignments(prev => prev.filter(assignment => assignment.template_id !== templateId))

    if (selectedTemplateId === templateId) {
      setItems([])
      setSelectedTemplateId(prev => {
        const remaining = templates.filter(template => template.id !== templateId)
        return remaining[0]?.id || null
      })
    }
  }

  async function addItem() {
    if (!selectedTemplateId || !newItemLabel.trim()) return

    const maxOrder = items.reduce((max, item) => Math.max(max, item.sort_order), 0)
    const { data } = await supabase
      .from('checklist_items')
      .insert({
        template_id: selectedTemplateId,
        label: newItemLabel.trim(),
        is_required: false,
        sort_order: maxOrder + 1,
      })
      .select()
      .single()

    if (!data) return

    setItems(prev => [...prev, data as ChecklistItem])
    setNewItemLabel('')
  }

  async function updateItem(itemId: string, patch: Partial<ChecklistItem>) {
    setItems(prev => prev.map(item => (item.id === itemId ? { ...item, ...patch } : item)))
    await supabase.from('checklist_items').update(patch).eq('id', itemId)
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Diesen Punkt löschen?')) return

    await supabase.from('checklist_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  async function addAssignment() {
    if (!selectedTemplateId) return

    const { data } = await supabase
      .from('checklist_assignments')
      .insert(createEmptyAssignment(selectedTemplateId))
      .select()
      .single()

    if (!data) return

    setAllAssignments(prev => [...prev, data as ChecklistAssignment])
    setActiveTab('assignments')
  }

  async function updateAssignment(assignmentId: string, patch: Partial<ChecklistAssignment>) {
    setAllAssignments(prev => prev.map(assignment => (
      assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
    )))
    await supabase.from('checklist_assignments').update(patch).eq('id', assignmentId)
  }

  async function deleteAssignment(assignmentId: string) {
    await supabase.from('checklist_assignments').delete().eq('id', assignmentId)
    setAllAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId))
  }

  function updateAssignmentScope(assignment: ChecklistAssignment, scopeType: ChecklistAssignment['scope_type']) {
    const patch: Partial<ChecklistAssignment> = {
      scope_type: scopeType,
      group_type: scopeType === 'group' ? assignment.group_type || 'children' : null,
      graduation_ids: scopeType === 'graduation' ? assignment.graduation_ids : [],
      member_ids: scopeType === 'member' ? assignment.member_ids : [],
    }

    updateAssignment(assignment.id, patch)
  }

  function toggleGraduation(assignment: ChecklistAssignment, graduationId: string) {
    const graduationIds = assignment.graduation_ids.includes(graduationId)
      ? assignment.graduation_ids.filter(id => id !== graduationId)
      : [...assignment.graduation_ids, graduationId]

    updateAssignment(assignment.id, { graduation_ids: graduationIds })
  }

  function toggleMember(assignment: ChecklistAssignment, memberId: string) {
    const memberIds = assignment.member_ids.includes(memberId)
      ? assignment.member_ids.filter(id => id !== memberId)
      : [...assignment.member_ids, memberId]

    updateAssignment(assignment.id, { member_ids: memberIds })
  }

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId) || null

  const assignments = useMemo(
    () => allAssignments
      .filter(assignment => assignment.template_id === selectedTemplateId)
      .sort((a, b) => a.priority - b.priority),
    [allAssignments, selectedTemplateId]
  )

  const matchedMemberIds = useMemo(() => {
    if (!selectedTemplate) return new Set<string>()
    return getMatchingMembersForTemplate(selectedTemplate, allAssignments, members)
  }, [allAssignments, members, selectedTemplate])

  const matchedMembers = useMemo(
    () => members.filter(member => matchedMemberIds.has(member.id)),
    [matchedMemberIds, members]
  )

  const previewGroups = useMemo(() => {
    return [
      {
        label: 'Kinder',
        count: matchedMembers.filter(member => member.group_type === 'children').length,
      },
      {
        label: 'Jugend/Erwachsene',
        count: matchedMembers.filter(member => (member.group_type || 'youth_adults') === 'youth_adults').length,
      },
    ]
  }, [matchedMembers])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Checklisten verwalten</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Lege Vorlagen an, ordne sie Mitgliedern zu und prüfe sofort, für wen sie auf Smartphone, Tablet und Desktop gelten.
          </p>
        </div>
        <button onClick={createTemplate} className="btn-primary w-full justify-center md:w-auto">
          <Plus className="h-4 w-4" />
          Neue Vorlage
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="card p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Vorlagen</p>
              <span className="text-xs text-ink-subtle">{templates.length}</span>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-col xl:px-0">
              {templates.map(template => {
                const targetCount = getMatchingMembersForTemplate(template, allAssignments, members).size

                return (
                  <div
                    key={template.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedTemplateId(template.id)
                      setActiveTab('items')
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectedTemplateId(template.id)
                        setActiveTab('items')
                      }
                    }}
                    className={cn(
                      'min-w-[220px] cursor-pointer rounded-xl border px-4 py-3 text-left transition-all xl:min-w-0',
                      selectedTemplateId === template.id
                        ? 'border-accent bg-accent/5 shadow-card'
                        : 'border-surface-3 bg-surface-0 hover:bg-surface-1'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{template.name}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="badge border-surface-3 bg-surface-1 text-ink-muted">
                            {getTemplateUsageLabel(getEffectiveTemplateUsage(template))}
                          </span>
                          {isExamTemplateName(template.name) && (
                            <span className="badge border-green-200 bg-green-50 text-green-700">Prüfung</span>
                          )}
                          {!isTemplateActive(template) && (
                            <span className="badge border-red-200 bg-red-50 text-red-600">Inaktiv</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="rounded-full bg-surface-1 px-2 py-1 text-xs font-medium text-ink-subtle">
                          {targetCount}
                        </span>
                        <button
                          onClick={event => {
                            event.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                          className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Checkliste löschen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {!selectedTemplate ? (
            <div className="card p-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
              <p className="text-sm font-medium text-ink">Noch keine Vorlage ausgewählt.</p>
            </div>
          ) : (
            <>
              <div className="card p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                  <div>
                    <label className="input-label">Name der Vorlage</label>
                    <input
                      className="input"
                      value={selectedTemplate.name}
                      onChange={event => updateTemplate(selectedTemplate.id, { name: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">Bereich</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['member', 'exam'] as const).map(usageType => (
                        <button
                          key={usageType}
                          type="button"
                          onClick={() => updateTemplate(selectedTemplate.id, { usage_type: usageType })}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                            getEffectiveTemplateUsage(selectedTemplate) === usageType
                              ? 'border-accent bg-accent text-white'
                              : 'border-surface-3 bg-surface-0 text-ink-muted hover:bg-surface-1'
                          )}
                        >
                          {getTemplateUsageLabel(usageType)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Status</label>
                    <button
                      type="button"
                      onClick={() => updateTemplate(selectedTemplate.id, { is_active: !isTemplateActive(selectedTemplate) })}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        isTemplateActive(selectedTemplate)
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-surface-3 bg-surface-0 text-ink-muted'
                      )}
                    >
                      {isTemplateActive(selectedTemplate) ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-surface-3 px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'items', label: 'Punkte', icon: CheckSquare },
                      { id: 'assignments', label: 'Zuweisung', icon: Users },
                      { id: 'preview', label: 'Vorschau', icon: Eye },
                    ].map(tab => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as PageTab)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            activeTab === tab.id
                              ? 'bg-ink text-white'
                              : 'bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs leading-relaxed text-ink-subtle">
                    Bei Überschneidungen gewinnt die spezifischere Regel: einzelnes Mitglied vor Gürtel, vor Gruppe, vor alle Mitglieder.
                  </p>
                </div>

                {activeTab === 'items' && (
                  <div className="space-y-3 p-4 sm:p-6">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-surface-3 bg-surface-1 px-4 py-8 text-center">
                        <CheckSquare className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
                        <p className="text-sm font-medium text-ink">Noch keine Punkte</p>
                      </div>
                    ) : (
                      items.map((item, index) => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-3 rounded-xl border border-surface-3 bg-surface-0 p-4"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-1 text-xs font-medium text-ink-subtle">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={item.label}
                            onChange={event => updateItem(item.id, { label: event.target.value })}
                            className="flex-1 border-none bg-transparent p-0 text-sm text-ink outline-none focus:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { is_required: !item.is_required })}
                            title={item.is_required ? 'Pflichtpunkt' : 'Optional'}
                            className={cn(
                              'rounded-lg p-2 transition-colors',
                              item.is_required ? 'bg-amber-50 text-amber-600' : 'bg-surface-1 text-ink-faint'
                            )}
                          >
                            {item.is_required ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}

                    <div className="sticky bottom-0 rounded-xl border border-surface-3 bg-surface-0 p-3 shadow-card">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Neuen Punkt hinzufügen…"
                          value={newItemLabel}
                          onChange={event => setNewItemLabel(event.target.value)}
                          onKeyDown={event => event.key === 'Enter' && addItem()}
                        />
                        <button
                          type="button"
                          onClick={addItem}
                          disabled={!newItemLabel.trim()}
                          className="btn-primary w-full justify-center sm:w-auto"
                        >
                          <Plus className="h-4 w-4" />
                          Hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <div className="space-y-4 p-4 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Bereich</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{getTemplateUsageLabel(getEffectiveTemplateUsage(selectedTemplate))}</p>
                      </div>
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Aktive Regeln</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{assignments.filter(assignment => assignment.is_active).length}</p>
                      </div>
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Zugeordnete Mitglieder</p>
                        <p className="mt-2 text-sm font-semibold text-ink">{matchedMembers.length}</p>
                      </div>
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Mobile Fokus</p>
                        <p className="mt-2 text-sm font-semibold text-ink">Regeln als Karten</p>
                      </div>
                    </div>

                    {assignments.map(assignment => {
                      const matchingCount = members.filter(member => memberMatchesAssignment(member, assignment)).length
                      const memberSearch = memberSearchByAssignment[assignment.id] || ''
                      const suggestedMembers = members
                        .filter(member => !assignment.member_ids.includes(member.id))
                        .filter(member => `${member.first_name} ${member.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()))
                        .slice(0, 6)

                      return (
                        <div key={assignment.id} className="rounded-2xl border border-surface-3 bg-surface-0 p-4">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-ink">{getAssignmentScopeLabel(assignment.scope_type)}</p>
                              <p className="mt-1 text-xs text-ink-subtle">{matchingCount} Mitglieder passen auf diese Regel</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteAssignment(assignment.id)}
                              className="btn-ghost w-full justify-center sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                              Regel löschen
                            </button>
                          </div>

                          <div className="grid gap-4">
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                              {(['all', 'group', 'graduation', 'member'] as const).map(scopeType => (
                                <button
                                  key={scopeType}
                                  type="button"
                                  onClick={() => updateAssignmentScope(assignment, scopeType)}
                                  className={cn(
                                    'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                                    assignment.scope_type === scopeType
                                      ? 'border-accent bg-accent text-white'
                                      : 'border-surface-3 bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink'
                                  )}
                                >
                                  {getAssignmentScopeLabel(scopeType)}
                                </button>
                              ))}
                            </div>

                            {assignment.scope_type === 'group' && (
                              <div>
                                <label className="input-label">Gruppe</label>
                                <select
                                  className="input"
                                  value={assignment.group_type || 'children'}
                                  onChange={event => updateAssignment(assignment.id, { group_type: event.target.value as ChecklistAssignment['group_type'] })}
                                >
                                  <option value="children">Kinder</option>
                                  <option value="youth_adults">Jugend/Erwachsene</option>
                                </select>
                              </div>
                            )}

                            {assignment.scope_type === 'graduation' && (
                              <div>
                                <label className="input-label">Gürtel</label>
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                  {graduations.map(graduation => {
                                    const active = assignment.graduation_ids.includes(graduation.id)

                                    return (
                                      <button
                                        key={graduation.id}
                                        type="button"
                                        onClick={() => toggleGraduation(assignment, graduation.id)}
                                        className={cn(
                                          'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                                          active
                                            ? 'border-accent bg-accent/5 text-ink'
                                            : 'border-surface-3 bg-surface-0 text-ink-muted'
                                        )}
                                      >
                                        <BeltSwatch graduation={graduation} className="h-3 w-3 rounded-full" />
                                        <span className="truncate">{graduation.name}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {assignment.scope_type === 'member' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="input-label">Mitglieder suchen</label>
                                  <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                                    <input
                                      className="input pl-9"
                                      value={memberSearch}
                                      onChange={event => setMemberSearchByAssignment(prev => ({ ...prev, [assignment.id]: event.target.value }))}
                                      placeholder="Name eingeben…"
                                    />
                                  </div>
                                </div>

                                {assignment.member_ids.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {members
                                      .filter(member => assignment.member_ids.includes(member.id))
                                      .map(member => (
                                        <button
                                          key={member.id}
                                          type="button"
                                          onClick={() => toggleMember(assignment, member.id)}
                                          className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
                                        >
                                          {member.first_name} {member.last_name}
                                          <X className="h-3 w-3" />
                                        </button>
                                      ))}
                                  </div>
                                )}

                                <div className="grid gap-2">
                                  {suggestedMembers.map(member => (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => toggleMember(assignment, member.id)}
                                      className="flex items-center justify-between rounded-xl border border-surface-3 bg-surface-1 px-3 py-2 text-left text-sm text-ink hover:bg-surface-2"
                                    >
                                      <span>{member.first_name} {member.last_name}</span>
                                      <span className="text-xs text-ink-subtle">{MEMBER_GROUP_LABELS[member.group_type || 'youth_adults']}</span>
                                    </button>
                                  ))}
                                  {memberSearch && suggestedMembers.length === 0 && (
                                    <p className="text-sm text-ink-muted">Keine weiteren Treffer.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    <button type="button" onClick={addAssignment} className="btn-secondary w-full justify-center">
                      <Plus className="h-4 w-4" />
                      Regel hinzufügen
                    </button>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-4 p-4 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Treffer gesamt</p>
                        <p className="mt-2 text-2xl font-semibold text-ink">{matchedMembers.length}</p>
                      </div>
                      {previewGroups.map(group => (
                        <div key={group.label} className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{group.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-ink">{group.count}</p>
                        </div>
                      ))}
                      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Status</p>
                        <p className="mt-2 text-sm font-semibold text-ink">
                          {isTemplateActive(selectedTemplate) ? 'Aktiv in Auswahl' : 'Derzeit inaktiv'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-surface-3 bg-surface-0">
                      <div className="flex items-center justify-between border-b border-surface-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">Betroffene Mitglieder</p>
                          <p className="text-xs text-ink-subtle">Sofortige Vorschau für Tablet, Smartphone und Desktop</p>
                        </div>
                        <span className="badge border-surface-3 bg-surface-1 text-ink-muted">{matchedMembers.length}</span>
                      </div>

                      {matchedMembers.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Users className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
                          <p className="text-sm font-medium text-ink">Noch keine Mitglieder zugeordnet</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 p-4 md:grid-cols-2">
                          {matchedMembers.slice(0, 24).map(member => (
                            <div key={member.id} className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-ink">{member.first_name} {member.last_name}</p>
                                  <p className="mt-1 text-xs text-ink-subtle">{MEMBER_GROUP_LABELS[member.group_type || 'youth_adults']}</p>
                                </div>
                                {member.graduation && (
                                  <span className="badge border-surface-3 bg-surface-0 text-ink-muted">
                                    {member.graduation.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
