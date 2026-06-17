import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Server-only Supabase client with the service role key — bypasses RLS.
// Never import this from client components.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
