import Link from 'next/link'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OpenAction } from '@/lib/dashboardActions'

interface OpenActionsProps {
  actions: OpenAction[]
}

export function OpenActions({ actions }: OpenActionsProps) {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="section-title">Offene Aktionen</h2>
        <p className="section-subtitle mt-0.5">Mitglieder mit Handlungsbedarf</p>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-ink-muted">Aktuell sind keine Aktionen offen. 🎉</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map(action => (
            <Link
              key={action.id}
              href={`/members/${action.memberId}`}
              className={cn(
                'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                action.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
              )}
            >
              {action.severity === 'warning' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              )}
              <div className="min-w-0">
                <p className="font-medium leading-snug text-ink">{action.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{action.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
