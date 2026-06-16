import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Clock, Users } from 'lucide-react'
import { formatDate, EXAM_STATUS_LABELS, EXAM_STATUS_COLORS, cn } from '@/lib/utils'
import type { ExamStatus } from '@/types'

export default async function ExamsPage() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'

  const { data: exams } = await supabase
    .from('exams')
    .select('*, profiles!examiner_id(full_name), exam_participants(id)')
    .order('date', { ascending: false })

  const upcoming = (exams || []).filter(e => e.date >= new Date().toISOString().split('T')[0])
  const past = (exams || []).filter(e => e.date < new Date().toISOString().split('T')[0])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Prüfungen</h1>
          <p className="text-sm text-ink-muted mt-1">{exams?.length || 0} Prüfungen insgesamt</p>
        </div>
        {canEdit && (
          <Link href="/exams/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Neue Prüfung
          </Link>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">
            Kommende Prüfungen
          </h2>
          <div className="space-y-3">
            {upcoming.map(exam => (
              <ExamRow key={exam.id} exam={exam} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-4">
            Vergangene Prüfungen
          </h2>
          <div className="space-y-3 opacity-70">
            {past.map(exam => (
              <ExamRow key={exam.id} exam={exam} />
            ))}
          </div>
        </section>
      )}

      {(!exams || exams.length === 0) && (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Noch keine Prüfungen</p>
          {canEdit && (
            <Link href="/exams/new" className="btn-primary btn-sm mt-4 inline-flex">
              Erste Prüfung anlegen
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ExamRow({ exam }: { exam: Record<string, unknown> }) {
  const id = exam.id as string
  const title = exam.title as string
  const date = exam.date as string
  const status = exam.status as ExamStatus
  const time = typeof exam.time === 'string' ? exam.time : null
  const location = typeof exam.location === 'string' ? exam.location : null
  const examiner = exam.profiles as { full_name: string } | null
  const participants = (exam.exam_participants as { id: string }[] | null) || []

  return (
    <Link href={`/exams/${id}`}>
      <div className="card p-4 hover:shadow-card-hover transition-all duration-200 group cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Date block */}
          <div className="flex-shrink-0 w-12 text-center p-2 bg-surface-1 rounded-xl">
            <p className="text-lg font-bold text-ink tabular-nums leading-none">
              {formatDate(date, 'dd')}
            </p>
            <p className="text-[10px] text-ink-subtle uppercase tracking-wide mt-0.5">
              {formatDate(date, 'MMM')}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                {title}
              </p>
              <span className={cn('badge text-[10px] flex-shrink-0', EXAM_STATUS_COLORS[status])}>
                {EXAM_STATUS_LABELS[status]}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {time && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Clock className="w-3 h-3" />
                  {time.slice(0, 5)} Uhr
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              )}
              {examiner && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Users className="w-3 h-3" />
                  {examiner.full_name}
                </span>
              )}
              <span className="text-xs text-ink-subtle">
                {participants.length} Teilnehmer
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
