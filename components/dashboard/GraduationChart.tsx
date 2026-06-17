'use client'

import type { Graduation } from '@/types'
import { BeltSwatch } from '@/components/ui/BeltSwatch'

interface GraduationChartProps {
  distribution: Record<string, number>
  graduations: Graduation[]
}

export function GraduationChart({ distribution, graduations }: GraduationChartProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  const sortedEntries = graduations
    .map(g => ({ name: g.name, graduation: g as Graduation | null, count: distribution[g.name] || 0 }))
    .filter(e => e.count > 0)

  const unranked = distribution['Kein Gürtel'] || 0
  if (unranked > 0) sortedEntries.push({ name: 'Kein Gürtel', graduation: null, count: unranked })

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h2 className="section-title">Gürteleinteilung</h2>
        <p className="section-subtitle mt-0.5">{total} Mitglieder gesamt</p>
      </div>

      <div className="space-y-3">
        {sortedEntries.map(({ name, graduation, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={name} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <BeltSwatch graduation={graduation} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                <span className="text-sm text-ink-muted truncate">{name}</span>
              </div>
              <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 overflow-hidden" style={{ width: `${pct}%` }}>
                  <BeltSwatch graduation={graduation} className="w-full h-full" />
                </div>
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
