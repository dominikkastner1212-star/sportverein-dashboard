'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn, formatFileSize, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/utils'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import type { DocumentType } from '@/types'
import { createClient, uploadDocument } from '@/lib/supabase/client'

interface DocumentUploadProps {
  memberId: string
  onSuccess: () => void
  onCancel: () => void
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadFile {
  file: File
  progress: number
  state: UploadState
  error?: string
}

export function DocumentUpload({ memberId, onSuccess, onCancel }: DocumentUploadProps) {
  const supabase = createClient()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [docType, setDocType] = useState<DocumentType>('sonstiges')
  const [notes, setNotes] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[], rejected: { file: File; errors: { message: string }[] }[]) => {
    const newFiles = accepted.map(f => ({
      file: f,
      progress: 0,
      state: 'idle' as UploadState,
    }))

    if (rejected.length > 0) {
      setGlobalError(
        `${rejected.length} Datei(en) abgelehnt: ${rejected[0].errors[0].message}`
      )
    } else {
      setGlobalError(null)
    }

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
  })

  function removeFile(index: number) {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (uploadFiles.length === 0) return
    setSubmitting(true)
    setGlobalError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (let i = 0; i < uploadFiles.length; i++) {
      const item = uploadFiles[i]

      setUploadFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, state: 'uploading', progress: 0 } : f
      ))

      try {
        const docId = crypto.randomUUID()
        const ext = item.file.name.split('.').pop() || ''

        // Upload to Supabase Storage
        const filePath = await uploadDocument(supabase, memberId, docId, item.file)

        // Simulate progress (Supabase JS doesn't support upload progress directly)
        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 60 } : f
        ))

        // Insert metadata
        const { error: dbError } = await supabase.from('member_documents').insert({
          id: docId,
          member_id: memberId,
          file_name: item.file.name,
          file_path: filePath,
          document_type: docType,
          file_size: item.file.size,
          file_format: ext,
          notes: notes || null,
          expires_at: expiresAt || null,
          uploaded_by: user.id,
        })

        if (dbError) throw dbError

        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, state: 'success', progress: 100 } : f
        ))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, state: 'error', error: message } : f
        ))
      }
    }

    setSubmitting(false)

    const allSuccess = uploadFiles.every(f => f.state === 'success')
    if (allSuccess) {
      setTimeout(onSuccess, 800)
    }
  }

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150',
          isDragActive
            ? 'border-accent bg-accent-light/20'
            : 'border-surface-3 hover:border-ink-faint hover:bg-surface-1'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn(
          'w-8 h-8 mx-auto mb-3 transition-colors',
          isDragActive ? 'text-accent' : 'text-ink-faint'
        )} />
        <p className="text-sm font-medium text-ink">
          {isDragActive ? 'Datei hier ablegen' : 'Dateien hierher ziehen'}
        </p>
        <p className="text-xs text-ink-subtle mt-1">
          oder <span className="text-accent">Datei auswählen</span>
        </p>
        <p className="text-[11px] text-ink-faint mt-2">
          PDF, JPG, PNG, DOCX · max. {MAX_FILE_SIZE_MB} MB
        </p>
      </div>

      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          {uploadFiles.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
              <FileText className="w-4 h-4 text-ink-subtle flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink truncate">{item.file.name}</p>
                <p className="text-[11px] text-ink-subtle">{formatFileSize(item.file.size)}</p>
                {item.state === 'uploading' && (
                  <div className="mt-1.5 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.state === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                )}
                {item.state === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {item.state === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" title={item.error} />
                )}
                {item.state === 'idle' && (
                  <button onClick={() => removeFile(i)} className="text-ink-subtle hover:text-ink">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="input-label">Dokumenttyp</label>
          <select
            className="input"
            value={docType}
            onChange={e => setDocType(e.target.value as DocumentType)}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="input-label">Ablaufdatum (optional)</label>
          <input
            type="date"
            className="input"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="input-label">Notiz (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="z.B. gültig bis Dezember 2025"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {globalError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {globalError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="btn-secondary">Abbrechen</button>
        <button
          onClick={handleUpload}
          disabled={uploadFiles.length === 0 || submitting}
          className="btn-primary"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird hochgeladen…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {uploadFiles.length > 1 ? `${uploadFiles.length} Dateien hochladen` : 'Hochladen'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
