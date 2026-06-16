import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

// Client-side Supabase client (for use in Client Components)
export const createClient = () => createClientComponentClient<Database>()


// Storage helpers
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  DOCUMENTS: 'member-documents',
} as const

export function getAvatarUrl(supabase: ReturnType<typeof createClient>, path: string) {
  const { data } = supabase.storage.from(STORAGE_BUCKETS.AVATARS).getPublicUrl(path)
  return data.publicUrl
}

export async function getDocumentSignedUrl(
  supabase: ReturnType<typeof createClient>,
  path: string,
  expiresIn = 3600
) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

export async function uploadDocument(
  supabase: ReturnType<typeof createClient>,
  memberId: string,
  documentId: string,
  file: File
) {
  const ext = file.name.split('.').pop()
  const path = `members/${memberId}/${documentId}/${file.name}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .upload(path, file, { upsert: false })

  if (error) throw error
  return path
}

export async function deleteDocument(
  supabase: ReturnType<typeof createClient>,
  path: string
) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .remove([path])

  if (error) throw error
}
