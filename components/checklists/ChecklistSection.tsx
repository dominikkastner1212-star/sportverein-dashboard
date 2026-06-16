'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'
import type { ChecklistItem, MemberChecklistStatus, UserRole } from '@/types'

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

  const canEdit = role === 'admin' || role === 'trainer'

  const load = useCallback(async () => {
    setLoading(true)

    let query = supabase.from('checklist_items').select('*, checklist_templates!inner(*)')

    if (templateId) {
      query = query.eq('template_id', templateId)
    } else {
      query = query.eq('checklist_templates.is_default', true)
    }

    const { data: items } = await query.order('sort_order')

    if (!items || items.length === 0) {
      setEntries([])
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

    const { data: statuses } = await statusQuery

    const statusMap: Record<string, MemberChecklistStatus> = {}
    ;(statuses || []).forEach(status => {
      statusMap[status.checklist_item_id] = status as MemberChecklistStatus
    })

    setEntries(items.map(item => ({ item: item as ChecklistItem, status: statusMap[item.id] || null })))
    setLoading(false)
  }, [memberId, examId, templateId, supabase])

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
        <Loader2 className="w-5 h-5 text-ink-faint animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-ink-muted">Keine Checkliste verfuegbar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
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
            'rounded-full px-2 py-1 text-xs font-medium',
            allItemsDone ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          )}
        >
          {allItemsDone ? 'Pruefungsbereit' : 'Nicht bereit'}
        </span>
      </div>

      <div className="space-y-1.5">
        {entries.map(entry => {
          const done = entry.status?.is_done || false
          const isLoading = toggling === entry.item.id

          return (
            <div
              key={entry.item.id}
              onClick={() => !isLoading && toggleItem(entry)}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-all duration-150',
                canEdit ? 'cursor-pointer hover:bg-surface-1' : '',
                done ? 'opacity-60' : ''
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
                <div className="flex items-center gap-2">
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
                  <p className="mt-0.5 text-xs text-ink-subtle">{entry.item.description}</p>
                )}
                {done && entry.status?.done_at && (
                  <p className="mt-0.5 text-[11px] text-ink-faint">
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
