// ─── Auth & Users ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'trainer' | 'reader'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ─── Graduations ──────────────────────────────────────────────────────────────

export interface Graduation {
  id: string
  name: string
  color: string
  border_color: string
  rank_order: number
  min_age: number | null
  min_training_months: number | null
  created_at: string
}

// ─── Members ──────────────────────────────────────────────────────────────────

export type MemberStatus = 'active' | 'paused' | 'left'
export type MemberGender = 'male' | 'female' | 'other'
export type MemberGroup = 'children' | 'youth_adults'
export type MemberSortKey = 'name' | 'graduation' | 'group' | 'status' | 'age' | 'last_exam_date'
export type SortDirection = 'asc' | 'desc'

export interface Member {
  id: string
  first_name: string
  last_name: string
  gender: MemberGender
  birth_date: string
  entry_date: string
  status: MemberStatus
  group_type: MemberGroup
  graduation_id: string | null
  graduation?: Graduation
  last_exam_date: string | null
  avatar_url: string | null
  notes: string | null
  phone: string | null
  email: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  created_at: string
  updated_at: string
}

export interface MemberWithAge extends Member {
  age: number
}

// ─── Exam History ─────────────────────────────────────────────────────────────

export interface ExamHistory {
  id: string
  member_id: string
  exam_id: string | null
  exam?: Exam
  graduation_id: string
  graduation?: Graduation
  passed: boolean
  date: string
  notes: string | null
  examiner: string | null
  created_at: string
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export type ExamStatus = 'planned' | 'open' | 'completed'

export interface Exam {
  id: string
  title: string
  date: string
  time: string | null
  location: string | null
  description: string | null
  examiner_id: string | null
  examiner?: Profile
  status: ExamStatus
  allowed_graduation_ids: string[]
  created_at: string
  updated_at: string
}

export interface ExamParticipant {
  id: string
  exam_id: string
  member_id: string
  member?: Member
  target_graduation_id: string | null
  target_graduation?: Graduation
  passed: boolean | null
  notes: string | null
  created_at: string
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export interface ChecklistTemplate {
  id: string
  name: string
  description: string | null
  graduation_id: string | null
  graduation?: Graduation
  usage_type: 'member' | 'exam'
  is_active: boolean
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistAssignment {
  id: string
  template_id: string
  scope_type: 'all' | 'group' | 'graduation' | 'member'
  group_type: MemberGroup | null
  graduation_ids: string[]
  member_ids: string[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  template_id: string
  label: string
  description: string | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface MemberChecklistStatus {
  id: string
  member_id: string
  exam_id: string | null
  checklist_item_id: string
  checklist_item?: ChecklistItem
  is_done: boolean
  done_at: string | null
  done_by: string | null
  done_by_profile?: Profile
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'sportlerpass'
  | 'einverstaendnis'
  | 'attest'
  | 'pruefungsanmeldung'
  | 'beitragsnachweis'
  | 'versicherung'
  | 'sonstiges'

export interface MemberDocument {
  id: string
  member_id: string
  member?: Member
  file_name: string
  file_path: string
  document_type: DocumentType
  file_size: number
  file_format: string
  notes: string | null
  expires_at: string | null
  uploaded_by: string
  uploaded_by_profile?: Profile
  created_at: string
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface FilterState {
  search: string
  graduation_id: string | null
  group_type: MemberGroup | null
  gender: MemberGender | null
  status: MemberStatus | null
  age_min: number | null
  age_max: number | null
  sort_by: MemberSortKey
  sort_direction: SortDirection
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  sportlerpass: 'Sportlerpass',
  einverstaendnis: 'Einverständniserklärung',
  attest: 'Ärztliches Attest',
  pruefungsanmeldung: 'Prüfungsanmeldung',
  beitragsnachweis: 'Beitragsnachweis',
  versicherung: 'Versicherungsdokument',
  sonstiges: 'Sonstiges Dokument',
}

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  sportlerpass: '🎽',
  einverstaendnis: '✍️',
  attest: '🏥',
  pruefungsanmeldung: '📋',
  beitragsnachweis: '💳',
  versicherung: '🛡️',
  sonstiges: '📄',
}

export const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  white: { bg: '#f9fafb', text: '#374151', border: '#d1d5db' },
  yellow: { bg: '#fefce8', text: '#854d0e', border: '#eab308' },
  green: { bg: '#f0fdf4', text: '#166534', border: '#16a34a' },
  blue: { bg: '#eff6ff', text: '#1e40af', border: '#2563eb' },
  black: { bg: '#111827', text: '#f9fafb', border: '#111827' },
  red: { bg: '#fef2f2', text: '#991b1b', border: '#dc2626' },
}
