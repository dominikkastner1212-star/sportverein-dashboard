-- ============================================================
-- Sportverein Dashboard - Fix primary belt color for combo grades
-- Migration 012 added secondary_color but left border_color
-- pointing at the OLD (second) color, so primary == secondary
-- and the split rendered as solid. This corrects border_color
-- to the actual first/primary color for each combo belt.
-- ============================================================

UPDATE public.graduations SET border_color = '#d1d5db' WHERE name = '9. KUP Weiss-Gelb';
UPDATE public.graduations SET border_color = '#eab308' WHERE name = '7. KUP Gelb-Gruen';
UPDATE public.graduations SET border_color = '#16a34a' WHERE name = '5. KUP Gruen-Blau';
UPDATE public.graduations SET border_color = '#2563eb' WHERE name = '3. KUP Blau-Rot';
UPDATE public.graduations SET border_color = '#dc2626' WHERE name = '1. KUP Rot-Schwarz';
