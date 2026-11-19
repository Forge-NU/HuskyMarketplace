-- Submitted listings wait for moderation, and only the backend can save a result.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu');

insert into storage.buckets (id, name) values ('listing-photos', 'listing-photos')
  on conflict (id) do nothing;
insert into storage.objects (bucket_id, name) values
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp'),
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000002/1.webp'),
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000003/1.webp');

-- Verified-session fixtures for the listing tests, never shared data.
insert into private.verified_sessions(session_id,user_id,expires_at)
select id,id,now()+interval '1 day' from auth.users on conflict do nothing;
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated", "session_id": "aaaaaaaa-0000-0000-0000-000000000000"}';

-- Student A submits three listings.
select public.save_listing_draft(id::uuid,
  '{"title": "Desk lamp", "description": "Works great", "price": 15,
    "category_id": "c1111111-0000-0000-0000-000000000001",
    "condition": "Good", "location": "West Village"}')
from (values ('a0000000-0000-0000-0000-000000000001'),
             ('a0000000-0000-0000-0000-000000000002'),
             ('a0000000-0000-0000-0000-000000000003')) as t(id);
select public.attach_listing_photo(id::uuid,
  'aaaaaaaa-0000-0000-0000-000000000000/' || id || '/1.webp', 0)
from (values ('a0000000-0000-0000-0000-000000000001'),
             ('a0000000-0000-0000-0000-000000000002'),
             ('a0000000-0000-0000-0000-000000000003')) as t(id);
select public.submit_listing(id::uuid)
from (values ('a0000000-0000-0000-0000-000000000001'),
             ('a0000000-0000-0000-0000-000000000002'),
             ('a0000000-0000-0000-0000-000000000003')) as t(id);

select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'pending',
  'A submitted listing waits for moderation'
);
select throws_ok(
  $$ select * from public.listings_to_moderate() $$,
  '42501', null, 'A student cannot see the moderation list'
);
select throws_ok(
  $$ select public.save_moderation_result('a0000000-0000-0000-0000-000000000001', 'allow', null) $$,
  '42501', null, 'A student cannot approve their own listing'
);

-- The worker (backend) checks them.
reset role;
select is(
  (select count(*)::int from public.listings_to_moderate()),
  3,
  'The worker sees all three unchecked listings'
);

select public.save_moderation_result('a0000000-0000-0000-0000-000000000001', 'allow', null);
select public.save_moderation_result('a0000000-0000-0000-0000-000000000002', 'flag', 'text: tobacco_vapes (vape)');
select public.save_moderation_result('a0000000-0000-0000-0000-000000000003', 'block', 'photo 1: weapons');

select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'approved',
  'Allow approves the listing'
);
select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000002'),
  'pending',
  'Flag keeps the listing pending for a moderator'
);
select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000003'),
  'blocked',
  'Block blocks the listing'
);
select is(
  (select moderation_reason from public.listings where id = 'a0000000-0000-0000-0000-000000000003'),
  'photo 1: weapons',
  'The block reason is saved'
);
select is(
  (select count(*)::int from public.listings_to_moderate()),
  0,
  'Checked listings, including flagged ones, are not checked again'
);
select is(
  public.save_moderation_result('a0000000-0000-0000-0000-000000000003', 'allow', null),
  false,
  'A blocked listing cannot be approved by a second worker result'
);

select * from finish();
rollback;
