'use client'

import type { Graduation } from '@/types'
import { getGraduationBackground } from '@/lib/utils'

interface GraduationChartProps {
  distribution: Record<string, number>
  graduations: Graduation[]
}

export function GraduationChart({ distribution, graduations }: GraduationChartProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  const sortedEntries = graduations
    .map(g => ({ name: g.name, color: getGraduationBackground(g), count: distribution[g.name] || 0 }))
    .filter(e => e.count > 0)

  const unranked = distribution['Kein Gürtel'] || 0
  if (unranked > 0) sortedEntries.push({ name: 'Kein Gürtel', color: '#d1d5db', count: unranked })

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h2 className="section-title">Gürteleinteilung</h2>
        <p className="section-subtitle mt-0.5">{total} Mitglieder gesamt</p>
      </div>

      <div className="space-y-3">
        {sortedEntries.map(({ name, color, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={name} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-sm text-ink-muted truncate">{name}</span>
              </div>
              <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="text-sm font-medium text-ink w-6 text-right tabular-nums">{count}</span>
              <span className="text-xs text-ink-subtle w-10 text-right tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
