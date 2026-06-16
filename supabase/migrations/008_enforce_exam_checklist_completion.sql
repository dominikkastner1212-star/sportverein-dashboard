-- Block exam results until the default exam checklist is fully completed per participant.

CREATE OR REPLACE FUNCTION public.ensure_exam_checklist_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.passed IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.checklist_items item
    JOIN public.checklist_templates template ON template.id = item.template_id
    WHERE template.is_default = true
  ) THEN
    RAISE EXCEPTION 'Es ist keine Standard-Pruefungscheckliste hinterlegt.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.checklist_items item
    JOIN public.checklist_templates template ON template.id = item.template_id
    LEFT JOIN public.member_checklist_status status
      ON status.checklist_item_id = item.id
      AND status.member_id = NEW.member_id
      AND status.exam_id = NEW.exam_id
      AND status.is_done = true
    WHERE template.is_default = true
      AND status.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Die Pruefungscheckliste muss vollstaendig abgehakt sein, bevor ein Ergebnis gesetzt werden kann.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_exam_checklist_complete ON public.exam_participants;

CREATE TRIGGER ensure_exam_checklist_complete
  BEFORE INSERT OR UPDATE OF passed ON public.exam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_exam_checklist_complete();
