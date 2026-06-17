import { createServerClient } from '@/lib/supabase/server'
import { DocumentsClient } from '@/components/documents/DocumentsClient'
import type { MemberDocument, UserRole } from '@/types'

export default async function DocumentsPage() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  const { data: documents } = await supabase
    .from('member_documents')
    .select('*, member:members(id, first_name, last_name)')
    .order('created_at', { ascending: false })

  const role = (profile?.role || 'reader') as UserRole

  return (
    <DocumentsClient
      documents={(documents || []) as unknown as MemberDocument[]}
      role={role}
    />
  )
}
