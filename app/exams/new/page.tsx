import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ExamForm } from '@/components/exams/ExamForm'
import type { Graduation } from '@/types'

export default async function NewExamPage() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/login')
  }

  const [{ data: profile }, { data: graduations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
  ])

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'
  if (!canEdit) {
    redirect('/exams')
  }

  return <ExamForm graduations={(graduations || []) as Graduation[]} examinerId={session.user.id} />
}
