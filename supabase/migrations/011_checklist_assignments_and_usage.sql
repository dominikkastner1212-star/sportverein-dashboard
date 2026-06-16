-- Add checklist usage types and assignment rules for members and exams.

ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS usage_type TEXT NOT NULL DEFAULT 'member'
  CHECK (usage_type IN ('member', 'exam'));

ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.checklist_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('all', 'group', 'graduation', 'member')),
  group_type TEXT CHECK (group_type IN ('children', 'youth_adults')),
  graduation_ids UUID[] NOT NULL DEFAULT '{}',
  member_ids UUID[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS checklist_assignments_updated_at ON public.checklist_assignments;

CREATE TRIGGER checklist_assignments_updated_at
  BEFORE UPDATE ON public.checklist_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_checklist_assignments_template ON public.checklist_assignments(template_id, priority);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_group_type ON public.checklist_assignments(group_type);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_graduation_ids ON public.checklist_assignments USING gin(graduation_ids);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_member_ids ON public.checklist_assignments USING gin(member_ids);

UPDATE public.checklist_templates
SET usage_type = CASE
  WHEN lower(name) = 'prüfung' OR lower(name) = 'pruefung' OR is_default = true THEN 'exam'
  ELSE 'member'
END
WHERE usage_type = 'member';

INSERT INTO public.checklist_assignments (template_id, scope_type, priority, is_active)
SELECT template.id, 'all', 100, true
FROM public.checklist_templates template
WHERE NOT EXISTS (
  SELECT 1
  FROM public.checklist_assignments assignment
  WHERE assignment.template_id = template.id
);

CREATE OR REPLACE FUNCTION public.resolve_checklist_template_id(target_member_id UUID, desired_usage TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  resolved_template_id UUID;
BEGIN
  SELECT template.id
  INTO resolved_template_id
  FROM public.members member
  JOIN public.checklist_assignments assignment ON assignment.is_active = true
  JOIN public.checklist_templates template
    ON template.id = assignment.template_id
   AND template.is_active = true
   AND template.usage_type = desired_usage
  WHERE member.id = target_member_id
    AND (
      assignment.scope_type = 'all'
      OR (assignment.scope_type = 'group' AND assignment.group_type = member.group_type)
      OR (assignment.scope_type = 'graduation' AND member.graduation_id IS NOT NULL AND member.graduation_id = ANY(assignment.graduation_ids))
      OR (assignment.scope_type = 'member' AND member.id = ANY(assignment.member_ids))
    )
  ORDER BY
    CASE assignment.scope_type
      WHEN 'member' THEN 0
      WHEN 'graduation' THEN 1
      WHEN 'group' THEN 2
      ELSE 3
    END,
    assignment.priority,
    template.created_at
  LIMIT 1;

  RETURN resolved_template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_exam_checklist_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_template_id UUID;
BEGIN
  IF NEW.passed IS NULL THEN
    RETURN NEW;
  END IF;

  selected_template_id := public.resolve_checklist_template_id(NEW.member_id, 'exam');

  IF selected_template_id IS NULL THEN
    RAISE EXCEPTION 'Es ist keine Prüfungscheckliste für dieses Mitglied zugewiesen.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.checklist_items item
    LEFT JOIN public.member_checklist_status status
      ON status.checklist_item_id = item.id
      AND status.member_id = NEW.member_id
      AND status.exam_id = NEW.exam_id
      AND status.is_done = true
    WHERE item.template_id = selected_template_id
      AND status.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Die Prüfungscheckliste muss vollständig abgehakt sein, bevor ein Ergebnis gesetzt werden kann.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_exam_participant_checklists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_template_id UUID;
BEGIN
  selected_template_id := public.resolve_checklist_template_id(NEW.member_id, 'exam');

  IF selected_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.member_checklist_status (
    member_id,
    exam_id,
    checklist_item_id,
    is_done,
    done_at,
    done_by,
    notes
  )
  SELECT
    NEW.member_id,
    NEW.exam_id,
    item.id,
    false,
    null,
    null,
    null
  FROM public.checklist_items item
  WHERE item.template_id = selected_template_id
  ON CONFLICT (member_id, exam_id, checklist_item_id) DO NOTHING;

  RETURN NEW;
END;
$$;

INSERT INTO public.member_checklist_status (
  member_id,
  exam_id,
  checklist_item_id,
  is_done,
  done_at,
  done_by,
  notes
)
SELECT
  participant.member_id,
  participant.exam_id,
  item.id,
  false,
  null,
  null,
  null
FROM public.exam_participants participant
JOIN public.checklist_items item
  ON item.template_id = public.resolve_checklist_template_id(participant.member_id, 'exam')
ON CONFLICT (member_id, exam_id, checklist_item_id) DO NOTHING;

ALTER TABLE public.checklist_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_assignments_select_all" ON public.checklist_assignments;
DROP POLICY IF EXISTS "checklist_assignments_insert_trainer" ON public.checklist_assignments;
DROP POLICY IF EXISTS "checklist_assignments_update_trainer" ON public.checklist_assignments;
DROP POLICY IF EXISTS "checklist_assignments_delete_admin" ON public.checklist_assignments;

CREATE POLICY "checklist_assignments_select_all" ON public.checklist_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "checklist_assignments_insert_trainer" ON public.checklist_assignments
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_assignments_update_trainer" ON public.checklist_assignments
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'trainer'));

CREATE POLICY "checklist_assignments_delete_admin" ON public.checklist_assignments
  FOR DELETE USING (public.get_my_role() = 'admin');
