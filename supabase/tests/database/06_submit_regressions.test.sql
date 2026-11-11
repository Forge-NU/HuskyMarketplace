-- Regressions found in review of #40:
--   1. Submitting again after auto-approval used to raise an error.
--   2. A draft could be submitted after one of its photo files was deleted.
-- Auto-approve stays on here. It's for the demo.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

-- Test data
-- Student A has two drafts:
--   1. One photo, and its file exists.
--   2. Two photos, but the second photo's file was deleted.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu');

insert into public.listings (id, seller_id, title, status) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000', 'A complete draft', 'draft'),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000', 'A draft missing a file', 'draft');

insert into storage.buckets (id, name) values ('listing-photos', 'listing-photos')
  on conflict (id) do nothing;
insert into storage.objects (bucket_id, name) values
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp'),
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/1.webp');

insert into public.listing_photos (listing_id, photo_url, sort_order) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp', 0),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/1.webp', 0),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/2.webp', 1);


-- Signed in as student A
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

-- 1. Submitting again after auto-approval
select is(
  public.submit_listing('a0000000-0000-0000-0000-000000000001'),
  'pending',
  'A can submit a draft whose photo files all exist'
);
select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'approved',
  'Auto-approve approves the listing right after submission'
);
select is(
  public.submit_listing('a0000000-0000-0000-0000-000000000001'),
  'pending',
  'Submitting again after auto-approval succeeds instead of raising an error'
);

-- 2. A photo file was deleted
select throws_ok(
  $$ select public.submit_listing('a0000000-0000-0000-0000-000000000002') $$,
  'P0001', 'Every attached photo must exist in storage (a photo file is missing)',
  'A cannot submit a draft when one of its photo files is missing'
);
select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000002'),
  'draft',
  'The draft with a missing photo file stays a draft'
);

select * from finish();
rollback;
