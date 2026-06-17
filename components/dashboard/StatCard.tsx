import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: string; positive?: boolean }
  accent?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, accent, className }: StatCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-ink mt-1 tabular-nums">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              trend.positive ? 'text-green-600' : 'text-ink-muted'
            )}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          accent || 'bg-surface-2 text-ink-muted'
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
