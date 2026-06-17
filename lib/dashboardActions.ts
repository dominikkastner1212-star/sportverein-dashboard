import { resolveApplicableTemplate } from '@/lib/checklists'
import { isExpired, isExpiringSoon, formatDate } from '@/lib/utils'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import type { ChecklistAssignment, ChecklistTemplate, DocumentType } from '@/types'

export interface OpenAction {
  id: string
  severity: 'warning' | 'info'
  memberId: string
  title: string
  detail: string
}

interface ParticipantInfo {
  participantId: string
  memberId: string
  memberName: string
  examTitle: string
  examDate: string
}

export async function getOpenActions(supabase: any, horizonDays = 90): Promise<OpenAction[]> {
  const today = new Date()
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + horizonDays)
  const todayStr = today.toISOString().split('T')[0]
  const horizonStr = horizon.toISOString().split('T')[0]

  const [{ data: exams }, { data: templates }, { data: assignments }, { data: documents }] = await Promise.all([
    supabase
      .from('exams')
      .select('id, title, date, exam_participants(id, member_id, passed, members(id, first_name, last_name, group_type, graduation_id))')
      .gte('date', todayStr)
      .lte('date', horizonStr)
      .order('date', { ascending: true }),
    supabase.from('checklist_templates').select('*').eq('is_active', true),
    supabase.from('checklist_assignments').select('*').eq('is_active', true),
    supabase
      .from('member_documents')
      .select('id, member_id, document_type, expires_at, members(id, first_name, last_name)')
      .not('expires_at', 'is', null),
  ])

  const actions: OpenAction[] = []
  const examRows = (exams || []) as any[]
  const allTemplates = (templates || []) as ChecklistTemplate[]
  const allAssignments = (assignments || []) as ChecklistAssignment[]

  const pendingParticipants: ParticipantInfo[] = []
  const seenMembers = new Map<string, any>()

  for (const exam of examRows) {
    for (const participant of exam.exam_participants || []) {
      const member = participant.members
      if (!member) continue
      seenMembers.set(member.id, member)
      if (participant.passed !== null) continue
      pendingParticipants.push({
        participantId: participant.id,
        memberId: member.id,
        memberName: `${member.first_name} ${member.last_name}`,
        examTitle: exam.title,
        examDate: exam.date,
      })
    }
  }

  if (pendingParticipants.length > 0) {
    const templateByMember = new Map<string, ChecklistTemplate | null>()
    seenMembers.forEach(member => {
      const resolved = resolveApplicableTemplate('exam', allTemplates, allAssignments, member)
      templateByMember.set(member.id, resolved?.template || null)
    })

    const templateIds = Array.from(new Set(Array.from(templateByMember.values()).filter(Boolean).map(t => t!.id)))
    const { data: items } = templateIds.length
      ? await supabase.from('checklist_items').select('*').in('template_id', templateIds)
      : { data: [] as any[] }

    const itemsByTemplate = new Map<string, any[]>()
    ;(items || []).forEach((item: any) => {
      const list = itemsByTemplate.get(item.template_id) || []
      list.push(item)
      itemsByTemplate.set(item.template_id, list)
    })

    const memberIds = Array.from(new Set(pendingParticipants.map(p => p.memberId)))
    const { data: statuses } = memberIds.length
      ? await supabase.from('member_checklist_status').select('*').in('member_id', memberIds).not('exam_id', 'is', null)
      : { data: [] as any[] }

    pendingParticipants.forEach(participant => {
      const template = templateByMember.get(participant.memberId)
      if (!template) return
      const items = itemsByTemplate.get(template.id) || []
      if (items.length === 0) return
      const doneIds = new Set(
        (statuses || [])
          .filter((s: any) => s.member_id === participant.memberId && s.is_done)
          .map((s: any) => s.checklist_item_id)
      )
      const openCount = items.filter((item: any) => !doneIds.has(item.id)).length
      if (openCount > 0) {
        actions.push({
          id: `checklist-${participant.participantId}`,
          severity: 'warning',
          memberId: participant.memberId,
          title: `${participant.memberName} — Checkliste unvollständig`,
          detail: `${openCount} von ${items.length} Punkten offen · Prüfung "${participant.examTitle}" am ${formatDate(participant.examDate)}`,
        })
      }
    })
  }

  ;(documents || []).forEach((doc: any) => {
    if (!doc.expires_at || !doc.members) return
    const expired = isExpired(doc.expires_at)
    const expiringSoon = !expired && isExpiringSoon(doc.expires_at, 30)
    if (!expired && !expiringSoon) return

    const memberName = `${doc.members.first_name} ${doc.members.last_name}`
    actions.push({
      id: `document-${doc.id}`,
      severity: expired ? 'warning' : 'info',
      memberId: doc.member_id,
      title: `${memberName} — ${DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType]} ${expired ? 'abgelaufen' : 'läuft bald ab'}`,
      detail: expired ? `Abgelaufen am ${formatDate(doc.expires_at)}` : `Läuft ab am ${formatDate(doc.expires_at)}`,
    })
  })

  return actions
}
