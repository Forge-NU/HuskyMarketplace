-- Submitted listings are auto-approved, and students can't approve listings themselves.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu');

insert into storage.buckets (id, name) values ('listing-photos', 'listing-photos')
  on conflict (id) do nothing;
insert into storage.objects (bucket_id, name) values
  ('listing-photos', 'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp');

set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select public.save_listing_draft('a0000000-0000-0000-0000-000000000001',
  '{"title": "Desk lamp", "description": "Works great", "price": 15,
    "category_id": "c1111111-0000-0000-0000-000000000001",
    "condition": "Good", "location": "West Village"}');
select public.attach_listing_photo('a0000000-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000000/a0000000-0000-0000-0000-000000000001/1.webp', 0);

select is(
  public.submit_listing('a0000000-0000-0000-0000-000000000001'),
  'pending',
  'submit_listing still returns pending'
);

select is(
  (select status from public.listings where id = 'a0000000-0000-0000-0000-000000000001'),
  'approved',
  'The submitted listing is approved right away'
);

select throws_ok(
  $$ select public.approve_pending_listing('a0000000-0000-0000-0000-000000000001') $$,
  '42501', null,
  'Students cannot call the approval function'
);

select * from finish();
rollback;

