-- Who can see which listings, photos, and categories (read rules from #33).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Test data --------------------------------------------------------------------
-- Two students, A and B. Each has one listing in every state ("A draft", "B approved", ...)
-- with one photo, plus B has an approved listing that is no longer available.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'student.b@northeastern.edu');

insert into public.listings (seller_id, title, status)
select u.id, u.name || ' ' || s.status, s.status
from (values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid, 'A'),
             ('bbbbbbbb-0000-0000-0000-000000000000'::uuid, 'B')) as u(id, name)
cross join unnest(array['draft', 'pending', 'approved', 'blocked', 'sold']) as s(status);

insert into public.listing_photos (listing_id, photo_url, sort_order)
select id, seller_id || '/' || id || '/photo.webp', 0 from public.listings;

insert into public.listings (seller_id, title, status, is_available)
values ('bbbbbbbb-0000-0000-0000-000000000000', 'B approved but unavailable', 'approved', false);


-- Signed in as student A ------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select results_eq(
  $$ select title from public.listings where seller_id = 'aaaaaaaa-0000-0000-0000-000000000000' order by title $$,
  $$ values ('A approved'), ('A blocked'), ('A draft'), ('A pending'), ('A sold') $$,
  'A sees all of their own listings, in every state'
);

select results_eq(
  $$ select title from public.listings where seller_id = 'bbbbbbbb-0000-0000-0000-000000000000' and is_available $$,
  $$ values ('B approved') $$,
  'A sees only the approved listing of B, not drafts, pending, blocked, or sold'
);

select is_empty(
  $$ select 1 from public.listings where title = 'B approved but unavailable' $$,
  'A cannot see an approved listing of B that is no longer available'
);

select is(
  (select count(*)::int from public.listing_photos where photo_url like 'aaaaaaaa%'),
  5,
  'A sees the photos on all of their own listings'
);

select is(
  (select count(*)::int from public.listing_photos where photo_url like 'bbbbbbbb%'),
  1,
  'A sees photos of B only on the approved listing'
);

select isnt_empty(
  $$ select 1 from public.categories $$,
  'A can read categories'
);


-- Signed in as student B ------------------------------------------------------
set local request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000000", "role": "authenticated"}';

select results_eq(
  $$ select title from public.listings where seller_id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  $$ values ('A approved') $$,
  'B sees only the approved listing of A'
);


-- Not signed in -----------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok('select * from public.listings', '42501', null, 'Logged-out users cannot read listings');
select throws_ok('select * from public.listing_photos', '42501', null, 'Logged-out users cannot read photos');
select throws_ok('select * from public.categories', '42501', null, 'Logged-out users cannot read categories');

select * from finish();
rollback;

