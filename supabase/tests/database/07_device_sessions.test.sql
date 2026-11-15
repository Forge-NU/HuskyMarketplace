-- Local fixtures only; the transaction rolls back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);
update private.device_verification_settings set enabled=true;
insert into auth.users(id,email) values
 ('d1111111-1111-4111-8111-111111111111','device_test_a@northeastern.edu'),
 ('d2222222-2222-4222-8222-222222222222','device_test_b@northeastern.edu');
select set_config('request.jwt.claims', jsonb_build_object('sub','d1111111-1111-4111-8111-111111111111','session_id','e1111111-1111-4111-8111-111111111111','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now()))))::text,true);
set local role authenticated;
select is(public.confirm_device_session(repeat('a',64),true),false,'Password alone cannot verify a new device');
select is(public.device_session_verified(),false,'Password-only session remains unverified');

select throws_ok($$select public.save_listing_draft('f1111111-1111-4111-8111-111111111111', '{}'::jsonb)$$,'P0001','Verify this device before continuing','Saving a draft requires device verification');
select throws_ok($$select public.attach_listing_photo('f1111111-1111-4111-8111-111111111111','missing.webp',0)$$,'P0001','Verify this device before continuing','Attaching a photo requires device verification');
select throws_ok($$select public.submit_listing('f1111111-1111-4111-8111-111111111111')$$,'P0001','Verify this device before continuing','Submitting a listing requires device verification');
select throws_ok($$select public.delete_listing('f1111111-1111-4111-8111-111111111111')$$,'P0001','Verify this device before continuing','Deleting a listing requires device verification');

select is((select count(*) from public.profiles),0::bigint,'Profile data is inaccessible before verification');
select throws_ok('select * from private.trusted_devices','42501',null,'Device hashes are private');
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub','d1111111-1111-4111-8111-111111111111','session_id','e1111111-1111-4111-8111-111111111111','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now()))))::text,true);
set local role authenticated;
select is(public.confirm_device_session(repeat('a',64),true),true,'A recent email proof can verify and remember the device');
select is(public.device_session_verified(),true,'Verified session can proceed');

select throws_ok($$select public.save_listing_draft('f1111111-1111-4111-8111-111111111111', '{}'::jsonb)$$,'P0001','Title, description, price, category, condition, and location are required','Verified draft saves still validate details');
select throws_ok($$select public.attach_listing_photo('f1111111-1111-4111-8111-111111111111','missing.webp',0)$$,'P0001','Listing not found','Verified photo uploads still validate the listing');
select throws_ok($$select public.submit_listing('f1111111-1111-4111-8111-111111111111')$$,'P0001','Listing not found','Verified submissions still validate the listing');
select is(public.delete_listing('f1111111-1111-4111-8111-111111111111'),true,'Verified deletion retries remain safe');

reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub','d2222222-2222-4222-8222-222222222222','session_id','e2222222-2222-4222-8222-222222222222','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now()))))::text,true);
set local role authenticated;
select is(public.confirm_device_session(repeat('a',64),true),false,'Another account cannot reuse the device');
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub','d1111111-1111-4111-8111-111111111111','session_id','e3333333-3333-4333-8333-333333333333','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now()))))::text,true);
set local role authenticated;
select is(public.confirm_device_session(repeat('a',64),false),true,'A remembered device verifies a later session');
reset role;
update private.trusted_devices set expires_at=now()-interval '1 day';
select set_config('request.jwt.claims', jsonb_build_object('sub','d1111111-1111-4111-8111-111111111111','session_id','e4444444-4444-4444-8444-444444444444','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now()))))::text,true);
set local role authenticated;
select is(public.confirm_device_session(repeat('a',64),true),false,'Expired trust requires email again');
select * from finish();
rollback;
