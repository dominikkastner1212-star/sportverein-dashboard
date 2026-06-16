-- ============================================================
-- Sportverein Dashboard — Seed Data
-- Run AFTER migrations 001-003
-- ============================================================

-- ─── GRADUATIONS (Judo example — adapt for your sport) ───────

INSERT INTO public.graduations (name, color, border_color, rank_order, min_age, min_training_months) VALUES
  ('Weißer Gürtel',   '#f9fafb', '#d1d5db', 1,  null, null),
  ('Gelber Gürtel',   '#fefce8', '#eab308', 2,  8,    3),
  ('Orange Gürtel',   '#fff7ed', '#f97316', 3,  9,    6),
  ('Grüner Gürtel',   '#f0fdf4', '#16a34a', 4,  10,   12),
  ('Blauer Gürtel',   '#eff6ff', '#2563eb', 5,  12,   18),
  ('Brauner Gürtel',  '#fefce8', '#92400e', 6,  14,   24),
  ('Schwarzer Gürtel','#111827', '#111110', 7,  16,   36)
ON CONFLICT DO NOTHING;

-- ─── DEFAULT CHECKLIST TEMPLATE ──────────────────────────────

INSERT INTO public.checklist_templates (name, description, is_default) VALUES
  ('Standard-Prüfungscheckliste', 'Standardmäßig verwendete Checkliste für alle Prüfungen', true)
ON CONFLICT DO NOTHING;

-- Insert default checklist items
WITH tmpl AS (SELECT id FROM public.checklist_templates WHERE is_default = true LIMIT 1)
INSERT INTO public.checklist_items (template_id, label, is_required, sort_order) 
SELECT 
  tmpl.id,
  item.label,
  item.required,
  item.sort_order
FROM tmpl, (VALUES
  ('Prüfungsgebühr bezahlt',           true,  1),
  ('Sportlerpass vorhanden',           true,  2),
  ('Anmeldung abgegeben',              true,  3),
  ('Mindestalter erfüllt',             true,  4),
  ('Mindestwartezeit erfüllt',         true,  5),
  ('Trainingsstand geprüft',           false, 6),
  ('Einverständniserklärung vorhanden', true, 7),
  ('Prüfungsvoraussetzungen erfüllt',  true,  8)
) AS item(label, required, sort_order)
ON CONFLICT DO NOTHING;

-- ─── SAMPLE MEMBERS ──────────────────────────────────────────
-- NOTE: These are dummy members for testing only.
-- Real member data should be entered through the application.

WITH grad AS (SELECT id, name FROM public.graduations)
INSERT INTO public.members (
  first_name, last_name, gender, birth_date, entry_date,
  status, graduation_id, notes
) VALUES
  ('Anna',    'Müller',  'female', '1995-03-15', '2020-01-10', 'active',
   (SELECT id FROM grad WHERE name = 'Blauer Gürtel'),   'Sehr engagiert, regelmäßige Trainingsteilnahme'),
  ('Max',     'Schmidt', 'male',   '1988-07-22', '2019-06-01', 'active',
   (SELECT id FROM grad WHERE name = 'Schwarzer Gürtel'), 'Prüfer für Kinder-Prüfungen'),
  ('Lena',    'Weber',   'female', '2005-11-30', '2022-09-01', 'active',
   (SELECT id FROM grad WHERE name = 'Gelber Gürtel'),   null),
  ('Tom',     'Fischer', 'male',   '2000-04-18', '2021-03-15', 'active',
   (SELECT id FROM grad WHERE name = 'Grüner Gürtel'),   null),
  ('Sophie',  'Koch',    'female', '1992-08-05', '2018-11-20', 'paused',
   (SELECT id FROM grad WHERE name = 'Brauner Gürtel'),  'Pause wegen Elternzeit'),
  ('Felix',   'Bauer',   'male',   '2008-02-12', '2023-01-08', 'active',
   (SELECT id FROM grad WHERE name = 'Weißer Gürtel'),   null),
  ('Maria',   'Richter', 'female', '1979-12-01', '2015-04-01', 'active',
   (SELECT id FROM grad WHERE name = 'Schwarzer Gürtel'), 'Co-Trainerin'),
  ('Jonas',   'Klein',   'male',   '2003-09-25', '2020-08-10', 'active',
   (SELECT id FROM grad WHERE name = 'Grüner Gürtel'),   null),
  ('Sarah',   'Wolf',    'female', '1998-06-14', '2022-02-01', 'active',
   (SELECT id FROM grad WHERE name = 'Orange Gürtel'),   null),
  ('David',   'Schäfer', 'male',   '2010-01-20', '2023-09-01', 'active',
   (SELECT id FROM grad WHERE name = 'Weißer Gürtel'),   'Elternkontakt: Herr Schäfer, 0170-1234567')
ON CONFLICT DO NOTHING;

-- ─── SAMPLE EXAM ─────────────────────────────────────────────

INSERT INTO public.exams (title, date, time, location, description, status) VALUES
  (
    'Gürtelprüfung Frühjahr 2025',
    CURRENT_DATE + INTERVAL '30 days',
    '14:00:00',
    'Sporthalle am Marktplatz',
    'Jährliche Frühjahrs-Gürtelprüfung für alle Graduierungen.',
    'planned'
  )
ON CONFLICT DO NOTHING;
