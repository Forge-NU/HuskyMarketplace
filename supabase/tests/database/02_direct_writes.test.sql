-- Students can't write listings or photos directly (#33: all writes go through RPCs),
-- so nobody can approve their own listing or touch someone else's.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Test data: students A and B, each with a draft listing that has one photo.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'student.b@northeastern.edu');

insert into public.listings (id, seller_id, title, status) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000', 'A draft', 'draft'),
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000', 'B draft', 'draft');

insert into public.listing_photos (listing_id, photo_url, sort_order) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp', 0);


-- Signed in as student A ------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.listings (seller_id, title) values ('aaaaaaaa-0000-0000-0000-000000000000', 'Sneaky listing') $$,
  '42501', null, 'A cannot insert a listing directly'
);

select throws_ok(
  $$ update public.listings set status = 'approved' where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot approve their own listing'
);

select throws_ok(
  $$ update public.listings set seller_id = 'bbbbbbbb-0000-0000-0000-000000000000' where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot change who the seller is'
);

select throws_ok(
  $$ update public.listings set title = 'Hacked' where id = 'b0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot edit the listing of B'
);

select throws_ok(
  $$ delete from public.listings where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot delete listings directly (only through delete_listing)'
);

select throws_ok(
  $$ insert into public.listing_photos (listing_id, photo_url, sort_order)
     values ('b0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000/x/evil.webp', 1) $$,
  '42501', null, 'A cannot attach a photo to the listing of B'
);

select throws_ok(
  $$ delete from public.listing_photos where listing_id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot delete photo rows directly'
);

select throws_ok(
  $$ insert into public.categories (name) values ('Fake category') $$,
  '42501', null, 'A cannot add categories'
);


-- Not signed in -----------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$ insert into public.listings (seller_id, title) values ('aaaaaaaa-0000-0000-0000-000000000000', 'Anon listing') $$,
  '42501', null, 'Logged-out users cannot insert listings'
);


-- Back to the admin role to confirm nothing changed and to check leftover grants -----
reset role;

select results_eq(
  $$ select title, status from public.listings order by title $$,
  $$ values ('A draft', 'draft'), ('B draft', 'draft') $$,
  'After all the attempts, both listings are unchanged drafts'
);

select ok(
  not has_table_privilege('authenticated', 'public.listings', 'TRUNCATE'),
  'Logged-in users do not have TRUNCATE on listings (it skips row level security)'
);

select * from finish();
rollback;

