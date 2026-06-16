'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Graduation, FilterState } from '@/types'

interface MemberFilterBarProps {
  graduations: Graduation[]
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function MemberFilterBar({ graduations, filters, onChange }: MemberFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters =
    filters.graduation_id || filters.group_type || filters.gender || filters.status || filters.search ||
    filters.age_min !== null || filters.age_max !== null

  const resetFilters: FilterState = {
    search: '',
    graduation_id: null,
    group_type: null,
    gender: null,
    status: null,
    age_min: null,
    age_max: null,
    sort_by: 'name',
    sort_direction: 'asc',
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Namen suchen…"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'btn-secondary btn-sm flex-shrink-0',
            showAdvanced && 'bg-surface-2 border-ink-faint'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => onChange(resetFilters)}
            className="btn-ghost btn-sm flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Zurücksetzen
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 animate-slide-up">
          {/* Graduation */}
          <div>
            <label className="input-label">Gürtel</label>
            <select
              className="input"
              value={filters.graduation_id || ''}
              onChange={e => onChange({ ...filters, graduation_id: e.target.value || null })}
            >
              <option value="">Alle</option>
              {graduations.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="input-label">Gruppe</label>
            <select
              className="input"
              value={filters.group_type || ''}
              onChange={e => onChange({ ...filters, group_type: (e.target.value || null) as FilterState['group_type'] })}
            >
              <option value="">Alle</option>
              <option value="children">Kinder</option>
              <option value="youth_adults">Jugend/Erwachsene</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="input-label">Status</label>
            <select
              className="input"
              value={filters.status || ''}
              onChange={e => onChange({ ...filters, status: (e.target.value || null) as FilterState['status'] })}
            >
              <option value="">Alle</option>
              <option value="active">Aktiv</option>
              <option value="paused">Pausiert</option>
              <option value="left">Ausgetreten</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="input-label">Geschlecht</label>
            <select
              className="input"
              value={filters.gender || ''}
              onChange={e => onChange({ ...filters, gender: (e.target.value || null) as FilterState['gender'] })}
            >
              <option value="">Alle</option>
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="other">Divers</option>
            </select>
          </div>

          {/* Age range */}
          <div>
            <label className="input-label">Altersbereich</label>
            <div className="flex gap-1">
              <input
                type="number"
                className="input text-center"
                placeholder="Min"
                min={0}
                max={100}
                value={filters.age_min ?? ''}
                onChange={e => onChange({ ...filters, age_min: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                type="number"
                className="input text-center"
                placeholder="Max"
                min={0}
                max={100}
                value={filters.age_max ?? ''}
                onChange={e => onChange({ ...filters, age_max: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="input-label">Sortieren nach</label>
            <select
              className="input"
              value={filters.sort_by}
              onChange={e => onChange({ ...filters, sort_by: e.target.value as FilterState['sort_by'] })}
            >
              <option value="name">Name</option>
              <option value="graduation">Gurtel/Rang</option>
              <option value="group">Gruppe</option>
              <option value="status">Status</option>
              <option value="age">Alter</option>
              <option value="last_exam_date">Letzte Pruefung</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="input-label">Richtung</label>
            <select
              className="input"
              value={filters.sort_direction}
              onChange={e => onChange({ ...filters, sort_direction: e.target.value as FilterState['sort_direction'] })}
            >
              <option value="asc">Aufsteigend</option>
              <option value="desc">Absteigend</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
