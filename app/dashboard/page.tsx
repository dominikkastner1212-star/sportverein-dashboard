import { createServerClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { GraduationChart } from '@/components/dashboard/GraduationChart'
import { UpcomingExams } from '@/components/dashboard/UpcomingExams'
import { GenderChart } from '@/components/dashboard/GenderChart'
import { AgeChart } from '@/components/dashboard/AgeChart'
import { OpenActions } from '@/components/dashboard/OpenActions'
import { Users, Calendar, Award, ListChecks } from 'lucide-react'
import { getVisibleGraduations } from '@/lib/graduations'
import { getOpenActions } from '@/lib/dashboardActions'
import { formatDate } from '@/lib/utils'
import type { Graduation } from '@/types'

type GraduationSummary = { name: string }

function getGraduationName(value: GraduationSummary | GraduationSummary[] | null) {
  if (Array.isArray(value)) {
    return value[0]?.name
  }

  return value?.name
}

const AGE_BUCKETS = [
  { label: '<10', min: 0, max: 9 },
  { label: '10–14', min: 10, max: 14 },
  { label: '15–18', min: 15, max: 18 },
  { label: '19–25', min: 19, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36+', min: 36, max: Infinity },
]

export default async function DashboardPage() {
  const supabase = createServerClient()

  const [
    { count: totalMembers },
    { count: activeMembers },
    { data: members },
    { data: upcomingExams },
    { data: graduations },
    openActions,
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('id, status, gender, graduation_id, birth_date, graduations(name, color, border_color, secondary_color, rank_order)'),
    supabase
      .from('exams')
      .select('*, profiles(full_name)')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5),
    supabase.from('graduations').select('*').order('rank_order'),
    getOpenActions(supabase),
  ])

  // Age structure
  const ages = (members || []).map(m => {
    const birth = new Date(m.birth_date as string)
    return new Date().getFullYear() - birth.getFullYear()
  })
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0
  const ageBuckets = AGE_BUCKETS.map(bucket => ({
    label: bucket.label,
    count: ages.filter(age => age >= bucket.min && age <= bucket.max).length,
  }))

  // Graduation distribution
  const gradDist: Record<string, number> = {}
  ;(members || []).forEach(m => {
    const key = getGraduationName(m.graduations) || 'Kein Guertel'
    gradDist[key] = (gradDist[key] || 0) + 1
  })

  // Gender distribution
  const genderCounts = { male: 0, female: 0, other: 0 }
  ;(members || []).forEach(m => {
    const gender = (m.gender as 'male' | 'female' | 'other' | null) || 'other'
    genderCounts[gender] = (genderCounts[gender] || 0) + 1
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
          accent="bg-brand-blue/10 text-brand-blue"
        />
        <StatCard
          label="Kommende Prüfungen"
          value={upcomingExams?.length || 0}
          icon={Calendar}
          accent="bg-brand-gold/15 text-brand-gold-dark"
        />
        <StatCard
          label="Alter (Ø)"
          value={`${avgAge} J.`}
          icon={Award}
          accent="bg-brand-navy/10 text-brand-navy"
        />
        <StatCard
          label="Offene Aktionen"
          value={openActions.length}
          icon={ListChecks}
          trend={openActions.length > 0 ? { value: 'Achtung erforderlich', positive: false } : undefined}
          accent="bg-accent-light text-accent-dark"
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graduation Distribution */}
        <div className="lg:col-span-2">
          <GraduationChart distribution={gradDist} graduations={getVisibleGraduations((graduations || []) as Graduation[])} />
        </div>

        {/* Upcoming Exams */}
        <div>
          <UpcomingExams exams={upcomingExams || []} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <GenderChart male={genderCounts.male} female={genderCounts.female} other={genderCounts.other} />
        <AgeChart buckets={ageBuckets} />
      </div>

      <OpenActions actions={openActions} />
    </div>
  )
}
