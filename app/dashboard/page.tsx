import { createServerClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/dashboard/StatCard'
import { GraduationChart } from '@/components/dashboard/GraduationChart'
import { UpcomingExams } from '@/components/dashboard/UpcomingExams'
import { Users, Calendar, Award, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const [
    { count: totalMembers },
    { count: activeMembers },
    { data: members },
    { data: upcomingExams },
    { data: graduations },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('id, status, graduation_id, birth_date, graduations(name, color, border_color, rank_order)'),
    supabase
      .from('exams')
      .select('*, profiles(full_name)')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5),
    supabase.from('graduations').select('*').order('rank_order'),
  ])

  // Age structure
  const ages = (members || []).map(m => {
    const birth = new Date(m.birth_date as string)
    return new Date().getFullYear() - birth.getFullYear()
  })
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

  // Graduation distribution
  const gradDist: Record<string, number> = {}
  ;(members || []).forEach(m => {
    const key = (m.graduations as { name: string } | null)?.name || 'Kein Gürtel'
    gradDist[key] = (gradDist[key] || 0) + 1
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Übersicht</h1>
        <p className="text-sm text-ink-muted mt-1">
          {formatDate(new Date().toISOString(), 'EEEE, dd. MMMM yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Aktive Mitglieder"
          value={activeMembers || 0}
          icon={Users}
          trend={{ value: `von ${totalMembers || 0} gesamt`, positive: false }}
        />
        <StatCard
          label="Mitglieder gesamt"
          value={totalMembers || 0}
          icon={TrendingUp}
        />
        <StatCard
          label="Kommende Prüfungen"
          value={upcomingExams?.length || 0}
          icon={Calendar}
        />
        <StatCard
          label="Ø Alter"
          value={`${avgAge} J.`}
          icon={Award}
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graduation Distribution */}
        <div className="lg:col-span-2">
          <GraduationChart distribution={gradDist} graduations={graduations || []} />
        </div>

        {/* Upcoming Exams */}
        <div>
          <UpcomingExams exams={upcomingExams || []} />
        </div>
      </div>
    </div>
  )
}
