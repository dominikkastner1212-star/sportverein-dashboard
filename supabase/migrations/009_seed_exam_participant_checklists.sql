-- Create per-participant checklist rows automatically for every exam participant.

CREATE OR REPLACE FUNCTION public.seed_exam_participant_checklists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
  JOIN public.checklist_templates template ON template.id = item.template_id
  WHERE template.is_default = true
  ON CONFLICT (member_id, exam_id, checklist_item_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_exam_participant_checklists ON public.exam_participants;

CREATE TRIGGER seed_exam_participant_checklists
  AFTER INSERT ON public.exam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_exam_participant_checklists();

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
JOIN public.checklist_items item ON true
JOIN public.checklist_templates template ON template.id = item.template_id
WHERE template.is_default = true
ON CONFLICT (member_id, exam_id, checklist_item_id) DO NOTHING;
