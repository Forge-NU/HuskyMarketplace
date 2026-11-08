-- The listing functions from #33 only let students change their own drafts,
-- and no function lets a student approve their own listing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Test data --------------------------------------------------------------------
-- Students A and B. B has a draft; A has a blocked listing (set by moderation).
-- The listing-photos bucket holds the files A "uploaded".
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'student.b@northeastern.edu');

insert into public.listings (id, seller_id, title, status) values
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000', 'B draft', 'draft'),
  ('a0000000-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000000', 'A blocked', 'blocked');

insert into storage.buckets (id, name) values ('listing-photos', 'listing-photos')
  on conflict (id) do nothing;
insert into storage.objects (bucket_id, name)
select 'listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/' || n || '.webp'
from generate_series(1, 6) as n;
insert into storage.objects (bucket_id, name) values
  ('listing-photos', 'bbbbbbbb-0000-0000-0000-000000000000/b0000000-0000-0000-0000-000000000001/1.webp');

-- A complete, valid set of listing details.
create temp table details as
select '{"title": "Desk lamp", "description": "Works great", "price": 15,
         "category_id": "c1111111-0000-0000-0000-000000000001",
         "condition": "Good", "location": "West Village"}'::jsonb as d;
grant select on details to authenticated;


-- save_listing_draft (signed in as A) -------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(
  public.save_listing_draft('a0000000-0000-0000-0000-000000000001', (select d from details)),
  true,
  'A can create a draft'
);

select results_eq(
  $$ select seller_id::text, status from public.listings where id = 'a0000000-0000-0000-0000-000000000001' $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000000', 'draft') $$,
  'The new listing is a draft owned by A'
);

select lives_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000001',
       (select d || '{"title": "Edited lamp"}' from details)) $$,
  'A can save changes to their own draft'
);
select is(
  (select title from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'Edited lamp',
  'A can edit their own draft'
);

select throws_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000002', '{"title": "No details"}') $$,
  'P0001', 'Title, description, price, category, condition, and location are required',
  'A draft needs every required field'
);

select throws_ok(
  $$ select public.save_listing_draft('b0000000-0000-0000-0000-000000000001', (select d from details)) $$,
  'P0001', 'Listing belongs to another user',
  'A cannot overwrite the draft of B by reusing its id'
);

select throws_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000001',
       (select d || '{"status": "approved", "seller_id": "bbbbbbbb-0000-0000-0000-000000000000"}' from details)) $$,
  null, null, 'A cannot slip status or seller_id into the details'
);

select results_eq(
  $$ select seller_id::text, status from public.listings where id = 'a0000000-0000-0000-0000-000000000001' $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000000', 'draft') $$,
  'Even so, status and seller_id in the details do not change the listing'
);


-- attach_listing_photo ----------------------------------------------------------
select is(
  public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp', 0),
  true,
  'A can attach an uploaded photo to their own draft'
);

select throws_ok(
  $$ select public.attach_listing_photo('b0000000-0000-0000-0000-000000000001',
       'bbbbbbbb-0000-0000-0000-000000000000/b0000000-0000-0000-0000-000000000001/1.webp', 1) $$,
  'P0001', 'Listing belongs to another user',
  'A cannot attach a photo to the listing of B'
);

select throws_ok(
  $$ select public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
       'bbbbbbbb-0000-0000-0000-000000000000/b0000000-0000-0000-0000-000000000001/1.webp', 1) $$,
  'P0001', 'Photo path must be in your folder for this listing',
  'A cannot attach a photo from the folder of B'
);

select throws_ok(
  $$ select public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
       'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/never-uploaded.webp', 1) $$,
  'P0001', 'Photo has not been uploaded',
  'A cannot attach a photo that was never uploaded'
);

select throws_ok(
  $$ select public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
       'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/6.webp', 5) $$,
  '23514', null,
  'A listing cannot have a sixth photo (positions are 0-4)'
);


-- submit_listing ------------------------------------------------------------------
select lives_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000002', (select d from details)) $$,
  'A can create a second draft (no photos yet)'
);
select throws_ok(
  $$ select public.submit_listing('a0000000-0000-0000-0000-000000000002') $$,
  'P0001', 'Listing needs at least one photo to be submitted',
  'A cannot submit a draft with no photos'
);

select throws_ok(
  $$ select public.submit_listing('b0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Listing belongs to another user',
  'A cannot submit the listing of B'
);

select is(
  public.submit_listing('a0000000-0000-0000-0000-000000000001'),
  'pending',
  'A can submit their own draft, and it becomes pending'
);

select is(
  public.submit_listing('a0000000-0000-0000-0000-000000000001'),
  'pending',
  'Submitting again is safe and still returns pending'
);

select throws_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000001', (select d from details)) $$,
  'P0001', 'Only drafts can be edited (status is pending)',
  'A cannot edit a listing once it is pending'
);

select throws_ok(
  $$ select public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
       'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/2.webp', 1) $$,
  'P0001', 'Photos can only be added to drafts (status is pending)',
  'A cannot add photos once it is pending'
);


-- delete_listing ------------------------------------------------------------------
select throws_ok(
  $$ select public.delete_listing('b0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Listing belongs to another user',
  'A cannot delete the listing of B'
);

select throws_ok(
  $$ select public.delete_listing('a0000000-0000-0000-0000-000000000009') $$,
  'P0001', 'Blocked listings cannot be deleted',
  'A cannot delete a blocked listing (moderation records stay)'
);

select is(
  public.delete_listing('a0000000-0000-0000-0000-000000000002'),
  true,
  'A can delete their own draft'
);

select lives_ok(
  $$ select public.delete_listing('a0000000-0000-0000-0000-000000000002') $$,
  'Deleting the same listing twice is safe (for retries after a lost response)'
);


-- No way to self-approve, and logged-out users can't use any of it -------------------
select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'pending',
  'After everything A tried, their listing is still pending, not approved'
);

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$ select public.save_listing_draft('a0000000-0000-0000-0000-000000000003', '{}') $$,
  '42501', null, 'Logged-out users cannot save drafts'
);

reset role;
select ok(
  not has_function_privilege('anon', 'public.submit_listing(uuid)', 'execute'),
  'Logged-out users do not even have permission to call submit_listing'
);

select * from finish();
rollback;

