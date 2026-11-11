-- Profile permissions and validation (#20).
-- Run with: npx supabase@3.0.0 test db
-- Everything runs inside a transaction that is rolled back at the end.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(17);

-- Two test students. Inserting into auth.users runs handle_new_user,
-- which creates a profile for each one.
INSERT INTO auth.users (id, email)
VALUES
  ('a1111111-1111-4111-8111-111111111111', 'profile_test_a@northeastern.edu'),
  ('b2222222-2222-4222-8222-222222222222', 'profile_test_b@northeastern.edu');

-- Signed-out visitors ---------------------------------------------------------

SET LOCAL ROLE anon;

SELECT throws_ok(
  $$ SELECT * FROM public.profiles $$,
  '42501', NULL,
  'signed-out visitors cannot read profiles'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET bio = 'hi' $$,
  '42501', NULL,
  'signed-out visitors cannot update profiles'
);

RESET ROLE;

-- Signed in as student A ------------------------------------------------------

SELECT set_config('request.jwt.claims', '{"sub": "a1111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*) FROM public.profiles WHERE user_id = 'b2222222-2222-4222-8222-222222222222'),
  1::bigint,
  'signed-in students can read other students'' profiles'
);

UPDATE public.profiles SET display_name = 'Test Student A'
  WHERE user_id = 'a1111111-1111-4111-8111-111111111111';

SELECT is(
  (SELECT display_name FROM public.profiles WHERE user_id = 'a1111111-1111-4111-8111-111111111111'),
  'Test Student A',
  'students can update their own profile'
);

UPDATE public.profiles SET display_name = 'Not Allowed'
  WHERE user_id = 'b2222222-2222-4222-8222-222222222222';

SELECT is(
  (SELECT display_name FROM public.profiles WHERE user_id = 'b2222222-2222-4222-8222-222222222222'),
  NULL::text,
  'students cannot update someone else''s profile'
);

-- Protected columns -----------------------------------------------------------

SELECT throws_ok(
  $$ UPDATE public.profiles SET created_at = now() WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '42501', NULL,
  'students cannot edit created_at'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET updated_at = now() WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '42501', NULL,
  'students cannot edit updated_at'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET user_id = 'b2222222-2222-4222-8222-222222222222' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '42501', NULL,
  'students cannot change user_id'
);

-- Validation rules ------------------------------------------------------------

SELECT throws_ok(
  $$ UPDATE public.profiles SET display_name = '   ' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'display names cannot be only spaces'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET display_name = ' Simran' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'display names cannot start or end with spaces'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET display_name = 'S' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'display names need at least 2 characters'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET display_name = repeat('a', 61) WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'display names can be at most 60 characters'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET bio = repeat('a', 201) WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'bios can be at most 200 characters'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET campus_area = 'Back Bay' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  '23514', NULL,
  'campus area must be one of the dropdown values'
);

SELECT lives_ok(
  $$ UPDATE public.profiles SET campus_area = 'Fenway' WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  'dropdown campus areas are accepted'
);

SELECT lives_ok(
  $$ UPDATE public.profiles SET campus_area = NULL WHERE user_id = 'a1111111-1111-4111-8111-111111111111' $$,
  'campus area is optional'
);

-- updated_at trigger ----------------------------------------------------------

RESET ROLE;

ALTER TABLE public.profiles DISABLE TRIGGER set_profiles_updated_at;
UPDATE public.profiles SET updated_at = '2000-01-01 00:00:00+00'
  WHERE user_id = 'a1111111-1111-4111-8111-111111111111';
ALTER TABLE public.profiles ENABLE TRIGGER set_profiles_updated_at;

SET LOCAL ROLE authenticated;

UPDATE public.profiles SET bio = 'Selling dorm stuff'
  WHERE user_id = 'a1111111-1111-4111-8111-111111111111';

SELECT ok(
  (SELECT updated_at FROM public.profiles WHERE user_id = 'a1111111-1111-4111-8111-111111111111') > '2000-01-02 00:00:00+00',
  'editing a profile updates updated_at'
);

SELECT * FROM finish();

ROLLBACK;