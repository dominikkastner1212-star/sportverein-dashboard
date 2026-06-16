-- ============================================================
-- Sportverein Dashboard — Row Level Security Policies
-- Migration: 002_rls_policies
-- ============================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── PROFILES ────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can see their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin and trainer can see all profiles
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (public.get_my_role() IN ('admin', 'trainer'));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only admin can update roles
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- ─── GRADUATIONS ─────────────────────────────────────────────

ALTER TABLE public.graduations ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can see graduations
CREATE POLICY "graduations_select_all" ON public.graduations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin can modify graduations
CREATE POLICY "graduations_insert_admin" ON public.graduations
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "graduations_update_admin" ON public.graduations
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "graduations_delete_admin" ON public.graduations
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── MEMBERS ─────────────────────────────────────────────────

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see members
CREATE POLICY "members_select_all" ON public.members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and trainer can create members
CREATE POLICY "members_insert_trainer" ON public.members
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

-- Admin and trainer can update members
CREATE POLICY "members_update_trainer" ON public.members
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

-- Only admin can delete members
CREATE POLICY "members_delete_admin" ON public.members
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── EXAMS ───────────────────────────────────────────────────

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams_select_all" ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exams_insert_trainer" ON public.exams
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exams_update_trainer" ON public.exams
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exams_delete_admin" ON public.exams
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── EXAM PARTICIPANTS ───────────────────────────────────────

ALTER TABLE public.exam_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_participants_select_all" ON public.exam_participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exam_participants_insert_trainer" ON public.exam_participants
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exam_participants_update_trainer" ON public.exam_participants
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exam_participants_delete_admin" ON public.exam_participants
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── EXAM HISTORY ────────────────────────────────────────────

ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_history_select_all" ON public.exam_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exam_history_insert_trainer" ON public.exam_history
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exam_history_update_trainer" ON public.exam_history
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "exam_history_delete_admin" ON public.exam_history
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── CHECKLIST TEMPLATES ─────────────────────────────────────

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_select_all" ON public.checklist_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "checklist_templates_insert_admin" ON public.checklist_templates
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_templates_update_admin" ON public.checklist_templates
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_templates_delete_admin" ON public.checklist_templates
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── CHECKLIST ITEMS ─────────────────────────────────────────

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_select_all" ON public.checklist_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "checklist_items_insert_trainer" ON public.checklist_items
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_items_update_trainer" ON public.checklist_items
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_items_delete_admin" ON public.checklist_items
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── MEMBER CHECKLIST STATUS ─────────────────────────────────

ALTER TABLE public.member_checklist_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_status_select_all" ON public.member_checklist_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "checklist_status_insert_trainer" ON public.member_checklist_status
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_status_update_trainer" ON public.member_checklist_status
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_status_delete_admin" ON public.member_checklist_status
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── MEMBER DOCUMENTS ────────────────────────────────────────

ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see documents (reader can view)
CREATE POLICY "documents_select_all" ON public.member_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and trainer can upload documents
CREATE POLICY "documents_insert_trainer" ON public.member_documents
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

-- Admin and trainer can update document metadata
CREATE POLICY "documents_update_trainer" ON public.member_documents
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

-- Only admin can delete documents
CREATE POLICY "documents_delete_admin" ON public.member_documents
  FOR DELETE USING (public.get_my_role() = 'admin');
