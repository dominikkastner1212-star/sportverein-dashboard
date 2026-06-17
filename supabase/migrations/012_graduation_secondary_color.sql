-- ============================================================
-- Sportverein Dashboard - Secondary belt color for combo grades
-- Adds secondary_color so two-tone belts (e.g. "Gruen-Blau")
-- can show both halves instead of only the border_color.
-- border_color stays the PRIMARY color, secondary_color is
-- the SECOND color (null for solid belts).
-- ============================================================

ALTER TABLE public.graduations
  ADD COLUMN IF NOT EXISTS secondary_color TEXT;

UPDATE public.graduations SET secondary_color = '#eab308' WHERE name = '9. KUP Weiss-Gelb';
UPDATE public.graduations SET secondary_color = '#16a34a' WHERE name = '7. KUP Gelb-Gruen';
UPDATE public.graduations SET secondary_color = '#2563eb' WHERE name = '5. KUP Gruen-Blau';
UPDATE public.graduations SET secondary_color = '#dc2626' WHERE name = '3. KUP Blau-Rot';
UPDATE public.graduations SET secondary_color = '#111110' WHERE name = '1. KUP Rot-Schwarz';
