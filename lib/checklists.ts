import type { ChecklistAssignment, ChecklistTemplate, Member } from '@/types'

type MemberTarget = Pick<Member, 'id' | 'group_type' | 'graduation_id'>

export function isExamTemplateName(name: string) {
  const normalizedName = name.trim().toLowerCase()
  return normalizedName === 'prüfung' || normalizedName === 'pruefung'
}

export function getEffectiveTemplateUsage(template: Pick<ChecklistTemplate, 'name'> & Partial<ChecklistTemplate>) {
  if (template.usage_type === 'exam' || template.usage_type === 'member') return template.usage_type
  return isExamTemplateName(template.name) ? 'exam' : 'member'
}

export function isTemplateActive(template: Partial<ChecklistTemplate>) {
  return template.is_active !== false
}

export function getTemplateUsageLabel(usageType: ChecklistTemplate['usage_type']) {
  return usageType === 'exam' ? 'Prüfung' : 'Mitglied'
}

export function getAssignmentScopeLabel(scopeType: ChecklistAssignment['scope_type']) {
  const labels: Record<ChecklistAssignment['scope_type'], string> = {
    all: 'Alle Mitglieder',
    group: 'Gruppe',
    graduation: 'Gürtel',
    member: 'Einzelne Mitglieder',
  }

  return labels[scopeType]
}

export function getAssignmentSpecificity(scopeType: ChecklistAssignment['scope_type']) {
  const specificity: Record<ChecklistAssignment['scope_type'], number> = {
    member: 0,
    graduation: 1,
    group: 2,
    all: 3,
  }

  return specificity[scopeType]
}

export function memberMatchesAssignment(member: MemberTarget, assignment: ChecklistAssignment) {
  if (!assignment.is_active) return false

  if (assignment.scope_type === 'all') return true

  if (assignment.scope_type === 'group') {
    return assignment.group_type !== null && assignment.group_type === (member.group_type || 'youth_adults')
  }

  if (assignment.scope_type === 'graduation') {
    return !!member.graduation_id && assignment.graduation_ids.includes(member.graduation_id)
  }

  return assignment.member_ids.includes(member.id)
}

export function getMatchingMembersForTemplate(
  template: ChecklistTemplate,
  assignments: ChecklistAssignment[],
  members: MemberTarget[]
) {
  const relevantAssignments = assignments
    .filter(assignment => assignment.template_id === template.id && assignment.is_active)
    .sort((a, b) => a.priority - b.priority)

  const memberIds = new Set<string>()

  members.forEach(member => {
    if (relevantAssignments.some(assignment => memberMatchesAssignment(member, assignment))) {
      memberIds.add(member.id)
    }
  })

  return memberIds
}

export function resolveApplicableTemplate(
  usageType: ChecklistTemplate['usage_type'],
  templates: ChecklistTemplate[],
  assignments: ChecklistAssignment[],
  member: MemberTarget
) {
  const rankedTemplates = templates
    .filter(template => getEffectiveTemplateUsage(template) === usageType && isTemplateActive(template))
    .map(template => {
      const templateAssignments = assignments
        .filter(assignment => assignment.template_id === template.id && assignment.is_active)
        .filter(assignment => memberMatchesAssignment(member, assignment))
        .sort((a, b) => {
          const specificityDelta = getAssignmentSpecificity(a.scope_type) - getAssignmentSpecificity(b.scope_type)
          if (specificityDelta !== 0) return specificityDelta
          return a.priority - b.priority
        })

      return {
        template,
        assignment: templateAssignments[0] || null,
      }
    })
    .filter(entry => entry.assignment !== null)
    .sort((a, b) => {
      const specificityDelta = getAssignmentSpecificity(a.assignment!.scope_type) - getAssignmentSpecificity(b.assignment!.scope_type)
      if (specificityDelta !== 0) return specificityDelta
      return a.assignment!.priority - b.assignment!.priority
    })

  return rankedTemplates[0] || null
}
