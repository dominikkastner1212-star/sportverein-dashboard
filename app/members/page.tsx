import { createServerClient } from '@/lib/supabase/server'
import { MembersClient } from '@/components/members/MembersClient'
import { getVisibleGraduations } from '@/lib/graduations'
import { resolveApplicableTemplate } from '@/lib/checklists'
import type { Member, Graduation, ChecklistTemplate, ChecklistAssignment } from '@/types'

export default async function MembersPage() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single()

  const [{ data: members }, { data: graduations }, { data: templates }, { data: assignments }] = await Promise.all([
    supabase
      .from('members')
      .select('*, graduations(*)')
      .order('first_name'),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
    supabase.from('checklist_templates').select('*').eq('is_active', true),
    supabase.from('checklist_assignments').select('*').eq('is_active', true),
  ])

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'
  const allTemplates = (templates || []) as ChecklistTemplate[]
  const allAssignments = (assignments || []) as ChecklistAssignment[]

  const memberRows = (members || []) as (Member & { graduations?: Graduation | Graduation[] | null })[]
  const templateByMember = new Map<string, ChecklistTemplate | null>()
  memberRows.forEach(member => {
    const resolved = resolveApplicableTemplate('member', allTemplates, allAssignments, member)
    templateByMember.set(member.id, resolved?.template || null)
  })

  const templateIds = Array.from(new Set(Array.from(templateByMember.values()).filter(Boolean).map(t => t!.id)))
  const memberIds = memberRows.map(m => m.id)

  const [{ data: items }, { data: statuses }] = await Promise.all([
    templateIds.length
      ? supabase.from('checklist_items').select('*').in('template_id', templateIds)
      : Promise.resolve({ data: [] as any[] }),
    memberIds.length
      ? supabase.from('member_checklist_status').select('*').in('member_id', memberIds).is('exam_id', null)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const itemsByTemplate = new Map<string, any[]>()
  ;(items || []).forEach((item: any) => {
    const list = itemsByTemplate.get(item.template_id) || []
    list.push(item)
    itemsByTemplate.set(item.template_id, list)
  })

  const normalizedMembers = memberRows.map(member => {
    const template = templateByMember.get(member.id)
    const templateItems = template ? itemsByTemplate.get(template.id) || [] : []
    const doneCount = template
      ? (statuses || []).filter((s: any) => s.member_id === member.id && s.is_done && templateItems.some(item => item.id === s.checklist_item_id)).length
      : 0

    return {
      ...member,
      graduation: Array.isArray(member.graduations) ? member.graduations[0] : member.graduations || undefined,
      checklistProgress: template && templateItems.length > 0 ? { done: doneCount, total: templateItems.length } : null,
    }
  })

  return (
    <MembersClient
      members={normalizedMembers}
      graduations={getVisibleGraduations((graduations || []) as Graduation[])}
      canEdit={canEdit}
    />
  )
}
