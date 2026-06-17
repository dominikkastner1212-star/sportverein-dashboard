import Link from 'next/link'
import Image from 'next/image'
import { cn, calculateAge, formatDate, STATUS_LABELS, STATUS_COLORS, GENDER_LABELS, MEMBER_GROUP_LABELS } from '@/lib/utils'
import { BeltSwatch } from '@/components/ui/BeltSwatch'
import type { Member, Graduation, MemberStatus } from '@/types'
import { User } from 'lucide-react'

interface MemberCardProps {
  member: Member & { graduation?: Graduation; checklistProgress?: { done: number; total: number } | null }
}

export function MemberCard({ member }: MemberCardProps) {
  const age = calculateAge(member.birth_date)
  const grad = member.graduation

  const avatarUrl = member.avatar_url
  const progress = member.checklistProgress
  const progressPct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null

  return (
    <Link href={`/members/${member.id}`}>
      <div className="card-hover cursor-pointer overflow-hidden">
        {/* Top bar with belt color accent */}
        <BeltSwatch graduation={grad} className="h-1.5 w-full" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 flex items-center justify-center"
                style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.06)' }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${member.first_name} ${member.last_name}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="w-6 h-6 text-ink-faint" />
                )}
              </div>
              {/* Status dot */}
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-0',
                member.status === 'active' ? 'bg-green-500' :
                member.status === 'paused' ? 'bg-amber-400' : 'bg-gray-300'
              )} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {member.first_name} {member.last_name}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {GENDER_LABELS[member.gender]} · {age} Jahre
              </p>
              <p className="text-xs text-ink-subtle mt-0.5">
                {MEMBER_GROUP_LABELS[member.group_type || 'youth_adults']}
              </p>
              {grad && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <BeltSwatch graduation={grad} className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/10" />
                  <span className="text-xs font-medium text-ink-muted">{grad.name}</span>
                </div>
              )}
            </div>
          </div>

          {progressPct !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-ink-subtle">Checkliste</span>
                <span className="text-[10px] font-medium text-ink-subtle tabular-nums">
                  {progress!.done}/{progress!.total}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progressPct === 100 ? 'bg-green-500' : 'bg-brand-gold'
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-2">
            <span className={cn('badge text-[10px]', STATUS_COLORS[member.status as MemberStatus])}>
              {STATUS_LABELS[member.status as MemberStatus]}
            </span>
            <span className="text-[11px] text-ink-faint">
              {member.last_exam_date ? `Pruefung ${formatDate(member.last_exam_date)}` : `seit ${formatDate(member.entry_date, 'yyyy')}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
