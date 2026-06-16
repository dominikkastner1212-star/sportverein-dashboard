// Auto-generated types stub — run `supabase gen types typescript` to regenerate
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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['members']['Insert']>
      }
      graduations: {
        Row: {
          id: string
          name: string
          color: string
          border_color: string
          rank_order: number
          min_age: number | null
          min_training_months: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['graduations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['graduations']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['exam_participants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exam_participants']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['exam_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exam_history']['Insert']>
      }
      checklist_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          graduation_id: string | null
          is_default: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['checklist_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['checklist_templates']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['checklist_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['checklist_items']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['member_checklist_status']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['member_checklist_status']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['member_documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['member_documents']['Insert']>
      }
    }
  }
}
