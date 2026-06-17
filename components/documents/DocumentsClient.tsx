'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient, getDocumentSignedUrl, deleteDocument } from '@/lib/supabase/client'
import {
  FileText, Image as ImageIcon, Download, Trash2, Eye, AlertTriangle,
  FileBadge, Shield, Stethoscope, ClipboardList, CreditCard, ShieldCheck,
  File, Loader2, Search,
} from 'lucide-react'
import { cn, formatDate, formatFileSize, isExpiringSoon, isExpired, isPdfFile, isImageFile } from '@/lib/utils'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import type { MemberDocument, DocumentType, UserRole } from '@/types'

const TYPE_ICONS: Record<DocumentType, React.ElementType> = {
  sportlerpass: FileBadge,
  einverstaendnis: Shield,
  attest: Stethoscope,
  pruefungsanmeldung: ClipboardList,
  beitragsnachweis: CreditCard,
  versicherung: ShieldCheck,
  sonstiges: File,
}

type StatusFilter = 'all' | 'expired' | 'expiring' | 'valid'

interface DocumentsClientProps {
  documents: MemberDocument[]
  role: UserRole
}

export function DocumentsClient({ documents: initialDocuments, role }: DocumentsClientProps) {
  const supabase = createClient()
  const [documents, setDocuments] = useState(initialDocuments)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<MemberDocument | null>(null)

  const canDelete = role === 'admin'

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const memberName = doc.member ? `${doc.member.first_name} ${doc.member.last_name}` : ''
      if (search && !memberName.toLowerCase().includes(search.toLowerCase()) && !doc.file_name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false

      const expired = !!doc.expires_at && isExpired(doc.expires_at)
      const expiringSoon = !!doc.expires_at && !expired && isExpiringSoon(doc.expires_at)
      if (statusFilter === 'expired' && !expired) return false
      if (statusFilter === 'expiring' && !expiringSoon) return false
      if (statusFilter === 'valid' && (expired || expiringSoon)) return false

      return true
    })
  }, [documents, search, typeFilter, statusFilter])

  const expiredCount = documents.filter(d => d.expires_at && isExpired(d.expires_at)).length
  const expiringCount = documents.filter(d => d.expires_at && !isExpired(d.expires_at) && isExpiringSoon(d.expires_at)).length

  async function handleDelete(doc: MemberDocument) {
    if (!confirm(`„${doc.file_name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return

    setDeletingId(doc.id)
    try {
      await deleteDocument(supabase, doc.file_path)
      await supabase.from('member_documents').delete().eq('id', doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch {
      alert('Löschen fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDownload(doc: MemberDocument) {
    try {
      const url = await getDocumentSignedUrl(supabase, doc.file_path)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
    } catch {
      alert('Download fehlgeschlagen.')
    }
  }

  async function handlePreview(doc: MemberDocument) {
    try {
      const url = await getDocumentSignedUrl(supabase, doc.file_path, 300)
      setPreviewUrl(url)
      setPreviewDoc(doc)
    } catch {
      alert('Vorschau nicht verfügbar.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dokumente</h1>
        <p className="text-sm text-ink-muted mt-1">{documents.length} Dokumente insgesamt</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink-muted">Gesamt</p>
          <p className="text-xl font-semibold text-ink mt-1">{documents.length}</p>
        </div>
        <div className="card p-4 border-red-200 bg-red-50">
          <p className="text-xs text-red-700">Abgelaufen</p>
          <p className="text-xl font-semibold text-red-700 mt-1">{expiredCount}</p>
        </div>
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-xs text-amber-700">Läuft bald ab</p>
          <p className="text-xl font-semibold text-amber-700 mt-1">{expiringCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Mitglied oder Dateiname suchen..."
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as DocumentType | 'all')}
          className="input sm:w-56"
        >
          <option value="all">Alle Dokumenttypen</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="input sm:w-44"
        >
          <option value="all">Alle Status</option>
          <option value="expired">Abgelaufen</option>
          <option value="expiring">Läuft bald ab</option>
          <option value="valid">Gültig</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Keine Dokumente gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const Icon = TYPE_ICONS[doc.document_type]
            const expired = !!doc.expires_at && isExpired(doc.expires_at)
            const expiringSoon = !!doc.expires_at && !expired && isExpiringSoon(doc.expires_at)
            const canPreview = isPdfFile(doc.file_format) || isImageFile(doc.file_format)

            return (
              <div
                key={doc.id}
                className={cn(
                  'card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-3',
                  expired
                    ? 'border-red-200 bg-red-50'
                    : expiringSoon
                    ? 'border-amber-200 bg-amber-50'
                    : ''
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    expired ? 'bg-red-100' : expiringSoon ? 'bg-amber-100' : 'bg-surface-2'
                  )}>
                    {isImageFile(doc.file_format) ? (
                      <ImageIcon className={cn('w-4 h-4', expired ? 'text-red-500' : expiringSoon ? 'text-amber-600' : 'text-ink-muted')} />
                    ) : (
                      <Icon className={cn('w-4 h-4', expired ? 'text-red-500' : expiringSoon ? 'text-amber-600' : 'text-ink-muted')} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.member ? (
                        <Link href={`/members/${doc.member.id}`} className="text-sm font-medium text-ink hover:text-accent truncate">
                          {doc.member.first_name} {doc.member.last_name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-ink truncate">Unbekanntes Mitglied</span>
                      )}
                      <span className="badge text-[10px] bg-surface-2 text-ink-muted border-surface-3">
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </span>
                      {expired && (
                        <span className="badge text-[10px] bg-red-100 text-red-700 border-red-200">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Abgelaufen
                        </span>
                      )}
                      {expiringSoon && (
                        <span className="badge text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                          Läuft bald ab
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-ink-subtle truncate">{doc.file_name}</span>
                      <span className="text-[11px] text-ink-subtle">{formatFileSize(doc.file_size)}</span>
                      {doc.expires_at && (
                        <span className={cn('text-[11px]', expired ? 'text-red-600' : expiringSoon ? 'text-amber-700' : 'text-ink-subtle')}>
                          Läuft ab: {formatDate(doc.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-auto">
                  {canPreview && (
                    <button onClick={() => handlePreview(doc)} className="btn-ghost btn-sm p-1.5" title="Vorschau">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDownload(doc)} className="btn-ghost btn-sm p-1.5" title="Herunterladen">
                    <Download className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="btn-ghost btn-sm p-1.5 hover:text-red-600"
                      title="Löschen"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && previewDoc && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { setPreviewUrl(null); setPreviewDoc(null) }}
        >
          <div
            className="bg-surface-0 rounded-2xl shadow-modal max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-3">
              <div>
                <p className="text-sm font-semibold text-ink">{previewDoc.file_name}</p>
                <p className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABELS[previewDoc.document_type]}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(previewDoc)} className="btn-secondary btn-sm">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button onClick={() => { setPreviewUrl(null); setPreviewDoc(null) }} className="btn-ghost btn-sm">
                  Schließen
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-80px)] p-4">
              {isPdfFile(previewDoc.file_format) ? (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" title={previewDoc.file_name} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewDoc.file_name} className="max-w-full rounded-lg mx-auto" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
