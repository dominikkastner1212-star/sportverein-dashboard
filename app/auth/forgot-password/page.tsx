'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError('Es gab ein Problem. Bitte versuche es erneut.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-40 h-40 bg-white rounded-2xl shadow-card mb-4 overflow-hidden">
            <Image src="/logo.png" alt="Vereinslogo" fill className="object-contain p-1.5" />
          </div>
          <h1 className="text-xl font-semibold text-ink">Passwort vergessen</h1>
          <p className="text-sm text-ink-muted mt-1">
            Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-ink">
                Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
              </p>
              <p className="text-xs text-ink-subtle">Prüfe auch deinen Spam-Ordner.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">E-Mail</label>
                <input
                  type="email"
                  className="input"
                  placeholder="name@verein.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Wird gesendet…' : 'Link zum Zurücksetzen senden'}
              </button>
            </form>
          )}
        </div>

        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mt-6 justify-center w-full">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Anmeldung
        </Link>
      </div>
    </div>
  )
}
