'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { ChecklistItem, MemberChecklistStatus, UserRole } from '@/types'

interface ChecklistSectionProps {
  memberId: string
  examId?: string
  templateId?: string
  role: UserRole
}

interface ChecklistEntry {
  item: ChecklistItem
  status: MemberChecklistStatus | null
}

export function ChecklistSection({ memberId, examId, templateId, role }: ChecklistSectionProps) {
  const supabase = createClient()
  const [entries, setEntries] = useState<ChecklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const canEdit = role === 'admin' || role === 'trainer'

  const load = useCallback(async () => {
    setLoading(true)

    // Get checklist items for the template (or default template)
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

    // Get existing statuses for this member
    const itemIds = items.map(i => i.id)
    let statusQuery = supabase
      .from('member_checklist_status')
      .select('*')
      .eq('member_id', memberId)
      .in('checklist_item_id', itemIds)

    if (examId) statusQuery = statusQuery.eq('exam_id', examId)

    const { data: statuses } = await statusQuery

    const statusMap: Record<string, MemberChecklistStatus> = {}
    ;(statuses || []).forEach(s => { statusMap[s.checklist_item_id] = s as MemberChecklistStatus })

    setEntries(items.map(item => ({ item: item as ChecklistItem, status: statusMap[item.id] || null })))
    setLoading(false)
  }, [memberId, examId, templateId, supabase])

  useEffect(() => { load() }, [load])

  async function toggleItem(entry: ChecklistEntry) {
    if (!canEdit) return
    setToggling(entry.item.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setToggling(null); return }

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

  const doneCount = entries.filter(e => e.status?.is_done).length
  const requiredCount = entries.filter(e => e.item.is_required).length
  const requiredDoneCount = entries.filter(e => e.item.is_required && e.status?.is_done).length
  const allRequiredDone = requiredCount === 0 || requiredDoneCount === requiredCount

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
        <p className="text-sm text-ink-muted">Keine Checkliste verfügbar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-ink-muted mb-1.5">
            <span>{doneCount} von {entries.length} erledigt</span>
            {!allRequiredDone && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                {requiredCount - requiredDoneCount} Pflicht offen
              </span>
            )}
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                allRequiredDone ? 'bg-green-500' : 'bg-amber-400'
              )}
              style={{ width: `${entries.length > 0 ? (doneCount / entries.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          allRequiredDone ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        )}>
          {allRequiredDone ? 'Prüfungsbereit' : 'Nicht bereit'}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {entries.map(entry => {
          const done = entry.status?.is_done || false
          const isLoading = toggling === entry.item.id

          return (
            <div
              key={entry.item.id}
              onClick={() => !isLoading && toggleItem(entry)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
                canEdit ? 'cursor-pointer hover:bg-surface-1' : '',
                done ? 'opacity-60' : ''
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-ink-muted animate-spin" />
                ) : done ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className={cn('w-4 h-4', entry.item.is_required ? 'text-amber-500' : 'text-ink-faint')} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm', done ? 'line-through text-ink-subtle' : 'text-ink')}>
                    {entry.item.label}
                  </p>
                  {entry.item.is_required && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      Pflicht
                    </span>
                  )}
                </div>
                {entry.item.description && (
                  <p className="text-xs text-ink-subtle mt-0.5">{entry.item.description}</p>
                )}
                {done && entry.status?.done_at && (
                  <p className="text-[11px] text-ink-faint mt-0.5">
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
