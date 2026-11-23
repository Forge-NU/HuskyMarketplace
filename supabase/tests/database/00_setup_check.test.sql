begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select has_table('public', 'listings', 'listings table exists');
select col_not_null('public', 'listings', 'status', 'status is required');
select col_default_is('public', 'listings', 'status', 'draft'::text, 'new listings start as draft');

select * from finish();
rollback;

