-- Only students on the moderators list are moderators, and students can't add themselves.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'student.a@northeastern.edu'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'student.b@northeastern.edu');
insert into private.moderators (user_id) values ('bbbbbbbb-0000-0000-0000-000000000000');

set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(public.is_moderator(), false, 'A normal student is not a moderator');
select throws_ok(
  $$ insert into private.moderators (user_id) values ('aaaaaaaa-0000-0000-0000-000000000000') $$,
  '42501', null, 'A student cannot add themselves as a moderator'
);
select throws_ok(
  $$ select * from private.moderators $$,
  '42501', null, 'A student cannot see the moderators list'
);

set local request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000000", "role": "authenticated"}';
select is(public.is_moderator(), true, 'A student on the list is a moderator');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select public.is_moderator() $$,
  '42501', null, 'Logged-out users cannot call is_moderator'
);

select * from finish();
rollback;

