-- Local fixtures only. This file and the migration test setup roll back together.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(24);

SELECT ok(has_table_privilege('authenticated', 'public.saved_items', 'SELECT'), 'Students can read saved rows');
SELECT ok(has_table_privilege('authenticated', 'public.saved_items', 'INSERT'), 'Students can create saved rows');
SELECT ok(has_table_privilege('authenticated', 'public.saved_items', 'DELETE'), 'Students can remove saved rows');
SELECT ok(NOT has_table_privilege('authenticated', 'public.saved_items', 'UPDATE'), 'No direct update permission is added');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.saved_items'::regclass), 'Saved items still enforce RLS');

INSERT INTO auth.users (id, email) VALUES
  ('a5555555-5555-4555-8555-555555555555', 'saved_test_a@northeastern.edu'),
  ('b5555555-5555-4555-8555-555555555555', 'saved_test_b@northeastern.edu');
INSERT INTO public.listings (id, seller_id, title, status) VALUES
  ('c5555555-5555-4555-8555-555555555555', 'b5555555-5555-4555-8555-555555555555', 'Saved fixture A', 'approved'),
  ('d5555555-5555-4555-8555-555555555555', 'b5555555-5555-4555-8555-555555555555', 'Saved fixture B', 'approved');
INSERT INTO public.saved_items (user_id, listing_id) VALUES
  ('b5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555');
UPDATE private.device_verification_settings SET enabled = true;
INSERT INTO private.verified_sessions (session_id, user_id, expires_at) VALUES
  ('a6666666-6666-4666-8666-666666666666', 'a5555555-5555-4555-8555-555555555555', now() + interval '1 day'),
  ('b6666666-6666-4666-8666-666666666666', 'b5555555-5555-4555-8555-555555555555', now() + interval '1 day');

SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.saved_items$$, '42501', NULL, 'Signed-out reads are denied');
SELECT throws_ok($$INSERT INTO public.saved_items (user_id, listing_id) VALUES ('a5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555')$$, '42501', NULL, 'Signed-out inserts are denied');
SELECT throws_ok($$DELETE FROM public.saved_items$$, '42501', NULL, 'Signed-out deletes are denied');
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"a5555555-5555-4555-8555-555555555555","role":"authenticated","session_id":"a6666666-6666-4666-8666-666666666666"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.saved_items), 0::bigint, 'A cannot read B saves');
SELECT lives_ok($$INSERT INTO public.saved_items (user_id, listing_id) VALUES ('a5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555')$$, 'A can save a listing');
SELECT is((SELECT count(*) FROM public.saved_items), 1::bigint, 'A sees only their save');
SELECT throws_ok($$INSERT INTO public.saved_items (user_id, listing_id) VALUES ('a5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555')$$, '23505', NULL, 'Duplicate saves are rejected');
SELECT throws_ok($$INSERT INTO public.saved_items (user_id, listing_id) VALUES ('b5555555-5555-4555-8555-555555555555', 'd5555555-5555-4555-8555-555555555555')$$, '42501', NULL, 'A cannot insert a save for B');
SELECT throws_ok($$UPDATE public.saved_items SET user_id = 'b5555555-5555-4555-8555-555555555555'$$, '42501', NULL, 'A cannot reassign saved rows');
DELETE FROM public.saved_items WHERE user_id = 'b5555555-5555-4555-8555-555555555555';
RESET ROLE;
SELECT is((SELECT count(*) FROM public.saved_items WHERE user_id = 'b5555555-5555-4555-8555-555555555555'), 1::bigint, 'A did not delete B save');
SET LOCAL ROLE authenticated;
SELECT lives_ok($$DELETE FROM public.saved_items WHERE user_id = 'a5555555-5555-4555-8555-555555555555'$$, 'A can remove their save');
SELECT is((SELECT count(*) FROM public.saved_items), 0::bigint, 'A no longer sees the removed save');
RESET ROLE;
SELECT is((SELECT count(*) FROM public.saved_items), 1::bigint, 'Only B save remains');

INSERT INTO public.saved_items (user_id, listing_id) VALUES ('a5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555');
SELECT set_config('request.jwt.claims', '{"sub":"a5555555-5555-4555-8555-555555555555","role":"authenticated","session_id":"e6666666-6666-4666-8666-666666666666"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.saved_items), 0::bigint, 'An unverified device cannot read saves');
SELECT throws_ok($$INSERT INTO public.saved_items (user_id, listing_id) VALUES ('a5555555-5555-4555-8555-555555555555', 'd5555555-5555-4555-8555-555555555555')$$, '42501', NULL, 'An unverified device cannot insert saves');
DELETE FROM public.saved_items WHERE user_id = 'a5555555-5555-4555-8555-555555555555';
RESET ROLE;
SELECT is((SELECT count(*) FROM public.saved_items WHERE user_id = 'a5555555-5555-4555-8555-555555555555'), 1::bigint, 'An unverified device cannot delete a save');

SELECT set_config('request.jwt.claims', '{"sub":"b5555555-5555-4555-8555-555555555555","role":"authenticated","session_id":"b6666666-6666-4666-8666-666666666666"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.saved_items), 1::bigint, 'B sees only their own save');
SELECT is((SELECT count(*) FROM public.saved_items WHERE user_id = 'a5555555-5555-4555-8555-555555555555'), 0::bigint, 'B cannot read A save');
RESET ROLE;
DELETE FROM public.listings WHERE id = 'c5555555-5555-4555-8555-555555555555';
SELECT is((SELECT count(*) FROM public.saved_items WHERE listing_id = 'c5555555-5555-4555-8555-555555555555'), 0::bigint, 'Deleting the listing cascades to both saved references');

SELECT * FROM finish();
ROLLBACK;
