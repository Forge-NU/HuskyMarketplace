-- Install inactive, deploy the matching frontend, then enable the database gate.
-- No password, email code, or raw trusted-device token is stored here.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table private.device_verification_settings (
  id boolean primary key default true check(id),
  enabled boolean not null default false
);
insert into private.device_verification_settings(id,enabled) values(true,false);
alter table private.device_verification_settings enable row level security;
revoke all on private.device_verification_settings from anon, authenticated;

create table private.verified_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
create table private.trusted_devices (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
alter table private.verified_sessions enable row level security;
alter table private.trusted_devices enable row level security;
revoke all on private.verified_sessions, private.trusted_devices from anon, authenticated;

create function private.session_verified() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from private.verified_sessions
 where session_id = nullif(auth.jwt()->>'session_id','')::uuid
 and user_id = auth.uid() and expires_at > now());
$$;
revoke all on function private.session_verified() from public;
grant execute on function private.session_verified() to authenticated;

-- Separate rollout switch from proof status: disabled preserves existing access;
-- it never labels an unverified session as verified.
create function private.device_access_allowed() returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and
 (not coalesce((select enabled from private.device_verification_settings where id),true)
  or private.session_verified());
$$;
revoke all on function private.device_access_allowed() from public;
grant execute on function private.device_access_allowed() to authenticated;

create function public.device_session_verified() returns boolean
language sql stable security invoker set search_path = '' as $$
 select private.session_verified();
$$;
revoke all on function public.device_session_verified() from public;
grant execute on function public.device_session_verified() to authenticated;

create function public.confirm_device_session(p_token text, p_remember boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
 v_user uuid := auth.uid();
 v_session uuid := nullif(auth.jwt()->>'session_id','')::uuid;
 v_hash text;
 v_email_proof boolean;
begin
 if v_user is null or v_session is null then raise exception 'Sign in first'; end if;
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid device token'; end if;
 v_hash := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
 select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a
 where a->>'method' in ('otp','email/signup','recovery')
 and (a->>'timestamp')::numeric between extract(epoch from now()) - 600 and extract(epoch from now()) + 30)
 into v_email_proof;
 if not v_email_proof and not exists(select 1 from private.trusted_devices
 where token_hash = v_hash and user_id = v_user and expires_at > now()) then
   return false;
 end if;
 insert into private.verified_sessions values(v_session,v_user,now()+interval '30 days')
 on conflict(session_id) do update set expires_at=excluded.expires_at where verified_sessions.user_id=v_user;
 -- Password-only sign-in cannot mint or extend a remembered-device credential.
 if v_email_proof and p_remember then
   insert into private.trusted_devices values(v_hash,v_user,now()+interval '30 days')
   on conflict(token_hash) do update set expires_at=excluded.expires_at where trusted_devices.user_id=v_user;
 end if;
 return true;
end;
$$;
revoke all on function public.confirm_device_session(text,boolean) from public;
grant execute on function public.confirm_device_session(text,boolean) to authenticated;

-- Restrictive policies compose with ownership/visibility policies; they never replace them.
do $$ declare t text; begin
 foreach t in array array['profiles','student_verifications','listings','listing_photos','categories','saved_items','reports','reviews','conversations','conversation_participants','messages','transactions'] loop
 execute format('create policy verified_device_required on public.%I as restrictive for all to authenticated using ((select private.device_access_allowed())) with check ((select private.device_access_allowed()))',t);
 end loop;
end $$;
create policy verified_listing_storage_session on storage.objects as restrictive
for all to authenticated
using (bucket_id <> 'listing-photos' or (select private.device_access_allowed()))
with check (bucket_id <> 'listing-photos' or (select private.device_access_allowed()));

-- These SECURITY DEFINER RPCs bypass table RLS, so guard them explicitly too.
do $$ declare f record; definition text; begin
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('save_listing_draft','attach_listing_photo','submit_listing','delete_listing') loop
 definition := pg_get_functiondef(f.oid);
 definition := regexp_replace(definition, E'BEGIN', E'BEGIN\n    IF NOT private.device_access_allowed() THEN RAISE EXCEPTION ''Verify this device before continuing''; END IF;', 'i');
 execute definition;
 end loop;
end $$;
