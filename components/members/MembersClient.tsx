'use client'

import { useState, useMemo } from 'react'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberFilterBar } from '@/components/members/MemberFilterBar'
import { Plus, Users } from 'lucide-react'
import { calculateAge } from '@/lib/utils'
import type { Member, Graduation, FilterState } from '@/types'
import Link from 'next/link'

interface MembersClientProps {
  members: (Member & { graduation?: Graduation })[]
  graduations: Graduation[]
  canEdit: boolean
}

export function MembersClient({ members, graduations, canEdit }: MembersClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    graduation_id: null,
    gender: null,
    status: null,
    age_min: null,
    age_max: null,
  })

  const filtered = useMemo(() => {
    return members.filter(m => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
      if (filters.search && !fullName.includes(filters.search.toLowerCase())) return false
      if (filters.graduation_id && m.graduation_id !== filters.graduation_id) return false
      if (filters.gender && m.gender !== filters.gender) return false
      if (filters.status && m.status !== filters.status) return false
      const age = calculateAge(m.birth_date)
      if (filters.age_min !== null && age < filters.age_min) return false
      if (filters.age_max !== null && age > filters.age_max) return false
      return true
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
      {filters.search || filters.graduation_id || filters.gender || filters.status ? (
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
