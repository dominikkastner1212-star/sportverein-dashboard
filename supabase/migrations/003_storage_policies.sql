-- ============================================================
-- Sportverein Dashboard — Storage Bucket Policies
-- Migration: 003_storage_policies
-- ============================================================

-- ─── AVATARS BUCKET ──────────────────────────────────────────
-- Run this in Supabase Dashboard → Storage → Create bucket named "avatars" (public: true)
-- Then apply these policies:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Avatars: public read
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Avatars: admin/trainer can upload
CREATE POLICY "avatars_insert_trainer" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND public.get_my_role() IN ('admin', 'trainer')
  );

-- Avatars: admin/trainer can update
CREATE POLICY "avatars_update_trainer" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND public.get_my_role() IN ('admin', 'trainer')
  );

-- Avatars: admin can delete
CREATE POLICY "avatars_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND public.get_my_role() = 'admin'
  );

-- ─── MEMBER DOCUMENTS BUCKET ─────────────────────────────────
-- Run this in Supabase Dashboard → Storage → Create bucket named "member-documents" (public: false)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-documents',
  'member-documents',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Documents: authenticated users can view (signed URLs only since bucket is private)
CREATE POLICY "documents_select_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'member-documents'
    AND auth.role() = 'authenticated'
  );

-- Documents: admin/trainer can upload
CREATE POLICY "documents_insert_trainer" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'member-documents'
    AND public.get_my_role() IN ('admin', 'trainer')
  );

-- Documents: admin/trainer can update
CREATE POLICY "documents_update_trainer" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'member-documents'
    AND public.get_my_role() IN ('admin', 'trainer')
  );

-- Documents: only admin can delete
CREATE POLICY "documents_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'member-documents'
    AND public.get_my_role() = 'admin'
  );
