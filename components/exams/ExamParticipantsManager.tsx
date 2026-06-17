'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Loader2, Plus, RotateCcw, Trash2, Users, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChecklistSection } from '@/components/checklists/ChecklistSection'
import { cn } from '@/lib/utils'
import type { Graduation, Member, UserRole } from '@/types'

interface ExamParticipantView {
  id: string
  member_id: string
  target_graduation_id: string | null
  member_name: string
  target_graduation_name: string | null
  passed: boolean | null
}
interface ExamParticipantsManagerProps {
  examId: string
  examDate: string
  canEdit: boolean
  role: UserRole
  members: Pick<Member, 'id' | 'first_name' | 'last_name' | 'graduation_id'>[]
  graduations: Graduation[]
  initialParticipants: ExamParticipantView[]
}

export function ExamParticipantsManager({
  examId,
  examDate,
  canEdit,
  role,
  members,
  graduations,
  initialParticipants,
}: ExamParticipantsManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [participants, setParticipants] = useState(initialParticipants)
  const [memberId, setMemberId] = useState('')
  const [targetGraduationId, setTargetGraduationId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checklistReadyByParticipant, setChecklistReadyByParticipant] = useState<Record<string, boolean>>({})
  const [expandedParticipantIds, setExpandedParticipantIds] = useState<Record<string, boolean>>({})

  const participantMemberIds = useMemo(
    () => new Set(participants.map(participant => participant.member_id)),
    [participants]
  )
  const availableMembers = members.filter(member => !participantMemberIds.has(member.id))

  async function addParticipant() {
    if (!memberId) return

    setSubmitting(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('exam_participants')
      .insert({
        exam_id: examId,
        member_id: memberId,
        target_graduation_id: targetGraduationId || null,
        passed: null,
        notes: null,
      })
      .select('id, member_id, target_graduation_id')
      .single()

    if (insertError || !data) {
      setError(insertError?.message || 'Teilnehmer konnte nicht hinzugefügt werden.')
      setSubmitting(false)
      return
    }

    const member = members.find(item => item.id === memberId)
    const targetGraduation = graduations.find(item => item.id === targetGraduationId)
    setParticipants(prev => [
      ...prev,
      {
        id: data.id,
        member_id: data.member_id,
        target_graduation_id: data.target_graduation_id,
        member_name: member ? `${member.first_name} ${member.last_name}` : 'Unbekannt',
        target_graduation_name: targetGraduation?.name || null,
        passed: null,
      },
    ])
    setMemberId('')
    setTargetGraduationId('')
    setSubmitting(false)
    router.refresh()
  }

  async function removeParticipant(id: string) {
    setError(null)
    const { error: deleteError } = await supabase
      .from('exam_participants')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setParticipants(prev => prev.filter(participant => participant.id !== id))
    setChecklistReadyByParticipant(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    router.refresh()
  }

  function updateChecklistReady(participantId: string, isReady: boolean) {
    setChecklistReadyByParticipant(prev => (
      prev[participantId] === isReady ? prev : { ...prev, [participantId]: isReady }
    ))
  }

  function toggleExpanded(participantId: string) {
    setExpandedParticipantIds(prev => ({ ...prev, [participantId]: !prev[participantId] }))
  }

  async function setParticipantResult(participant: ExamParticipantView, passed: boolean | null) {
    setError(null)
    setUpdatingId(participant.id)

    if (passed !== null && !participant.target_graduation_id) {
      setError('Bitte zuerst einen Zielgürtel für den Teilnehmer hinterlegen.')
      setUpdatingId(null)
      return
    }

    if (passed !== null && checklistReadyByParticipant[participant.id] !== true) {
      setError('Die Prüfungscheckliste muss für diesen Teilnehmer vollständig abgehakt sein.')
      setUpdatingId(null)
      return
    }

    const { error: participantError } = await supabase
      .from('exam_participants')
      .update({ passed })
      .eq('id', participant.id)

    if (participantError) {
      setError(participantError.message)
      setUpdatingId(null)
      return
    }

    if (passed !== null && participant.target_graduation_id) {
      const { data: existingHistory } = await supabase
        .from('exam_history')
        .select('id')
        .eq('member_id', participant.member_id)
        .eq('exam_id', examId)
        .eq('graduation_id', participant.target_graduation_id)
        .maybeSingle()

      const historyPayload = {
        member_id: participant.member_id,
        exam_id: examId,
        graduation_id: participant.target_graduation_id,
        passed,
        date: examDate,
        notes: null,
        examiner: null,
      }

      const historyQuery = existingHistory
        ? supabase.from('exam_history').update(historyPayload).eq('id', existingHistory.id)
        : supabase.from('exam_history').insert(historyPayload)

      const { error: historyError } = await historyQuery
      if (historyError) {
        setError(historyError.message)
        setUpdatingId(null)
        return
      }

      const memberPayload: { last_exam_date: string; graduation_id?: string } = {
        last_exam_date: examDate,
      }

      if (passed) {
        memberPayload.graduation_id = participant.target_graduation_id
      }

      const { error: memberError } = await supabase
        .from('members')
        .update(memberPayload)
        .eq('id', participant.member_id)

      if (memberError) {
        setError(memberError.message)
        setUpdatingId(null)
        return
      }
    }

    setParticipants(prev => prev.map(item => (
      item.id === participant.id ? { ...item, passed } : item
    )))
    setUpdatingId(null)
    router.refresh()
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="section-title">Teilnehmer</h2>
          <p className="section-subtitle mt-0.5">{participants.length} eingetragen</p>
        </div>
        <Users className="w-4 h-4 text-ink-faint" />
      </div>

      {canEdit && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
          <select
            className="input"
            value={memberId}
            onChange={event => setMemberId(event.target.value)}
          >
            <option value="">Mitglied auswählen</option>
            {availableMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={targetGraduationId}
            onChange={event => setTargetGraduationId(event.target.value)}
          >
            <option value="">Zielgürtel optional</option>
            {graduations.map(graduation => (
              <option key={graduation.id} value={graduation.id}>
                {graduation.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-primary justify-center"
            disabled={!memberId || submitting}
            onClick={addParticipant}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Hinzufügen
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {participants.length === 0 ? (
        <p className="text-sm text-ink-muted">Noch keine Teilnehmer hinterlegt.</p>
      ) : (
        <div className="space-y-2">
          {participants.map(participant => {
            const checklistReady = checklistReadyByParticipant[participant.id] === true
            const canSubmitResult = checklistReady && !!participant.target_graduation_id

            return (
              <div key={participant.id} className="rounded-lg bg-surface-1 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{participant.member_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-ink-subtle">
                        Zielrang: {participant.target_graduation_name || 'Kein Zielgürtel'}
                      </p>
                      <span className={cn(
                        'badge text-[10px]',
                        participant.passed === true && 'bg-green-50 text-green-700 border-green-200',
                        participant.passed === false && 'bg-red-50 text-red-700 border-red-200',
                        participant.passed === null && 'bg-surface-2 text-ink-muted border-surface-3'
                      )}>
                        {participant.passed === true ? 'Bestanden' : participant.passed === false ? 'Nicht bestanden' : 'Offen'}
                      </span>
                      <span className={cn(
                        'badge text-[10px]',
                        checklistReady
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        {checklistReady ? 'Checkliste komplett' : 'Checkliste offen'}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        className="btn-ghost btn-sm p-1.5 text-green-700"
                        onClick={() => setParticipantResult(participant, true)}
                        disabled={updatingId === participant.id || !canSubmitResult}
                        title={canSubmitResult ? 'Bestanden' : 'Checkliste und Zielgürtel erforderlich'}
                      >
                        {updatingId === participant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm p-1.5 text-red-600"
                        onClick={() => setParticipantResult(participant, false)}
                        disabled={updatingId === participant.id || !canSubmitResult}
                        title={canSubmitResult ? 'Nicht bestanden' : 'Checkliste und Zielgürtel erforderlich'}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm p-1.5"
                        onClick={() => setParticipantResult(participant, null)}
                        disabled={updatingId === participant.id}
                        title="Offen setzen"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-ink-subtle hover:text-red-600"
                        onClick={() => removeParticipant(participant.id)}
                        aria-label="Teilnehmer entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-surface-3 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(participant.id)}
                    className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-muted"
                  >
                    <span>Aufgaben</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedParticipantIds[participant.id] && 'rotate-180'
                      )}
                    />
                  </button>
                  <div className={cn('mt-2', expandedParticipantIds[participant.id] ? 'block' : 'hidden')}>
                    <ChecklistSection
                      memberId={participant.member_id}
                      examId={examId}
                      role={role}
                      onReadyChange={isReady => updateChecklistReady(participant.id, isReady)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
