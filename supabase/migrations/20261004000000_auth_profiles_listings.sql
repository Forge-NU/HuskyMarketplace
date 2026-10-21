-- Auth setup for Husky Marketplace (issue #9).
--   1. before-user-created hook: only @northeastern.edu emails can sign up
--   2. profiles table + trigger that creates a profile for each new user
--   3. listings table
--   4. Row Level Security on profiles and listings
--
-- After running this, enable the hook in the dashboard:
--   Authentication -> Hooks -> "Before User Created" -> Postgres function public.hook_require_northeastern_email


-- 1. Restrict sign-ups to @northeastern.edu ------------------------------------

create or replace function public.hook_require_northeastern_email(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  email text := lower(trim(event -> 'user' ->> 'email'));
begin
  if email is null or split_part(email, '@', 2) <> 'northeastern.edu' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Husky Marketplace is only open to @northeastern.edu email addresses.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Only Supabase Auth may call the hook.
grant execute on function public.hook_require_northeastern_email(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_require_northeastern_email(jsonb) from public, anon, authenticated;


-- 2. Profiles ------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  is_mover   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Runs as the table owner so it can insert past RLS. Empty search_path keeps it from
-- resolving unqualified names to anything a user could create.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 3. Listings ------------------------------------------------------------------
-- Columns follow src/frontend/lib/types.ts. Extend as the listings feature grows.

create table public.listings (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('good', 'service')),
  title       text not null,
  category    text not null,
  subcategory text,
  price       numeric(10, 2) not null check (price >= 0),
  rate        text check (rate in ('hr', 'flat')),
  obo         boolean not null default false,
  description text,
  meetup      text,
  created_at  timestamptz not null default now()
);

create index listings_user_id_idx on public.listings (user_id);


-- 4. Row Level Security --------------------------------------------------------
-- Logged-in users can read everything; they can only write their own rows.
-- `(select auth.uid())` instead of `auth.uid()` lets Postgres evaluate it once per query.

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

create policy "Logged-in users can read profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create policy "Logged-in users can read listings"
  on public.listings for select to authenticated
  using (true);

create policy "Users can insert their own listings"
  on public.listings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own listings"
  on public.listings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own listings"
  on public.listings for delete to authenticated
  using ((select auth.uid()) = user_id);
