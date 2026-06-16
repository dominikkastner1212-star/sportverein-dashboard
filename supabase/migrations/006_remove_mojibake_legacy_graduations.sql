-- ============================================================
-- Sportverein Dashboard - Remove mojibake legacy graduations
-- Run after 004_update_graduations_kup_dan.sql.
-- ============================================================

INSERT INTO public.graduations (name, color, border_color, rank_order, min_age, min_training_months)
SELECT
  desired.name,
  desired.color,
  desired.border_color,
  desired.rank_order::integer,
  desired.min_age::integer,
  desired.min_training_months::integer
FROM (VALUES
  ('Mini KUP 1', '#f9fafb', '#d1d5db', 1, null, null),
  ('Mini KUP 2', '#f9fafb', '#d1d5db', 2, null, null),
  ('Mini KUP 3', '#f9fafb', '#d1d5db', 3, null, null),
  ('Mini KUP 4', '#f9fafb', '#d1d5db', 4, null, null),
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
  SELECT 1 FROM public.graduations existing WHERE existing.name = desired.name
);

WITH legacy_map(old_name, new_name) AS (
  VALUES
    ('WeiÃŸer GÃ¼rtel', '10. KUP Weiss'),
    ('Gelber GÃ¼rtel', '8. KUP Gelb'),
    ('Orange GÃ¼rtel', '7. KUP Gelb-Gruen'),
    ('GrÃ¼ner GÃ¼rtel', '6. KUP Gruen'),
    ('Blauer GÃ¼rtel', '4. KUP Blau'),
    ('Brauner GÃ¼rtel', '2. KUP Rot'),
    ('Schwarzer GÃ¼rtel', '1. Dan Schwarz'),
    ('Weisser Guertel', '10. KUP Weiss'),
    ('Gelber Guertel', '8. KUP Gelb'),
    ('Orange Guertel', '7. KUP Gelb-Gruen'),
    ('Gruener Guertel', '6. KUP Gruen'),
    ('Blauer Guertel', '4. KUP Blau'),
    ('Brauner Guertel', '2. KUP Rot'),
    ('Schwarzer Guertel', '1. Dan Schwarz'),
    ('Weißer Gürtel', '10. KUP Weiss'),
    ('Gelber Gürtel', '8. KUP Gelb'),
    ('Orange Gürtel', '7. KUP Gelb-Gruen'),
    ('Grüner Gürtel', '6. KUP Gruen'),
    ('Blauer Gürtel', '4. KUP Blau'),
    ('Brauner Gürtel', '2. KUP Rot'),
    ('Schwarzer Gürtel', '1. Dan Schwarz')
),
targets AS (
  SELECT legacy.id AS old_id, target.id AS new_id
  FROM legacy_map
  JOIN public.graduations legacy ON legacy.name = legacy_map.old_name
  JOIN public.graduations target ON target.name = legacy_map.new_name
)
UPDATE public.members member
SET graduation_id = targets.new_id
FROM targets
WHERE member.graduation_id = targets.old_id;

WITH legacy_names(name) AS (
  VALUES
    ('WeiÃŸer GÃ¼rtel'),
    ('Gelber GÃ¼rtel'),
    ('Orange GÃ¼rtel'),
    ('GrÃ¼ner GÃ¼rtel'),
    ('Blauer GÃ¼rtel'),
    ('Brauner GÃ¼rtel'),
    ('Schwarzer GÃ¼rtel'),
    ('Weisser Guertel'),
    ('Gelber Guertel'),
    ('Orange Guertel'),
    ('Gruener Guertel'),
    ('Blauer Guertel'),
    ('Brauner Guertel'),
    ('Schwarzer Guertel'),
    ('Weißer Gürtel'),
    ('Gelber Gürtel'),
    ('Orange Gürtel'),
    ('Grüner Gürtel'),
    ('Blauer Gürtel'),
    ('Brauner Gürtel'),
    ('Schwarzer Gürtel')
)
DELETE FROM public.graduations graduation
USING legacy_names
WHERE graduation.name = legacy_names.name
AND NOT EXISTS (
  SELECT 1 FROM public.members member WHERE member.graduation_id = graduation.id
);
