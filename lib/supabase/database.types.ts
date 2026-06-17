// Auto-generated types stub — run `supabase gen types typescript` to regenerate
type RequiredKeys<T> = { [K in keyof T]: null extends T[K] ? never : K }[keyof T]
type OptionalKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T]
// Mirrors what `supabase gen types` does: columns that are nullable (and thus have an
// implicit default of NULL) become optional on insert, matching the real Postgres schema.
type InsertShape<T> = Pick<T, RequiredKeys<T>> & Partial<Pick<T, OptionalKeys<T>>>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'trainer' | 'reader'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          gender: 'male' | 'female' | 'other'
          birth_date: string
          entry_date: string
          status: 'active' | 'paused' | 'left'
          group_type: 'children' | 'youth_adults'
          graduation_id: string | null
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
        Insert: InsertShape<Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['members']['Insert']>
        Relationships: [
          { foreignKeyName: 'members_graduation_id_fkey'; columns: ['graduation_id']; isOneToOne: false; referencedRelation: 'graduations'; referencedColumns: ['id'] }
        ]
      }
      graduations: {
        Row: {
          id: string
          name: string
          color: string
          border_color: string
          secondary_color: string | null
          rank_order: number
          min_age: number | null
          min_training_months: number | null
          created_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['graduations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['graduations']['Insert']>
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          title: string
          date: string
          time: string | null
          location: string | null
          description: string | null
          examiner_id: string | null
          status: 'planned' | 'open' | 'completed'
          allowed_graduation_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
        Relationships: [
          { foreignKeyName: 'exams_examiner_id_fkey'; columns: ['examiner_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      exam_participants: {
        Row: {
          id: string
          exam_id: string
          member_id: string
          target_graduation_id: string | null
          passed: boolean | null
          notes: string | null
          created_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['exam_participants']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['exam_participants']['Insert']>
        Relationships: [
          { foreignKeyName: 'exam_participants_exam_id_fkey'; columns: ['exam_id']; isOneToOne: false; referencedRelation: 'exams'; referencedColumns: ['id'] },
          { foreignKeyName: 'exam_participants_member_id_fkey'; columns: ['member_id']; isOneToOne: false; referencedRelation: 'members'; referencedColumns: ['id'] },
          { foreignKeyName: 'exam_participants_target_graduation_id_fkey'; columns: ['target_graduation_id']; isOneToOne: false; referencedRelation: 'graduations'; referencedColumns: ['id'] }
        ]
      }
      exam_history: {
        Row: {
          id: string
          member_id: string
          exam_id: string | null
          graduation_id: string
          passed: boolean
          date: string
          notes: string | null
          examiner: string | null
          created_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['exam_history']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['exam_history']['Insert']>
        Relationships: [
          { foreignKeyName: 'exam_history_member_id_fkey'; columns: ['member_id']; isOneToOne: false; referencedRelation: 'members'; referencedColumns: ['id'] },
          { foreignKeyName: 'exam_history_exam_id_fkey'; columns: ['exam_id']; isOneToOne: false; referencedRelation: 'exams'; referencedColumns: ['id'] },
          { foreignKeyName: 'exam_history_graduation_id_fkey'; columns: ['graduation_id']; isOneToOne: false; referencedRelation: 'graduations'; referencedColumns: ['id'] }
        ]
      }
      checklist_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          graduation_id: string | null
          usage_type: 'member' | 'exam'
          is_active: boolean
          is_default: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['checklist_templates']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['checklist_templates']['Insert']>
        Relationships: [
          { foreignKeyName: 'checklist_templates_graduation_id_fkey'; columns: ['graduation_id']; isOneToOne: false; referencedRelation: 'graduations'; referencedColumns: ['id'] },
          { foreignKeyName: 'checklist_templates_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      checklist_assignments: {
        Row: {
          id: string
          template_id: string
          scope_type: 'all' | 'group' | 'graduation' | 'member'
          group_type: 'children' | 'youth_adults' | null
          graduation_ids: string[]
          member_ids: string[]
          priority: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['checklist_assignments']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['checklist_assignments']['Insert']>
        Relationships: [
          { foreignKeyName: 'checklist_assignments_template_id_fkey'; columns: ['template_id']; isOneToOne: false; referencedRelation: 'checklist_templates'; referencedColumns: ['id'] }
        ]
      }
      checklist_items: {
        Row: {
          id: string
          template_id: string
          label: string
          description: string | null
          is_required: boolean
          sort_order: number
          created_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['checklist_items']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['checklist_items']['Insert']>
        Relationships: [
          { foreignKeyName: 'checklist_items_template_id_fkey'; columns: ['template_id']; isOneToOne: false; referencedRelation: 'checklist_templates'; referencedColumns: ['id'] }
        ]
      }
      member_checklist_status: {
        Row: {
          id: string
          member_id: string
          exam_id: string | null
          checklist_item_id: string
          is_done: boolean
          done_at: string | null
          done_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['member_checklist_status']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['member_checklist_status']['Insert']>
        Relationships: [
          { foreignKeyName: 'member_checklist_status_member_id_fkey'; columns: ['member_id']; isOneToOne: false; referencedRelation: 'members'; referencedColumns: ['id'] },
          { foreignKeyName: 'member_checklist_status_exam_id_fkey'; columns: ['exam_id']; isOneToOne: false; referencedRelation: 'exams'; referencedColumns: ['id'] },
          { foreignKeyName: 'member_checklist_status_checklist_item_id_fkey'; columns: ['checklist_item_id']; isOneToOne: false; referencedRelation: 'checklist_items'; referencedColumns: ['id'] },
          { foreignKeyName: 'member_checklist_status_done_by_fkey'; columns: ['done_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      member_documents: {
        Row: {
          id: string
          member_id: string
          file_name: string
          file_path: string
          document_type: 'sportlerpass' | 'einverstaendnis' | 'attest' | 'pruefungsanmeldung' | 'beitragsnachweis' | 'versicherung' | 'sonstiges'
          file_size: number
          file_format: string
          notes: string | null
          expires_at: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: InsertShape<Omit<Database['public']['Tables']['member_documents']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['member_documents']['Insert']>
        Relationships: [
          { foreignKeyName: 'member_documents_member_id_fkey'; columns: ['member_id']; isOneToOne: false; referencedRelation: 'members'; referencedColumns: ['id'] },
          { foreignKeyName: 'member_documents_uploaded_by_fkey'; columns: ['uploaded_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
