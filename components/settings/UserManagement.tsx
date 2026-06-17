'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, User, UserPlus, X } from 'lucide-react'
import type { Profile, UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-red-50 text-red-700 border-red-200' },
  trainer: { label: 'Trainer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  reader: { label: 'Leser', color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

interface UserManagementProps {
  profiles: Profile[]
  currentUserId: string
}

export function UserManagement({ profiles, currentUserId }: UserManagementProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'reader' as UserRole,
  })

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Nutzer konnte nicht angelegt werden.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setShowForm(false)
    setForm({ email: '', password: '', fullName: '', role: 'reader' })
    router.refresh()
  }

  async function handleRoleChange(profileId: string, role: UserRole) {
    setPendingRoleId(profileId)
    setError(null)

    const res = await fetch(`/api/admin/users/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    const data = await res.json()
    setPendingRoleId(null)

    if (!res.ok) {
      setError(data.error || 'Rolle konnte nicht geändert werden.')
      return
    }

    router.refresh()
  }

  async function handleDelete(profileId: string) {
    if (!confirm('Diesen Nutzer wirklich löschen?')) return
    setError(null)

    const res = await fetch(`/api/admin/users/${profileId}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Nutzer konnte nicht gelöscht werden.')
      return
    }

    router.refresh()
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Nutzerverwaltung</h2>
          <p className="section-subtitle mt-0.5">Rollen und Zugriffsrechte</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(prev => !prev)}
          className="btn-secondary btn-sm flex-shrink-0"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {showForm ? 'Abbrechen' : 'Neuer Nutzer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="px-6 py-5 border-b border-surface-3 bg-surface-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Name</label>
              <input
                className="input"
                value={form.fullName}
                onChange={event => setForm(prev => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">Rolle</label>
              <select
                className="input"
                value={form.role}
                onChange={event => setForm(prev => ({ ...prev, role: event.target.value as UserRole }))}
              >
                <option value="reader">Leser</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="input-label">E-Mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="input-label">Passwort</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                minLength={8}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Nutzer anlegen
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-surface-3">
        {profiles.map(p => (
          <div key={p.id} className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-ink-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{p.full_name || '—'}</p>
              <p className="text-xs text-ink-subtle truncate">{p.email}</p>
            </div>

            {p.id === currentUserId ? (
              <span className={`badge text-xs ${ROLE_LABELS[p.role].color}`}>
                {ROLE_LABELS[p.role].label}
              </span>
            ) : (
              <select
                className="input w-auto py-1.5 text-sm"
                value={p.role}
                disabled={pendingRoleId === p.id}
                onChange={event => handleRoleChange(p.id, event.target.value as UserRole)}
              >
                <option value="reader">Leser</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Administrator</option>
              </select>
            )}

            {p.id !== currentUserId && (
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500 flex-shrink-0"
                title="Nutzer löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!showForm && (
        <div className="px-6 py-3 border-t border-surface-3">
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          <p className="text-xs text-ink-subtle">
            Neue Nutzer erhalten ihr Passwort von dir persönlich — es gibt aktuell keine automatische E-Mail-Einladung.
          </p>
        </div>
      )}
    </div>
  )
}
