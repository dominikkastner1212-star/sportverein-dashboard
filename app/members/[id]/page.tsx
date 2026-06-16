import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, User, Phone, Mail, Calendar, Clock,
  Award, FileText, Edit,
} from 'lucide-react'
import { calculateAge, formatDate, STATUS_LABELS, STATUS_COLORS, GENDER_LABELS, cn } from '@/lib/utils'
import { DocumentSection } from '@/components/documents/DocumentSection'
import { ChecklistSection } from '@/components/checklists/ChecklistSection'
import type { Member, Graduation, ExamHistory, UserRole } from '@/types'

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  const role = (profile?.role || 'reader') as UserRole
  const canEdit = role === 'admin' || role === 'trainer'

  const [{ data: member }, { data: history }] = await Promise.all([
    supabase
      .from('members')
      .select('*, graduations(*)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('exam_history')
      .select('*, graduations(name, border_color)')
      .eq('member_id', params.id)
      .order('date', { ascending: false }),
  ])

  if (!member) notFound()

  const m = member as Member & { graduations: Graduation | null }
  const grad = m.graduations
  const age = calculateAge(m.birth_date)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/members" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Mitglieder
      </Link>

      {/* Hero card */}
      <div
        className="card overflow-hidden"
        style={grad ? { borderColor: grad.border_color, borderWidth: '2px' } : undefined}
      >
        {grad && <div className="h-1.5 w-full" style={{ backgroundColor: grad.border_color }} />}

        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-2 flex items-center justify-center"
                style={grad ? { boxShadow: `0 0 0 3px ${grad.border_color}40` } : undefined}
              >
                {m.avatar_url ? (
                  <Image
                    src={m.avatar_url}
                    alt={`${m.first_name} ${m.last_name}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="w-10 h-10 text-ink-faint" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-ink">
                    {m.first_name} {m.last_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={cn('badge', STATUS_COLORS[m.status])}>
                      {STATUS_LABELS[m.status]}
                    </span>
                    {grad && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grad.border_color }} />
                        <span className="text-sm font-medium text-ink-muted">{grad.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <Link href={`/members/${m.id}/edit`} className="btn-secondary btn-sm flex-shrink-0">
                    <Edit className="w-3.5 h-3.5" />
                    Bearbeiten
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="space-y-5">
          {/* Stammdaten */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Stammdaten</h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="Geschlecht" value={GENDER_LABELS[m.gender]} />
              <InfoRow icon={Calendar} label="Geburtsdatum" value={`${formatDate(m.birth_date)} (${age} Jahre)`} />
              <InfoRow icon={Clock} label="Mitglied seit" value={formatDate(m.entry_date)} />
              {grad && <InfoRow icon={Award} label="Aktueller Gürtel" value={grad.name} />}
              {m.phone && <InfoRow icon={Phone} label="Telefon" value={m.phone} />}
              {m.email && <InfoRow icon={Mail} label="E-Mail" value={m.email} />}
              {m.emergency_contact && (
                <InfoRow icon={Phone} label="Notfallkontakt" value={`${m.emergency_contact}${m.emergency_phone ? ` · ${m.emergency_phone}` : ''}`} />
              )}
            </div>
          </div>

          {/* Notes */}
          {m.notes && (
            <div className="card p-5">
              <h2 className="section-title mb-3">Notizen</h2>
              <p className="text-sm text-ink-muted whitespace-pre-wrap leading-relaxed">{m.notes}</p>
            </div>
          )}

          {/* Exam History */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Prüfungshistorie</h2>
            {!history || history.length === 0 ? (
              <p className="text-sm text-ink-muted">Noch keine Prüfungen</p>
            ) : (
              <div className="space-y-2">
                {(history as (ExamHistory & { graduations: Graduation })[]).map(h => (
                  <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: h.graduations?.border_color || '#ccc' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink">{h.graduations?.name}</p>
                      <p className="text-[11px] text-ink-subtle">{formatDate(h.date)}</p>
                    </div>
                    <span className={cn(
                      'badge text-[10px]',
                      h.passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    )}>
                      {h.passed ? 'Bestanden' : 'Nicht bestanden'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: checklist + documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Prüfungs-Checkliste</h2>
            <ChecklistSection memberId={m.id} role={role} />
          </div>

          {/* Documents */}
          <DocumentSection memberId={m.id} role={role} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-ink-subtle uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-ink mt-0.5">{value}</p>
      </div>
    </div>
  )
}
