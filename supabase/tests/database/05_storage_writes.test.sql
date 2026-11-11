-- Students can only upload or delete listing photos while the listing is their
-- own draft, so a photo can't be swapped after submission (delete, then
-- re-upload different content at the same path).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Test data
-- Student A has a listing in each status, each with one uploaded photo.
-- Student B has a draft.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'student.b@northeastern.edu');

alter table public.listings disable trigger auto_approve_submitted_listing;

insert into public.listings (id, seller_id, title, status) values
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000', 'A draft', 'draft'),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000', 'A pending', 'pending'),
  ('a0000000-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000000', 'A approved', 'approved'),
  ('a0000000-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000000', 'A blocked', 'blocked'),
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000', 'B draft', 'draft');

insert into storage.buckets (id, name) values ('listing-photos', 'listing-photos')
  on conflict (id) do nothing;
insert into storage.objects (bucket_id, name)
select 'listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-00000000000' || n || '/1.webp'
from generate_series(1, 4) as n;

set local storage.allow_delete_query = 'true';


-- Signed in as student A
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

-- Uploads
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/2.webp') $$,
  'A can upload a photo to their own draft'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/2.webp') $$,
  '42501', null, 'A cannot upload a photo to their pending listing'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000003/2.webp') $$,
  '42501', null, 'A cannot upload a photo to their approved listing'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000004/2.webp') $$,
  '42501', null, 'A cannot upload a photo to their blocked listing'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/b0000000-0000-0000-0000-000000000001/1.webp') $$,
  '42501', null, 'A cannot upload into their own folder for the draft of B'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values
     ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/test/1.webp') $$,
  '42501', null, 'A folder name that is not a listing id is denied, not an error'
);

select lives_ok(
  $$ delete from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp' $$,
  'A can run a delete on a photo of their own draft'
);
select is(
  (select count(*) from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp'),
  0::bigint,
  'A can delete a photo from their own draft'
);

select lives_ok(
  $$ delete from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/1.webp' $$,
  'A can run a delete on a photo of their pending listing'
);
select is(
  (select count(*) from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/1.webp'),
  1::bigint,
  'A cannot delete a photo from their pending listing'
);

select lives_ok(
  $$ delete from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000003/1.webp' $$,
  'A can run a delete on a photo of their approved listing'
);
select is(
  (select count(*) from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000003/1.webp'),
  1::bigint,
  'A cannot delete a photo from their approved listing'
);

select lives_ok(
  $$ delete from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000004/1.webp' $$,
  'A can run a delete on a photo of their blocked listing'
);
select is(
  (select count(*) from storage.objects
   where name = 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000004/1.webp'),
  1::bigint,
  'A cannot delete a photo from their blocked listing'
);

select * from finish();
rollback;
