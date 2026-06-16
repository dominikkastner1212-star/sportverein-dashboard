-- ============================================================
-- Sportverein Dashboard — Supabase SQL Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'trainer', 'reader')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── GRADUATIONS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.graduations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  color                 TEXT NOT NULL DEFAULT '#e5e7eb',
  border_color          TEXT NOT NULL DEFAULT '#d1d5db',
  rank_order            INTEGER NOT NULL DEFAULT 0,
  min_age               INTEGER,
  min_training_months   INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MEMBERS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.members (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  gender              TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other')),
  birth_date          DATE NOT NULL,
  entry_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'left')),
  group_type          TEXT NOT NULL DEFAULT 'youth_adults' CHECK (group_type IN ('children', 'youth_adults')),
  graduation_id       UUID REFERENCES public.graduations(id) ON DELETE SET NULL,
  last_exam_date      DATE,
  avatar_url          TEXT,
  notes               TEXT,
  phone               TEXT,
  email               TEXT,
  emergency_contact   TEXT,
  emergency_phone     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── EXAM HISTORY ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id     UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exam_id       UUID,  -- nullable, may reference future exams table
  graduation_id UUID NOT NULL REFERENCES public.graduations(id) ON DELETE RESTRICT,
  passed        BOOLEAN NOT NULL DEFAULT false,
  date          DATE NOT NULL,
  notes         TEXT,
  examiner      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── EXAMS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exams (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  date                    DATE NOT NULL,
  time                    TIME,
  location                TEXT,
  description             TEXT,
  examiner_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                  TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'completed')),
  allowed_graduation_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from exam_history to exams after exams table exists
ALTER TABLE public.exam_history
  ADD CONSTRAINT fk_exam_history_exam
  FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE SET NULL;

CREATE TRIGGER exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── EXAM PARTICIPANTS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_participants (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id                 UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  member_id               UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  target_graduation_id    UUID REFERENCES public.graduations(id) ON DELETE SET NULL,
  passed                  BOOLEAN,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, member_id)
);

-- ─── CHECKLIST TEMPLATES ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  graduation_id UUID REFERENCES public.graduations(id) ON DELETE SET NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── CHECKLIST ITEMS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  description   TEXT,
  is_required   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MEMBER CHECKLIST STATUS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_checklist_status (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exam_id             UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  checklist_item_id   UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  is_done             BOOLEAN NOT NULL DEFAULT false,
  done_at             TIMESTAMPTZ,
  done_by             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, exam_id, checklist_item_id)
);

CREATE TRIGGER member_checklist_status_updated_at
  BEFORE UPDATE ON public.member_checklist_status
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── MEMBER DOCUMENTS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  document_type   TEXT NOT NULL DEFAULT 'sonstiges'
                  CHECK (document_type IN (
                    'sportlerpass', 'einverstaendnis', 'attest',
                    'pruefungsanmeldung', 'beitragsnachweis', 'versicherung', 'sonstiges'
                  )),
  file_size       BIGINT NOT NULL DEFAULT 0,
  file_format     TEXT NOT NULL DEFAULT 'pdf',
  notes           TEXT,
  expires_at      DATE,
  uploaded_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_group_type ON public.members(group_type);
CREATE INDEX IF NOT EXISTS idx_members_graduation ON public.members(graduation_id);
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON public.members(birth_date);
CREATE INDEX IF NOT EXISTS idx_members_last_exam_date ON public.members(last_exam_date);
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(date);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_participants_exam ON public.exam_participants(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_participants_member ON public.exam_participants(member_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_member ON public.member_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_type ON public.member_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON public.checklist_items(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_member_checklist_status_member ON public.member_checklist_status(member_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_member ON public.exam_history(member_id);
