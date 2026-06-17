'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, FileText, Search, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: string
  type: 'member' | 'exam' | 'document'
  title: string
  subtitle?: string
  href: string
}

export function GlobalSearch() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      const pattern = `%${term}%`

      const [membersRes, examsRes, documentsRes] = await Promise.all([
        supabase
          .from('members')
          .select('id, first_name, last_name')
          .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
          .limit(5),
        supabase.from('exams').select('id, title, date').ilike('title', pattern).limit(5),
        supabase.from('member_documents').select('id, file_name, member_id').ilike('file_name', pattern).limit(5),
      ])

      const memberResults: SearchResult[] = (membersRes.data || []).map(m => ({
        id: m.id,
        type: 'member',
        title: `${m.first_name} ${m.last_name}`,
        subtitle: 'Mitglied',
        href: `/members/${m.id}`,
      }))

      const examResults: SearchResult[] = (examsRes.data || []).map(e => ({
        id: e.id,
        type: 'exam',
        title: e.title,
        subtitle: 'Prüfung',
        href: `/exams/${e.id}`,
      }))

      const documentResults: SearchResult[] = (documentsRes.data || []).map(d => ({
        id: d.id,
        type: 'document',
        title: d.file_name,
        subtitle: 'Dokument',
        href: '/documents',
      }))

      setResults([...memberResults, ...examResults, ...documentResults])
      setLoading(false)
    }, 250)

    return () => clearTimeout(timeout)
  }, [query, supabase])

  function handleSelect(result: SearchResult) {
    setOpen(false)
    router.push(result.href)
  }

  const icons = { member: Users, exam: Calendar, document: FileText }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/50 transition-colors hover:bg-white/10"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Suchen…</span>
        <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40 lg:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/60 p-4 pt-[10vh] backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-surface-3 px-4 py-3">
              <Search className="h-4 w-4 flex-shrink-0 text-ink-subtle" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Mitglieder, Prüfungen, Dokumente durchsuchen…"
                className="flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-subtle hover:text-ink"
                aria-label="Schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loading && <p className="px-3 py-4 text-center text-sm text-ink-subtle">Suche…</p>}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-ink-subtle">Keine Ergebnisse gefunden.</p>
              )}

              {!loading && query.trim().length < 2 && (
                <p className="px-3 py-4 text-center text-sm text-ink-subtle">Mindestens 2 Zeichen eingeben.</p>
              )}

              {!loading &&
                results.map(result => {
                  const Icon = icons[result.type]
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-1"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-ink-subtle" />
                      <span className="flex-1 truncate text-ink">{result.title}</span>
                      <span className="text-xs text-ink-subtle">{result.subtitle}</span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
