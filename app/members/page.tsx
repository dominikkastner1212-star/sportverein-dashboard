import { createServerClient } from '@/lib/supabase/server'
import { MembersClient } from '@/components/members/MembersClient'
import { getVisibleGraduations } from '@/lib/graduations'
import type { Member, Graduation } from '@/types'

export default async function MembersPage() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  const [{ data: members }, { data: graduations }] = await Promise.all([
    supabase
      .from('members')
      .select('*, graduations(*)')
      .order('first_name'),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
  ])

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'

  return (
    <MembersClient
      members={(members || []) as (Member & { graduation?: Graduation })[]}
      graduations={getVisibleGraduations((graduations || []) as Graduation[])}
      canEdit={canEdit}
    />
  )
}
