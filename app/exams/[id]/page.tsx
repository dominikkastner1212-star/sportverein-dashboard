import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Users } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { formatDate, EXAM_STATUS_LABELS, EXAM_STATUS_COLORS, cn } from '@/lib/utils'
import type { Exam, ExamStatus, Graduation, UserRole } from '@/types'

type ParticipantMember = { first_name: string; last_name: string }
type ParticipantGraduation = { name: string }

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const [{ data: profile }, { data: exam }, { data: graduations }, { data: participants }] = await Promise.all([
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
      .select('id, members(first_name, last_name), graduations(name)')
      .eq('exam_id', id),
  ])

  if (!exam) {
    notFound()
  }

  const role = (profile?.role || 'reader') as UserRole
  const canEdit = role === 'admin' || role === 'trainer'
  const e = exam as Exam & { profiles: { full_name: string } | null }
  const allowedIds = new Set(e.allowed_graduation_ids || [])
  const allowedGraduations = (graduations || []).filter(g => allowedIds.has(g.id)) as Graduation[]
  const status = e.status as ExamStatus

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurueck zu Pruefungen
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
          <h2 className="section-title mb-4">Zugelassene Guertel</h2>
          {allowedGraduations.length === 0 ? (
            <p className="text-sm text-ink-muted">Alle oder noch keine Guertel ausgewaehlt.</p>
          ) : (
            <div className="space-y-2">
              {allowedGraduations.map(graduation => (
                <div key={graduation.id} className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: graduation.border_color }} />
                  {graduation.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Teilnehmer</h2>
          {!participants || participants.length === 0 ? (
            <p className="text-sm text-ink-muted">Noch keine Teilnehmer hinterlegt.</p>
          ) : (
            <div className="space-y-2">
              {participants.map(participant => {
                const member = firstRelation(participant.members as ParticipantMember | ParticipantMember[] | null)
                const graduation = firstRelation(participant.graduations as ParticipantGraduation | ParticipantGraduation[] | null)
                return (
                  <div key={participant.id} className="flex items-center gap-2 text-sm text-ink-muted">
                    <Users className="w-4 h-4 text-ink-faint" />
                    <span>{member ? `${member.first_name} ${member.last_name}` : 'Unbekannt'}</span>
                    {graduation && <span className="text-ink-subtle">({graduation.name})</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
