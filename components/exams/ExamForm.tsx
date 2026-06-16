'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import type { Exam, ExamStatus, Graduation } from '@/types'

interface ExamFormProps {
  graduations: Graduation[]
  examinerId: string | null
  exam?: Exam
}

type ExamInsert = Database['public']['Tables']['exams']['Insert']

const today = new Date().toISOString().split('T')[0]

export function ExamForm({ graduations, examinerId, exam }: ExamFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = Boolean(exam)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: exam?.title || '',
    date: exam?.date || today,
    time: exam?.time?.slice(0, 5) || '',
    location: exam?.location || '',
    description: exam?.description || '',
    status: exam?.status || ('planned' as ExamStatus),
    allowed_graduation_ids: exam?.allowed_graduation_ids || ([] as string[]),
  })

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleGraduation(id: string) {
    setForm(prev => ({
      ...prev,
      allowed_graduation_ids: prev.allowed_graduation_ids.includes(id)
        ? prev.allowed_graduation_ids.filter(item => item !== id)
        : [...prev.allowed_graduation_ids, id],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: ExamInsert = {
      title: form.title.trim(),
      date: form.date,
      time: form.time || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      examiner_id: examinerId,
      status: form.status,
      allowed_graduation_ids: form.allowed_graduation_ids,
    }

    const query = isEditing && exam
      ? supabase.from('exams').update(payload).eq('id', exam.id).select('id').single()
      : supabase.from('exams').insert(payload).select('id').single()

    const { data, error: saveError } = await query

    if (saveError || !data) {
      setError(saveError?.message || 'Prüfung konnte nicht gespeichert werden.')
      setSubmitting(false)
      return
    }

    router.push(isEditing ? `/exams/${data.id}` : '/exams')
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Prüfungen
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {isEditing ? 'Prüfung bearbeiten' : 'Neue Prüfung'}
        </h1>
        <p className="text-sm text-ink-muted mt-1">Termin, Ort und zugelassene Gürtel erfassen</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="input-label">Titel</label>
            <input
              className="input"
              value={form.title}
              onChange={event => updateField('title', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Datum</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={event => updateField('date', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Uhrzeit</label>
            <input
              type="time"
              className="input"
              value={form.time}
              onChange={event => updateField('time', event.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Ort</label>
            <input
              className="input"
              value={form.location}
              onChange={event => updateField('location', event.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={event => updateField('status', event.target.value as ExamStatus)}
            >
              <option value="planned">Geplant</option>
              <option value="open">Offen</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="input-label">Beschreibung</label>
            <textarea
              className="input min-h-28 resize-y"
              value={form.description}
              onChange={event => updateField('description', event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="input-label">Zugelassene Gürtel</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {graduations.map(graduation => (
                <label key={graduation.id} className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.allowed_graduation_ids.includes(graduation.id)}
                    onChange={() => toggleGraduation(graduation.id)}
                  />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: graduation.border_color }} />
                  <span>{graduation.name}</span>
                </label>
              ))}
              {graduations.length === 0 && (
                <p className="text-sm text-ink-muted">Noch keine Gürtel in Supabase angelegt.</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/exams" className="btn-secondary">
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
