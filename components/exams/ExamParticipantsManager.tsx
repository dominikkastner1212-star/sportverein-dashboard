'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Graduation, Member } from '@/types'

interface ExamParticipantView {
  id: string
  member_id: string
  target_graduation_id: string | null
  member_name: string
  target_graduation_name: string | null
}

interface ExamParticipantsManagerProps {
  examId: string
  canEdit: boolean
  members: Pick<Member, 'id' | 'first_name' | 'last_name' | 'graduation_id'>[]
  graduations: Graduation[]
  initialParticipants: ExamParticipantView[]
}

export function ExamParticipantsManager({
  examId,
  canEdit,
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
  const [error, setError] = useState<string | null>(null)

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
      setError(insertError?.message || 'Teilnehmer konnte nicht hinzugefuegt werden.')
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
            <option value="">Mitglied auswaehlen</option>
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
            <option value="">Zielguertel optional</option>
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
            Hinzufuegen
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
          {participants.map(participant => (
            <div key={participant.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-1 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{participant.member_name}</p>
                <p className="text-xs text-ink-subtle">
                  {participant.target_graduation_name || 'Kein Zielguertel'}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="text-ink-subtle hover:text-red-600"
                  onClick={() => removeParticipant(participant.id)}
                  aria-label="Teilnehmer entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
