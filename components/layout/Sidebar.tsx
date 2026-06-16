'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/members', label: 'Mitglieder', icon: Users },
  { href: '/exams', label: 'Prüfungen', icon: Calendar },
  { href: '/checklists', label: 'Checklisten', icon: ClipboardList },
]

const ROLE_LABELS = { admin: 'Administrator', trainer: 'Trainer', reader: 'Leser' }

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-ink text-white border-r border-ink-3 flex flex-col z-40">
      {/* Header */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Taekwon-Do Kaufungen</p>
            <p className="text-xs text-white/50 truncate">Mitglieder Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(isActive ? 'nav-item-active' : 'nav-item')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
                Administration
              </p>
            </div>
            <Link
              href="/settings"
              className={cn(pathname.startsWith('/settings') ? 'nav-item-active' : 'nav-item')}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Einstellungen</span>
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-white/80">
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">
              {profile?.full_name || profile?.email}
            </p>
            <p className="text-[11px] text-white/45 truncate">
              {profile ? ROLE_LABELS[profile.role] : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/45 hover:text-white transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
