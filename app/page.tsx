import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/client'

export default async function HomePage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  redirect('/dashboard')
}
