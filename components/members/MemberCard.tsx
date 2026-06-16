import Link from 'next/link'
import Image from 'next/image'
import { cn, calculateAge, formatDate, STATUS_LABELS, STATUS_COLORS, GENDER_LABELS, MEMBER_GROUP_LABELS } from '@/lib/utils'
import type { Member, Graduation, MemberStatus } from '@/types'
import { User } from 'lucide-react'

interface MemberCardProps {
  member: Member & { graduation?: Graduation }
}

export function MemberCard({ member }: MemberCardProps) {
  const age = calculateAge(member.birth_date)
  const grad = member.graduation

  const avatarUrl = member.avatar_url

  return (
    <Link href={`/members/${member.id}`}>
      <div
        className="card-hover cursor-pointer overflow-hidden"
        style={{
          borderColor: grad?.border_color || '#e8e8e6',
          borderWidth: grad ? '2px' : '1px',
        }}
      >
        {/* Top bar with belt color accent */}
        {grad && (
          <div
            className="h-1 w-full"
            style={{ backgroundColor: grad.border_color }}
          />
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 flex items-center justify-center"
                style={grad ? { boxShadow: `0 0 0 2px ${grad.border_color}30` } : undefined}
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
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: grad.border_color }}
                  />
                  <span className="text-xs font-medium text-ink-muted">{grad.name}</span>
                </div>
              )}
            </div>
          </div>

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
