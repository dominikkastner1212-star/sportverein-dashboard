-- Prefer the checklist template named "Prüfung" for exams, then fall back to the default template.

CREATE OR REPLACE FUNCTION public.get_exam_checklist_template_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM public.checklist_templates
  ORDER BY
    CASE
      WHEN lower(name) = 'prüfung' OR lower(name) = 'pruefung' THEN 0
      WHEN is_default THEN 1
      ELSE 2
    END,
    created_at
  LIMIT 1
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

  selected_template_id := public.get_exam_checklist_template_id();

  IF selected_template_id IS NULL THEN
    RAISE EXCEPTION 'Es ist keine Prüfungscheckliste hinterlegt.';
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
  selected_template_id := public.get_exam_checklist_template_id();

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
JOIN public.checklist_items item ON item.template_id = public.get_exam_checklist_template_id()
ON CONFLICT (member_id, exam_id, checklist_item_id) DO NOTHING;
