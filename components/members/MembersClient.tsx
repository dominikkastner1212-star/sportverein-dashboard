'use client'

import { useState, useMemo } from 'react'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberFilterBar } from '@/components/members/MemberFilterBar'
import { Plus, Users } from 'lucide-react'
import { calculateAge } from '@/lib/utils'
import type { Member, Graduation, FilterState } from '@/types'
import Link from 'next/link'

interface MembersClientProps {
  members: (Member & { graduation?: Graduation; checklistProgress?: { done: number; total: number } | null })[]
  graduations: Graduation[]
  canEdit: boolean
}

export function MembersClient({ members, graduations, canEdit }: MembersClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    graduation_id: null,
    group_type: null,
    gender: null,
    status: null,
    age_min: null,
    age_max: null,
    sort_by: 'name',
    sort_direction: 'asc',
  })

  const filtered = useMemo(() => {
    const result = members.filter(m => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
      if (filters.search && !fullName.includes(filters.search.toLowerCase())) return false
      if (filters.graduation_id && m.graduation_id !== filters.graduation_id) return false
      if (filters.group_type && (m.group_type || 'youth_adults') !== filters.group_type) return false
      if (filters.gender && m.gender !== filters.gender) return false
      if (filters.status && m.status !== filters.status) return false
      const age = calculateAge(m.birth_date)
      if (filters.age_min !== null && age < filters.age_min) return false
      if (filters.age_max !== null && age > filters.age_max) return false
      return true
    })

    const direction = filters.sort_direction === 'asc' ? 1 : -1
    return [...result].sort((a, b) => {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()

      let value = 0
      if (filters.sort_by === 'name') value = nameA.localeCompare(nameB)
      if (filters.sort_by === 'graduation') {
        value = (a.graduation?.rank_order ?? 9999) - (b.graduation?.rank_order ?? 9999)
      }
      if (filters.sort_by === 'group') value = (a.group_type || 'youth_adults').localeCompare(b.group_type || 'youth_adults')
      if (filters.sort_by === 'status') value = a.status.localeCompare(b.status)
      if (filters.sort_by === 'age') value = calculateAge(a.birth_date) - calculateAge(b.birth_date)
      if (filters.sort_by === 'last_exam_date') {
        value = new Date(a.last_exam_date || '1900-01-01').getTime() - new Date(b.last_exam_date || '1900-01-01').getTime()
      }

      return value === 0 ? nameA.localeCompare(nameB) : value * direction
    })
  }, [members, filters])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Mitglieder</h1>
          <p className="text-sm text-ink-muted mt-1">{members.length} Mitglieder insgesamt</p>
        </div>
        {canEdit && (
          <Link href="/members/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Neues Mitglied
          </Link>
        )}
      </div>

      {/* Filter */}
      <MemberFilterBar
        graduations={graduations}
        filters={filters}
        onChange={setFilters}
      />

      {/* Results count */}
      {filters.search || filters.graduation_id || filters.group_type || filters.gender || filters.status || filters.age_min !== null || filters.age_max !== null ? (
        <p className="text-sm text-ink-muted">
          {filtered.length} von {members.length} Mitgliedern gefunden
        </p>
      ) : null}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Keine Mitglieder gefunden</p>
          <p className="text-xs text-ink-subtle mt-1">
            {members.length === 0
              ? 'Lege dein erstes Mitglied an.'
              : 'Passe die Filter an, um mehr Ergebnisse zu sehen.'}
          </p>
          {canEdit && members.length === 0 && (
            <Link href="/members/new" className="btn-primary btn-sm mt-4 inline-flex">
              Erstes Mitglied anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
