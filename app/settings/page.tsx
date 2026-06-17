import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { getVisibleGraduations } from '@/lib/graduations'
import { BeltSwatch } from '@/components/ui/BeltSwatch'
import { UserManagement } from '@/components/settings/UserManagement'
import type { Graduation, Profile } from '@/types'

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
      <UserManagement profiles={(profiles || []) as Profile[]} currentUserId={session?.user.id || ''} />

      {/* Graduations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-3">
          <h2 className="section-title">Gürtelstufen</h2>
          <p className="section-subtitle mt-0.5">{visibleGraduations.length} konfigurierte Stufen</p>
        </div>
        <div className="divide-y divide-surface-3">
          {visibleGraduations.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-6 py-3.5">
              <BeltSwatch graduation={g} className="w-6 h-6 rounded-full flex-shrink-0 shadow-sm" />
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
