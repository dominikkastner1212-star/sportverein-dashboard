'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import type { Graduation, MemberGender, MemberStatus } from '@/types'

interface MemberFormProps {
  graduations: Graduation[]
}

type MemberInsert = Database['public']['Tables']['members']['Insert']

const today = new Date().toISOString().split('T')[0]

export function MemberForm({ graduations }: MemberFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'male' as MemberGender,
    birth_date: '',
    entry_date: today,
    status: 'active' as MemberStatus,
    graduation_id: '',
    phone: '',
    email: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  })

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: MemberInsert = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: form.gender,
      birth_date: form.birth_date,
      entry_date: form.entry_date,
      status: form.status,
      graduation_id: form.graduation_id || null,
      avatar_url: null,
      notes: form.notes.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      emergency_phone: form.emergency_phone.trim() || null,
    }

    const { data, error: insertError } = await supabase
      .from('members')
      .insert(payload)
      .select('id')
      .single()

    if (insertError || !data) {
      setError(insertError?.message || 'Mitglied konnte nicht erstellt werden.')
      setSubmitting(false)
      return
    }

    router.push(`/members/${data.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/members" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurueck zu Mitglieder
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-ink">Neues Mitglied</h1>
        <p className="text-sm text-ink-muted mt-1">Stammdaten und Kontaktinformationen erfassen</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Vorname</label>
            <input
              className="input"
              value={form.first_name}
              onChange={event => updateField('first_name', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Nachname</label>
            <input
              className="input"
              value={form.last_name}
              onChange={event => updateField('last_name', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Geschlecht</label>
            <select
              className="input"
              value={form.gender}
              onChange={event => updateField('gender', event.target.value as MemberGender)}
            >
              <option value="male">Maennlich</option>
              <option value="female">Weiblich</option>
              <option value="other">Divers</option>
            </select>
          </div>

          <div>
            <label className="input-label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={event => updateField('status', event.target.value as MemberStatus)}
            >
              <option value="active">Aktiv</option>
              <option value="paused">Pausiert</option>
              <option value="left">Ausgetreten</option>
            </select>
          </div>

          <div>
            <label className="input-label">Geburtsdatum</label>
            <input
              type="date"
              className="input"
              value={form.birth_date}
              onChange={event => updateField('birth_date', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Mitglied seit</label>
            <input
              type="date"
              className="input"
              value={form.entry_date}
              onChange={event => updateField('entry_date', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Guertel</label>
            <select
              className="input"
              value={form.graduation_id}
              onChange={event => updateField('graduation_id', event.target.value)}
            >
              <option value="">Kein Guertel</option>
              {graduations.map(graduation => (
                <option key={graduation.id} value={graduation.id}>
                  {graduation.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">E-Mail</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={event => updateField('email', event.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Telefon</label>
            <input
              className="input"
              value={form.phone}
              onChange={event => updateField('phone', event.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Notfallkontakt</label>
            <input
              className="input"
              value={form.emergency_contact}
              onChange={event => updateField('emergency_contact', event.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Notfalltelefon</label>
            <input
              className="input"
              value={form.emergency_phone}
              onChange={event => updateField('emergency_phone', event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="input-label">Notizen</label>
            <textarea
              className="input min-h-28 resize-y"
              value={form.notes}
              onChange={event => updateField('notes', event.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/members" className="btn-secondary">
            Abbrechen
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichert
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Speichern
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
