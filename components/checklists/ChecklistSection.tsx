'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, Circle, Loader2, AlertCircle, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'
import { getEffectiveTemplateUsage, getTemplateUsageLabel, resolveApplicableTemplate } from '@/lib/checklists'
import type {
  ChecklistAssignment,
  ChecklistItem,
  ChecklistTemplate,
  MemberChecklistStatus,
  UserRole,
  Member,
} from '@/types'

interface ChecklistSectionProps {
  memberId: string
  examId?: string
  templateId?: string
  role: UserRole
  onReadyChange?: (isReady: boolean) => void
}

interface ChecklistEntry {
  item: ChecklistItem
  status: MemberChecklistStatus | null
}

type MemberTarget = Pick<Member, 'id' | 'group_type' | 'graduation_id'>

export function ChecklistSection({
  memberId,
  examId,
  templateId,
  role,
  onReadyChange,
}: ChecklistSectionProps) {
  const supabase = createClient()
  const [entries, setEntries] = useState<ChecklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [templateLabel, setTemplateLabel] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState('Keine passende Checkliste zugewiesen.')

  const canEdit = role === 'admin' || role === 'trainer'

  const load = useCallback(async () => {
    setLoading(true)

    const usageType = examId ? 'exam' : 'member'

    const [{ data: member }, { data: templates }, { data: assignments }] = await Promise.all([
      supabase
        .from('members')
        .select('id, group_type, graduation_id')
        .eq('id', memberId)
        .single(),
      supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_active', true),
      supabase
        .from('checklist_assignments')
        .select('*')
        .eq('is_active', true)
        .order('priority'),
    ])

    const memberTarget = member as MemberTarget | null

    if (!memberTarget) {
      setEntries([])
      setTemplateLabel(null)
      setEmptyMessage('Mitglied konnte nicht geladen werden.')
      setLoading(false)
      return
    }

    const resolvedTemplate = templateId
      ? (templates || []).find(template => template.id === templateId) || null
      : resolveApplicableTemplate(
          usageType,
          (templates || []) as ChecklistTemplate[],
          (assignments || []) as ChecklistAssignment[],
          memberTarget
        )?.template || null

    if (!resolvedTemplate) {
      setEntries([])
      setTemplateLabel(null)
      setEmptyMessage(
        examId
          ? 'Keine passende Prüfungscheckliste zugewiesen.'
          : 'Keine passende Mitglieder-Checkliste zugewiesen.'
      )
      setLoading(false)
      return
    }

    setTemplateLabel(`${getTemplateUsageLabel(getEffectiveTemplateUsage(resolvedTemplate))}: ${resolvedTemplate.name}`)

    const { data: items } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('template_id', resolvedTemplate.id)
      .order('sort_order')

    if (!items || items.length === 0) {
      setEntries([])
      setEmptyMessage('Diese Checkliste enthält noch keine Punkte.')
      setLoading(false)
      return
    }

    const itemIds = items.map(item => item.id)
    let statusQuery = supabase
      .from('member_checklist_status')
      .select('*')
      .eq('member_id', memberId)
      .in('checklist_item_id', itemIds)

    if (examId) statusQuery = statusQuery.eq('exam_id', examId)

    let { data: statuses } = await statusQuery

    if (examId && canEdit) {
      const existingStatusIds = new Set((statuses || []).map(status => status.checklist_item_id))
      const missingItems = items.filter(item => !existingStatusIds.has(item.id))

      if (missingItems.length > 0) {
        await supabase.from('member_checklist_status').insert(
          missingItems.map(item => ({
            member_id: memberId,
            exam_id: examId,
            checklist_item_id: item.id,
            is_done: false,
            done_at: null,
            done_by: null,
            notes: null,
          }))
        )

        const { data: refreshedStatuses } = await statusQuery
        statuses = refreshedStatuses
      }
    }

    const statusMap: Record<string, MemberChecklistStatus> = {}
    ;(statuses || []).forEach(status => {
      statusMap[status.checklist_item_id] = status as MemberChecklistStatus
    })

    setEntries(items.map(item => ({ item: item as ChecklistItem, status: statusMap[item.id] || null })))
    setLoading(false)
  }, [canEdit, examId, memberId, supabase, templateId])

  useEffect(() => {
    load()
  }, [load])

  async function toggleItem(entry: ChecklistEntry) {
    if (!canEdit) return

    setToggling(entry.item.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setToggling(null)
      return
    }

    const newDone = !entry.status?.is_done

    if (entry.status) {
      await supabase
        .from('member_checklist_status')
        .update({
          is_done: newDone,
          done_at: newDone ? new Date().toISOString() : null,
          done_by: newDone ? user.id : null,
        })
        .eq('id', entry.status.id)
    } else {
      await supabase.from('member_checklist_status').insert({
        member_id: memberId,
        exam_id: examId || null,
        checklist_item_id: entry.item.id,
        is_done: newDone,
        done_at: newDone ? new Date().toISOString() : null,
        done_by: newDone ? user.id : null,
      })
    }

    await load()
    setToggling(null)
  }

  const doneCount = entries.filter(entry => entry.status?.is_done).length
  const allItemsDone = entries.length > 0 && doneCount === entries.length

  useEffect(() => {
    if (!loading) onReadyChange?.(allItemsDone)
  }, [loading, allItemsDone, onReadyChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-3 bg-surface-1 px-4 py-6 text-center">
        <ClipboardList className="mx-auto mb-2 h-6 w-6 text-ink-faint" />
        <p className="text-sm font-medium text-ink">{emptyMessage}</p>
        {templateLabel && <p className="mt-1 text-xs text-ink-subtle">{templateLabel}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {templateLabel && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-surface-1 text-ink-muted border-surface-3">
            {templateLabel}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-surface-3 bg-surface-1 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
            <span>{doneCount} von {entries.length} erledigt</span>
            {!allItemsDone && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {entries.length - doneCount} offen
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                allItemsDone ? 'bg-green-500' : 'bg-amber-400'
              )}
              style={{ width: `${entries.length > 0 ? (doneCount / entries.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            allItemsDone ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          )}
        >
          {allItemsDone ? 'Prüfungsbereit' : 'Nicht bereit'}
        </span>
      </div>

      <div className="space-y-2">
        {entries.map(entry => {
          const done = entry.status?.is_done || false
          const isLoading = toggling === entry.item.id

          return (
            <div
              key={entry.item.id}
              onClick={() => !isLoading && toggleItem(entry)}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-surface-3 bg-surface-0 p-4 transition-all duration-150',
                canEdit ? 'cursor-pointer hover:bg-surface-1' : '',
                done ? 'opacity-65' : ''
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className={cn('h-4 w-4', entry.item.is_required ? 'text-amber-500' : 'text-ink-faint')} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-sm', done ? 'text-ink-subtle line-through' : 'text-ink')}>
                    {entry.item.label}
                  </p>
                  {entry.item.is_required && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                      Pflicht
                    </span>
                  )}
                </div>
                {entry.item.description && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-subtle">{entry.item.description}</p>
                )}
                {done && entry.status?.done_at && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Erledigt am {formatDate(entry.status.done_at)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
