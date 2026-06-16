import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import { EXAM_STATUS_LABELS, EXAM_STATUS_COLORS } from '@/lib/utils'
import type { ExamStatus } from '@/types'
import { cn } from '@/lib/utils'

interface UpcomingExamsProps {
  exams: Array<{
    id: string
    title: string
    date: string
    time: string | null
    location: string | null
    status: string
  }>
}

export function UpcomingExams({ exams }: UpcomingExamsProps) {
  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">Nächste Prüfungen</h2>
        <Link href="/exams" className="text-xs text-accent hover:text-accent-dark transition-colors">
          Alle ansehen
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-ink-muted">Keine Prüfungen geplant</p>
          <Link href="/exams" className="text-xs text-accent hover:text-accent-dark mt-2 inline-block">
            Prüfung anlegen →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <Link
              key={exam.id}
              href={`/exams/${exam.id}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-1 transition-colors group"
            >
              {/* Date Block */}
              <div className="flex-shrink-0 w-10 text-center">
                <p className="text-lg font-semibold text-ink tabular-nums leading-none">
                  {formatDate(exam.date, 'dd')}
                </p>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider">
                  {formatDate(exam.date, 'MMM')}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate group-hover:text-accent transition-colors">
                  {exam.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {exam.time && (
                    <span className="flex items-center gap-1 text-xs text-ink-subtle">
                      <Clock className="w-3 h-3" />
                      {exam.time.slice(0, 5)}
                    </span>
                  )}
                  {exam.location && (
                    <span className="flex items-center gap-1 text-xs text-ink-subtle">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">{exam.location}</span>
                    </span>
                  )}
                </div>
                <span className={cn(
                  'badge mt-1.5 text-[10px]',
                  EXAM_STATUS_COLORS[exam.status as ExamStatus]
                )}>
                  {EXAM_STATUS_LABELS[exam.status as ExamStatus]}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink-subtle mt-0.5 flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
