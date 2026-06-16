-- ============================================================
-- Sportverein Dashboard - Graduation Levels: Mini KUP, KUP, Dan
-- Run after 001_initial_schema.sql.
-- ============================================================

INSERT INTO public.graduations (name, color, border_color, rank_order, min_age, min_training_months)
SELECT *
FROM (VALUES
  -- Kinder: Mini KUP 1-4
  ('Mini KUP 1', '#f9fafb', '#d1d5db', 1, null, null),
  ('Mini KUP 2', '#f9fafb', '#d1d5db', 2, null, null),
  ('Mini KUP 3', '#f9fafb', '#d1d5db', 3, null, null),
  ('Mini KUP 4', '#f9fafb', '#d1d5db', 4, null, null),

  -- Erwachsene: 10. KUP bis 1. KUP
  ('10. KUP Weiss', '#f9fafb', '#d1d5db', 10, null, null),
  ('9. KUP Weiss-Gelb', '#fefce8', '#eab308', 11, null, null),
  ('8. KUP Gelb', '#fefce8', '#eab308', 12, null, null),
  ('7. KUP Gelb-Gruen', '#f0fdf4', '#16a34a', 13, null, null),
  ('6. KUP Gruen', '#f0fdf4', '#16a34a', 14, null, null),
  ('5. KUP Gruen-Blau', '#eff6ff', '#2563eb', 15, null, null),
  ('4. KUP Blau', '#eff6ff', '#2563eb', 16, null, null),
  ('3. KUP Blau-Rot', '#fef2f2', '#dc2626', 17, null, null),
  ('2. KUP Rot', '#fef2f2', '#dc2626', 18, null, null),
  ('1. KUP Rot-Schwarz', '#111827', '#111827', 19, null, null),

  -- Dan Grade
  ('1. Dan Schwarz', '#111827', '#111827', 21, null, null),
  ('2. Dan Schwarz', '#111827', '#111827', 22, null, null),
  ('3. Dan Schwarz', '#111827', '#111827', 23, null, null),
  ('4. Dan Schwarz', '#111827', '#111827', 24, null, null),
  ('5. Dan Schwarz', '#111827', '#111827', 25, null, null),
  ('6. Dan Schwarz', '#111827', '#111827', 26, null, null),
  ('7. Dan Schwarz', '#111827', '#111827', 27, null, null),
  ('8. Dan Schwarz', '#111827', '#111827', 28, null, null),
  ('9. Dan Schwarz', '#111827', '#111827', 29, null, null)
) AS desired(name, color, border_color, rank_order, min_age, min_training_months)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.graduations existing
  WHERE existing.name = desired.name
);

-- Remove old default seed levels when they are not used by members.
DELETE FROM public.graduations g
WHERE g.name IN (
  'Weisser Guertel',
  'Gelber Guertel',
  'Orange Guertel',
  'Gruener Guertel',
  'Blauer Guertel',
  'Brauner Guertel',
  'Schwarzer Guertel',
  'Weißer Gürtel',
  'Gelber Gürtel',
  'Orange Gürtel',
  'Grüner Gürtel',
  'Blauer Gürtel',
  'Brauner Gürtel',
  'Schwarzer Gürtel'
)
AND NOT EXISTS (
  SELECT 1 FROM public.members m WHERE m.graduation_id = g.id
);
