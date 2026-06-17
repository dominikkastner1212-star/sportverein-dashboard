import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Edit, MapPin } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { ExamParticipantsManager } from '@/components/exams/ExamParticipantsManager'
import { getVisibleGraduations } from '@/lib/graduations'
import { formatDate, EXAM_STATUS_LABELS, EXAM_STATUS_COLORS, cn } from '@/lib/utils'
import { BeltSwatch } from '@/components/ui/BeltSwatch'
import type { Exam, ExamStatus, Graduation, Member, UserRole } from '@/types'

type ParticipantMember = { first_name: string; last_name: string }
type ParticipantGraduation = { name: string }
type ParticipantRow = {
  id: string
  member_id: string
  target_graduation_id: string | null
  passed: boolean | null
  members: ParticipantMember | ParticipantMember[] | null
  graduations: ParticipantGraduation | ParticipantGraduation[] | null
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const [{ data: profile }, { data: exam }, { data: graduations }, { data: participants }, { data: members }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session?.user.id || '')
      .single(),
    supabase
      .from('exams')
      .select('*, profiles!examiner_id(full_name)')
      .eq('id', id)
      .single(),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
    supabase
      .from('exam_participants')
      .select('id, member_id, target_graduation_id, passed, members(first_name, last_name), graduations(name)')
      .eq('exam_id', id),
    supabase
      .from('members')
      .select('id, first_name, last_name, graduation_id')
      .order('first_name'),
  ])

  if (!exam) {
    notFound()
  }

  const role = (profile?.role || 'reader') as UserRole
  const canEdit = role === 'admin' || role === 'trainer'
  const examRow = exam as Exam & { profiles: { full_name: string | null } | { full_name: string | null }[] | null }
  const e = { ...examRow, profiles: firstRelation(examRow.profiles) }
  const visibleGraduations = getVisibleGraduations((graduations || []) as Graduation[])
  const allowedIds = new Set(e.allowed_graduation_ids || [])
  const allowedGraduations = visibleGraduations.filter(g => allowedIds.has(g.id))
  const status = e.status as ExamStatus
  const participantViews = ((participants || []) as ParticipantRow[]).map(participant => {
    const member = firstRelation(participant.members)
    const graduation = firstRelation(participant.graduations)

    return {
      id: participant.id,
      member_id: participant.member_id,
      target_graduation_id: participant.target_graduation_id,
      member_name: member ? `${member.first_name} ${member.last_name}` : 'Unbekannt',
      target_graduation_name: graduation?.name || null,
      passed: participant.passed,
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Prüfungen
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{e.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={cn('badge', EXAM_STATUS_COLORS[status])}>
                {EXAM_STATUS_LABELS[status]}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                <Calendar className="w-4 h-4" />
                {formatDate(e.date)}
              </span>
              {e.time && (
                <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                  <Clock className="w-4 h-4" />
                  {e.time.slice(0, 5)} Uhr
                </span>
              )}
              {e.location && (
                <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin className="w-4 h-4" />
                  {e.location}
                </span>
              )}
            </div>
          </div>

          {canEdit && (
            <Link href={`/exams/${e.id}/edit`} className="btn-secondary btn-sm flex-shrink-0">
              <Edit className="w-3.5 h-3.5" />
              Bearbeiten
            </Link>
          )}
        </div>

        {e.description && (
          <p className="text-sm text-ink-muted leading-relaxed mt-5 whitespace-pre-wrap">{e.description}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">Zugelassene Gürtel</h2>
          {allowedGraduations.length === 0 ? (
            <p className="text-sm text-ink-muted">Alle oder noch keine Gürtel ausgewählt.</p>
          ) : (
            <div className="space-y-2">
              {allowedGraduations.map(graduation => (
                <div key={graduation.id} className="flex items-center gap-2 text-sm text-ink-muted">
                  <BeltSwatch graduation={graduation} className="h-3 w-3 rounded-full" />
                  {graduation.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <ExamParticipantsManager
          examId={e.id}
          examDate={e.date}
          canEdit={canEdit}
          role={role}
          members={(members || []) as Pick<Member, 'id' | 'first_name' | 'last_name' | 'graduation_id'>[]}
          graduations={visibleGraduations}
          initialParticipants={participantViews}
        />
      </div>
    </div>
  )
}
