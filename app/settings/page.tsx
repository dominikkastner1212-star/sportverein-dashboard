import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, User } from 'lucide-react'
import { getVisibleGraduations } from '@/lib/graduations'
import { getGraduationBackground } from '@/lib/utils'
import type { Graduation } from '@/types'

const ROLE_LABELS = {
  admin: { label: 'Administrator', color: 'bg-red-50 text-red-700 border-red-200' },
  trainer: { label: 'Trainer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  reader: { label: 'Leser', color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const { data: graduations } = await supabase
    .from('graduations')
    .select('*')
    .order('rank_order')

  const visibleGraduations = getVisibleGraduations((graduations || []) as Graduation[])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Einstellungen</h1>
        <p className="text-sm text-ink-muted mt-1">Nutzer und Systemkonfiguration</p>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-3">
          <h2 className="section-title">Nutzerverwaltung</h2>
          <p className="section-subtitle mt-0.5">Rollen und Zugriffsrechte</p>
        </div>
        <div className="divide-y divide-surface-3">
          {(profiles || []).map(p => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-ink-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{p.full_name || '—'}</p>
                <p className="text-xs text-ink-subtle truncate">{p.email}</p>
              </div>
              <span className={`badge text-xs ${ROLE_LABELS[p.role as keyof typeof ROLE_LABELS]?.color}`}>
                {ROLE_LABELS[p.role as keyof typeof ROLE_LABELS]?.label}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-surface-3">
          <p className="text-xs text-ink-subtle">
            Um Rollen zu ändern, nutze den Supabase SQL Editor:{' '}
            <code className="font-mono bg-surface-2 px-1 rounded text-[11px]">
              UPDATE profiles SET role = 'trainer' WHERE email = '…'
            </code>
          </p>
        </div>
      </div>

      {/* Graduations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-3">
          <h2 className="section-title">Gürtelstufen</h2>
          <p className="section-subtitle mt-0.5">{visibleGraduations.length} konfigurierte Stufen</p>
        </div>
        <div className="divide-y divide-surface-3">
          {visibleGraduations.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-6 py-3.5">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: getGraduationBackground(g) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{g.name}</p>
                <p className="text-xs text-ink-subtle">Rang {g.rank_order}</p>
              </div>
              <div className="text-right">
                {g.min_age && (
                  <p className="text-xs text-ink-subtle">Ab {g.min_age} Jahren</p>
                )}
                {g.min_training_months && (
                  <p className="text-xs text-ink-subtle">Min. {g.min_training_months} Monate</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-surface-3">
          <p className="text-xs text-ink-subtle">
            Gürtelstufen können per SQL in Supabase angepasst werden. Siehe README für Details.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="card p-5 flex items-start gap-3">
        <Shield className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink">Sicherheitshinweis</p>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Alle Daten sind durch Supabase Row Level Security geschützt.
            Dokumente werden verschlüsselt in Supabase Storage gespeichert
            und sind nur über zeitlich begrenzte, signierte URLs abrufbar.
          </p>
        </div>
      </div>
    </div>
  )
}
