'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-Mail oder Passwort ist falsch.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-card mb-4 overflow-hidden">
            <Image src="/logo.png" alt="Vereinslogo" fill className="object-contain p-1.5" />
          </div>
          <h1 className="text-xl font-semibold text-ink">Vereinsverwaltung</h1>
          <p className="text-sm text-ink-muted mt-1">Melde dich an, um fortzufahren</p>
        </div>

        {/* Card */}
        <div className="card p-6">
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
            <div>
              <label className="input-label">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-muted transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-subtle mt-6">
          Noch kein Zugang? Wende dich an den Administrator.
        </p>
      </div>
    </div>
  )
}
