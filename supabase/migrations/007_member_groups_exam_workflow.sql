-- Sportverein Dashboard - Member groups, last exam date and checklist cleanup

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'youth_adults'
  CHECK (group_type IN ('children', 'youth_adults'));

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS last_exam_date DATE;

CREATE INDEX IF NOT EXISTS idx_members_group_type ON public.members(group_type);
CREATE INDEX IF NOT EXISTS idx_members_last_exam_date ON public.members(last_exam_date);

WITH latest_history AS (
  SELECT member_id, max(date) AS last_date
  FROM public.exam_history
  GROUP BY member_id
)
UPDATE public.members member
SET last_exam_date = latest_history.last_date
FROM latest_history
WHERE member.id = latest_history.member_id
  AND member.last_exam_date IS NULL;

WITH default_template AS (
  SELECT id
  FROM public.checklist_templates
  WHERE is_default = true
  ORDER BY created_at
  LIMIT 1
),
desired_items AS (
  SELECT *
  FROM (VALUES
    ('Pruefungsgebuehr bezahlt', 'Gebuehr fuer die Pruefung ist bezahlt.', true, 1),
    ('Sportpass vorhanden', 'Sportpass liegt vor oder ist digital nachgewiesen.', true, 2),
    ('Guertellaenge geprueft', 'Neue Guertellaenge wurde geprueft.', true, 3),
    ('Gurtgebuehr bezahlt', 'Gebuehr fuer den neuen Gurt ist bezahlt.', true, 4)
  ) AS item(label, description, is_required, sort_order)
)
INSERT INTO public.checklist_items (template_id, label, description, is_required, sort_order)
SELECT default_template.id, desired_items.label, desired_items.description, desired_items.is_required, desired_items.sort_order
FROM default_template, desired_items
WHERE NOT EXISTS (
  SELECT 1
  FROM public.checklist_items existing
  WHERE existing.template_id = default_template.id
    AND existing.label = desired_items.label
);

WITH default_template AS (
  SELECT id
  FROM public.checklist_templates
  WHERE is_default = true
  ORDER BY created_at
  LIMIT 1
),
legacy_items AS (
  SELECT *
  FROM (VALUES
    ('Pruefungsgebuehr bezahlt'),
    ('Prüfungsgebühr bezahlt'),
    ('PrÃ¼fungsgebÃ¼hr bezahlt'),
    ('Sportlerpass vorhanden'),
    ('Anmeldung abgegeben'),
    ('Mindestalter erfuellt'),
    ('Mindestalter erfüllt'),
    ('Mindestalter erfÃ¼llt'),
    ('Mindestwartezeit erfuellt'),
    ('Mindestwartezeit erfüllt'),
    ('Mindestwartezeit erfÃ¼llt'),
    ('Trainingsstand geprueft'),
    ('Trainingsstand geprüft'),
    ('Trainingsstand geprÃ¼ft'),
    ('Einverstaendniserklaerung vorhanden'),
    ('Einverständniserklärung vorhanden'),
    ('EinverstÃ¤ndniserklÃ¤rung vorhanden'),
    ('Pruefungsvoraussetzungen erfuellt'),
    ('Prüfungsvoraussetzungen erfüllt'),
    ('PrÃ¼fungsvoraussetzungen erfÃ¼llt')
  ) AS item(label)
),
desired_labels AS (
  SELECT *
  FROM (VALUES
    ('Pruefungsgebuehr bezahlt'),
    ('Sportpass vorhanden'),
    ('Guertellaenge geprueft'),
    ('Gurtgebuehr bezahlt')
  ) AS item(label)
)
DELETE FROM public.checklist_items checklist_item
USING default_template, legacy_items
WHERE checklist_item.template_id = default_template.id
  AND checklist_item.label = legacy_items.label
  AND NOT EXISTS (
    SELECT 1
    FROM desired_labels
    WHERE desired_labels.label = checklist_item.label
  );
