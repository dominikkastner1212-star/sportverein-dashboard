'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, getDocumentSignedUrl, deleteDocument } from '@/lib/supabase/client'
import { DocumentUpload } from './DocumentUpload'
import {
  FileText, Image, Download, Trash2, Plus, Eye, AlertTriangle,
  FileBadge, Shield, Stethoscope, ClipboardList, CreditCard, ShieldCheck,
  File, Loader2,
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

interface DocumentSectionProps {
  memberId: string
  role: UserRole
}

// Important document types that should exist
const IMPORTANT_DOC_TYPES: DocumentType[] = ['sportlerpass', 'einverstaendnis']

export function DocumentSection({ memberId, role }: DocumentSectionProps) {
  const supabase = createClient()
  const [documents, setDocuments] = useState<MemberDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<MemberDocument | null>(null)

  const canUpload = role === 'admin' || role === 'trainer'
  const canDelete = role === 'admin'

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('member_documents')
      .select('*, profiles!uploaded_by(full_name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (!error) setDocuments((data || []) as unknown as MemberDocument[])
    setLoading(false)
  }, [memberId, supabase])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // Check for missing important documents
  const existingTypes = new Set(documents.map(d => d.document_type))
  const missingImportant = IMPORTANT_DOC_TYPES.filter(t => !existingTypes.has(t))

  async function handleDelete(doc: MemberDocument) {
    if (!confirm(`„${doc.file_name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return

    setDeletingId(doc.id)
    try {
      await deleteDocument(supabase, doc.file_path)
      await supabase.from('member_documents').delete().eq('id', doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) {
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
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-3">
        <div>
          <h2 className="section-title">Dokumente</h2>
          <p className="section-subtitle mt-0.5">
            {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}
          </p>
        </div>
        {canUpload && !showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="btn-secondary btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Hochladen
          </button>
        )}
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="px-6 py-5 border-b border-surface-3 bg-surface-1 animate-slide-up">
          <h3 className="text-sm font-medium text-ink mb-4">Dokument hochladen</h3>
          <DocumentUpload
            memberId={memberId}
            onSuccess={() => { setShowUpload(false); loadDocuments() }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Missing document warning */}
      {missingImportant.length > 0 && !loading && (
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-800">Wichtige Dokumente fehlen</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {missingImportant.map(t => DOCUMENT_TYPE_LABELS[t]).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-ink-faint animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-ink-faint mx-auto mb-2" />
            <p className="text-sm text-ink-muted">Noch keine Dokumente</p>
            {canUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-accent hover:text-accent-dark mt-1 transition-colors"
              >
                Erstes Dokument hochladen →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const Icon = TYPE_ICONS[doc.document_type]
              const expired = doc.expires_at && isExpired(doc.expires_at)
              const expiringSoon = doc.expires_at && !expired && isExpiringSoon(doc.expires_at)
              const canPreview = isPdfFile(doc.file_format) || isImageFile(doc.file_format)

              return (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    expired
                      ? 'border-red-200 bg-red-50'
                      : expiringSoon
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-surface-3 bg-surface-0 hover:bg-surface-1'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    expired ? 'bg-red-100' : expiringSoon ? 'bg-amber-100' : 'bg-surface-2'
                  )}>
                    {isImageFile(doc.file_format) ? (
                      <Image className={cn('w-4 h-4', expired ? 'text-red-500' : expiringSoon ? 'text-amber-600' : 'text-ink-muted')} />
                    ) : (
                      <Icon className={cn('w-4 h-4', expired ? 'text-red-500' : expiringSoon ? 'text-amber-600' : 'text-ink-muted')} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink truncate">{doc.file_name}</p>
                      <span className="badge text-[10px] bg-surface-2 text-ink-muted border-surface-3">
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </span>
                      {expired && (
                        <span className="badge text-[10px] bg-red-100 text-red-700 border-red-200">
                          Abgelaufen
                        </span>
                      )}
                      {expiringSoon && (
                        <span className="badge text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                          Läuft bald ab
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-ink-subtle">{formatFileSize(doc.file_size)}</span>
                      <span className="text-[11px] text-ink-subtle">
                        {formatDate(doc.created_at)}
                      </span>
                      {doc.expires_at && (
                        <span className={cn('text-[11px]', expired ? 'text-red-600' : expiringSoon ? 'text-amber-700' : 'text-ink-subtle')}>
                          Läuft ab: {formatDate(doc.expires_at)}
                        </span>
                      )}
                      {doc.notes && (
                        <span className="text-[11px] text-ink-subtle italic truncate max-w-[120px]">
                          {doc.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canPreview && (
                      <button
                        onClick={() => handlePreview(doc)}
                        className="btn-ghost btn-sm p-1.5"
                        title="Vorschau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="btn-ghost btn-sm p-1.5"
                      title="Herunterladen"
                    >
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
      </div>

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
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg"
                  title={previewDoc.file_name}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={previewDoc.file_name}
                  className="max-w-full rounded-lg mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
