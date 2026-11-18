-- Profile photos: verified students can view; only the owner can replace/remove.
-- A fixed object path avoids orphan files and needs no new profile columns.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', false, 262144, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Verified students can view profile photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND (SELECT private.device_access_allowed()));

CREATE POLICY "Students can upload their own profile photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND name = (SELECT auth.uid()::text) || '/avatar.webp'
  AND (SELECT private.device_access_allowed())
);

CREATE POLICY "Students can replace their own profile photo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name = (SELECT auth.uid()::text) || '/avatar.webp'
  AND (SELECT private.device_access_allowed())
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND name = (SELECT auth.uid()::text) || '/avatar.webp'
  AND (SELECT private.device_access_allowed())
);

CREATE POLICY "Students can remove their own profile photo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND name = (SELECT auth.uid()::text) || '/avatar.webp'
  AND (SELECT private.device_access_allowed())
);
