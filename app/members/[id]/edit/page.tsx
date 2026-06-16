import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { MemberForm } from '@/components/members/MemberForm'
import { getVisibleGraduations } from '@/lib/graduations'
import type { Graduation, Member } from '@/types'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/login')
  }

  const [{ data: profile }, { data: member }, { data: graduations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
  ])

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'
  if (!canEdit) {
    redirect(`/members/${id}`)
  }

  if (!member) {
    notFound()
  }

  return (
    <MemberForm
      member={member as Member}
      graduations={getVisibleGraduations((graduations || []) as Graduation[])}
    />
  )
}
