'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/members', label: 'Mitglieder', icon: Users },
  { href: '/exams', label: 'Prüfungen', icon: Calendar },
  { href: '/documents', label: 'Dokumente', icon: FileText },
  { href: '/checklists', label: 'Checklisten verwalten', icon: ClipboardList },
]

const ROLE_LABELS = { admin: 'Administrator', trainer: 'Trainer', reader: 'Leser' }

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-surface-3 bg-surface-0 px-4 py-3 shadow-card lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <Image src="/logo.png" alt="Vereinslogo" fill className="object-contain p-0.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              <span className="text-brand-gold">Taekwon-Do</span>{' '}
              <span className="text-brand-blue">Team Kaufungen</span>
            </p>
            <p className="truncate text-xs text-ink-subtle">Mitglieder Dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(open => !open)}
          className="rounded-lg border border-surface-3 bg-surface-1 p-2 text-ink"
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Navigation schließen"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[320px] flex-col border-r border-white/10 bg-brand-navy text-white transition-transform duration-200 lg:w-60 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
              <Image src="/logo.png" alt="Vereinslogo" fill className="object-contain p-0.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                <span className="text-brand-gold">Taekwon-Do</span>{' '}
                <span className="text-white">Team Kaufungen</span>
              </p>
              <p className="truncate text-xs text-white/50">Mitglieder Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(isActive ? 'nav-item-active' : 'nav-item')}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-ink-subtle" />}
              </Link>
            )
          })}

          {profile?.role === 'admin' && (
            <>
              <div className="px-3 pb-1 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Administration
                </p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(pathname.startsWith('/settings') ? 'nav-item-active' : 'nav-item')}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">Einstellungen</span>
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
              <span className="text-xs font-medium text-white/80">
                {profile?.full_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {profile?.full_name || profile?.email}
              </p>
              <p className="truncate text-[11px] text-white/45">
                {profile ? ROLE_LABELS[profile.role] : ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/45 transition-colors hover:text-white"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
