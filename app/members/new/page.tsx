import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { MemberForm } from '@/components/members/MemberForm'
import { getVisibleGraduations } from '@/lib/graduations'
import type { Graduation } from '@/types'

export default async function NewMemberPage() {
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
    redirect('/members')
  }

  return <MemberForm graduations={getVisibleGraduations((graduations || []) as Graduation[])} />
}
