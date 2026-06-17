-- ============================================================
-- Sportverein Dashboard - Seed Data
-- Run AFTER migrations
-- ============================================================

INSERT INTO public.graduations (name, color, border_color, secondary_color, rank_order, min_age, min_training_months) VALUES
  ('Mini KUP 1', '#f9fafb', '#d1d5db', null, 1, null, null),
  ('Mini KUP 2', '#f9fafb', '#d1d5db', null, 2, null, null),
  ('Mini KUP 3', '#f9fafb', '#d1d5db', null, 3, null, null),
  ('Mini KUP 4', '#f9fafb', '#d1d5db', null, 4, null, null),
  ('10. KUP Weiss', '#f9fafb', '#d1d5db', null, 10, null, null),
  ('9. KUP Weiss-Gelb', '#fefce8', '#d1d5db', '#eab308', 11, null, null),
  ('8. KUP Gelb', '#fefce8', '#eab308', null, 12, null, null),
  ('7. KUP Gelb-Gruen', '#f0fdf4', '#eab308', '#16a34a', 13, null, null),
  ('6. KUP Gruen', '#f0fdf4', '#16a34a', null, 14, null, null),
  ('5. KUP Gruen-Blau', '#eff6ff', '#16a34a', '#2563eb', 15, null, null),
  ('4. KUP Blau', '#eff6ff', '#2563eb', null, 16, null, null),
  ('3. KUP Blau-Rot', '#fef2f2', '#2563eb', '#dc2626', 17, null, null),
  ('2. KUP Rot', '#fef2f2', '#dc2626', null, 18, null, null),
  ('1. KUP Rot-Schwarz', '#111827', '#dc2626', '#111110', 19, null, null),
  ('1. Dan Schwarz', '#111827', '#111827', null, 21, null, null),
  ('2. Dan Schwarz', '#111827', '#111827', null, 22, null, null),
  ('3. Dan Schwarz', '#111827', '#111827', null, 23, null, null),
  ('4. Dan Schwarz', '#111827', '#111827', null, 24, null, null),
  ('5. Dan Schwarz', '#111827', '#111827', null, 25, null, null),
  ('6. Dan Schwarz', '#111827', '#111827', null, 26, null, null),
  ('7. Dan Schwarz', '#111827', '#111827', null, 27, null, null),
  ('8. Dan Schwarz', '#111827', '#111827', null, 28, null, null),
  ('9. Dan Schwarz', '#111827', '#111827', null, 29, null, null)
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_templates (name, description, is_default) VALUES
  ('Standard-Pruefungscheckliste', 'Standardmaessig verwendete Checkliste fuer alle Pruefungen', true)
ON CONFLICT DO NOTHING;

WITH tmpl AS (SELECT id FROM public.checklist_templates WHERE is_default = true LIMIT 1)
INSERT INTO public.checklist_items (template_id, label, is_required, sort_order)
SELECT
  tmpl.id,
  item.label,
  item.required,
  item.sort_order
FROM tmpl, (VALUES
  ('Pruefungsgebuehr bezahlt', true, 1),
  ('Sportpass vorhanden', true, 2),
  ('Guertellaenge geprueft', true, 3),
  ('Gurtgebuehr bezahlt', true, 4)
) AS item(label, required, sort_order)
ON CONFLICT DO NOTHING;

WITH grad AS (SELECT id, name FROM public.graduations)
INSERT INTO public.members (
  first_name, last_name, gender, birth_date, entry_date,
  status, group_type, graduation_id, notes
) VALUES
  ('Anna', 'Mueller', 'female', '1995-03-15', '2020-01-10', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '4. KUP Blau'), 'Sehr engagiert, regelmaessige Trainingsteilnahme'),
  ('Max', 'Schmidt', 'male', '1988-07-22', '2019-06-01', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '1. Dan Schwarz'), 'Pruefer fuer Kinder-Pruefungen'),
  ('Lena', 'Weber', 'female', '2005-11-30', '2022-09-01', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '8. KUP Gelb'), null),
  ('Tom', 'Fischer', 'male', '2000-04-18', '2021-03-15', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '6. KUP Gruen'), null),
  ('Sophie', 'Koch', 'female', '1992-08-05', '2018-11-20', 'paused', 'youth_adults',
   (SELECT id FROM grad WHERE name = '2. KUP Rot'), 'Pause wegen Elternzeit'),
  ('Felix', 'Bauer', 'male', '2008-02-12', '2023-01-08', 'active', 'children',
   (SELECT id FROM grad WHERE name = 'Mini KUP 2'), null),
  ('Maria', 'Richter', 'female', '1979-12-01', '2015-04-01', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '2. Dan Schwarz'), 'Co-Trainerin'),
  ('Jonas', 'Klein', 'male', '2003-09-25', '2020-08-10', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '6. KUP Gruen'), null),
  ('Sarah', 'Wolf', 'female', '1998-06-14', '2022-02-01', 'active', 'youth_adults',
   (SELECT id FROM grad WHERE name = '7. KUP Gelb-Gruen'), null),
  ('David', 'Schaefer', 'male', '2010-01-20', '2023-09-01', 'active', 'children',
   (SELECT id FROM grad WHERE name = 'Mini KUP 1'), 'Elternkontakt: Herr Schaefer, 0170-1234567')
ON CONFLICT DO NOTHING;

INSERT INTO public.exams (title, date, time, location, description, status) VALUES
  (
    'Guertelpruefung Fruehjahr 2025',
    CURRENT_DATE + INTERVAL '30 days',
    '14:00:00',
    'Sporthalle am Marktplatz',
    'Jaehrliche Fruehjahrs-Guertelpruefung fuer alle Graduierungen.',
    'planned'
  )
ON CONFLICT DO NOTHING;
