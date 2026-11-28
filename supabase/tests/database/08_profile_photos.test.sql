-- Local fixtures only; every change rolls back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(21);
-- Match the Storage API's deletion context; RLS remains enabled.
SET LOCAL storage.allow_delete_query = 'true';
SELECT is((SELECT public FROM storage.buckets WHERE id='profile-photos'),false,'Profile bucket is private');
SELECT is((SELECT file_size_limit FROM storage.buckets WHERE id='profile-photos'),262144::bigint,'Photos are limited to 256 KB');
SELECT is((SELECT allowed_mime_types FROM storage.buckets WHERE id='profile-photos'),ARRAY['image/webp'],'Only WebP is accepted');
UPDATE private.device_verification_settings SET enabled=true;
INSERT INTO auth.users(id,email) VALUES
 ('a8888888-8888-4888-8888-888888888888','photo_a@northeastern.edu'),
 ('b8888888-8888-4888-8888-888888888888','photo_b@northeastern.edu');
SELECT set_config('request.jwt.claims','{"sub":"a8888888-8888-4888-8888-888888888888","session_id":"a9999999-9999-4999-8999-999999999999","amr":[{"method":"password"}]}',true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id='profile-photos'),0::bigint,'Unverified sessions cannot read photos');
SELECT throws_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','a8888888-8888-4888-8888-888888888888/avatar.webp')$$,'42501',NULL,'Unverified sessions cannot upload');
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub','a8888888-8888-4888-8888-888888888888','session_id','a9999999-9999-4999-8999-999999999999','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now()))))::text,true);
SET LOCAL ROLE authenticated;
SELECT is(public.confirm_device_session(repeat('a',64),true),true,'Email proof verifies photo owner');
SELECT lives_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','a8888888-8888-4888-8888-888888888888/avatar.webp')$$,'Owner can upload their photo');
SELECT throws_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','a8888888-8888-4888-8888-888888888888/other.webp')$$,'42501',NULL,'Arbitrary object paths are blocked');
SELECT throws_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','b8888888-8888-4888-8888-888888888888/avatar.webp')$$,'42501',NULL,'Another account folder is blocked');
SELECT lives_ok($$UPDATE storage.objects SET metadata='{"kind":"owner"}' WHERE bucket_id='profile-photos' AND name='a8888888-8888-4888-8888-888888888888/avatar.webp'$$,'Owner can replace their photo');
SELECT throws_ok($$UPDATE storage.objects SET name='b8888888-8888-4888-8888-888888888888/avatar.webp' WHERE bucket_id='profile-photos'$$,'42501',NULL,'Photo cannot be moved to another account');
SELECT lives_ok($$UPDATE public.profiles SET username='Photo_Student' WHERE user_id='a8888888-8888-4888-8888-888888888888'$$,'Owner can choose a unique username');
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub','b8888888-8888-4888-8888-888888888888','session_id','b9999999-9999-4999-8999-999999999999','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now()))))::text,true);
SET LOCAL ROLE authenticated;
SELECT is(public.confirm_device_session(repeat('b',64),true),true,'Email proof verifies second student');
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id='profile-photos'),1::bigint,'Verified students can view a profile photo');
UPDATE storage.objects SET metadata='{"kind":"other"}' WHERE bucket_id='profile-photos';
SELECT is((SELECT metadata->>'kind' FROM storage.objects WHERE bucket_id='profile-photos'),'owner','Other students cannot replace the photo');
DELETE FROM storage.objects WHERE bucket_id='profile-photos';
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id='profile-photos'),1::bigint,'Other students cannot delete the photo');
SELECT throws_ok($$UPDATE public.profiles SET username='photo_STUDENT' WHERE user_id='b8888888-8888-4888-8888-888888888888'$$,'23505',NULL,'Username uniqueness ignores capitalization');
RESET ROLE;
UPDATE private.verified_sessions SET expires_at=now()-interval '1 day' WHERE user_id='b8888888-8888-4888-8888-888888888888';
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id='profile-photos'),0::bigint,'Expired verification cannot read photos');
SELECT throws_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','b8888888-8888-4888-8888-888888888888/avatar.webp')$$,'42501',NULL,'Expired verification cannot upload');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id='profile-photos'),0::bigint,'Signed-out visitors cannot read photos');
SELECT throws_ok($$INSERT INTO storage.objects(bucket_id,name) VALUES('profile-photos','b8888888-8888-4888-8888-888888888888/avatar.webp')$$,'42501',NULL,'Signed-out visitors cannot upload');
SELECT * FROM finish();
ROLLBACK;
