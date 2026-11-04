CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  requested_username text;
  chosen_username text;
BEGIN
  -- Enforce campus-only registration at the database boundary.
  IF new.email IS NULL
     OR split_part(lower(btrim(new.email)), '@', 2) <> 'northeastern.edu' THEN
    RAISE EXCEPTION 'A Northeastern email address is required';
  END IF;

  -- The new email-only Next.js signup does not send username metadata.
  requested_username := NULLIF(btrim(new.raw_user_meta_data ->> 'username'), '');

  IF requested_username IS NOT NULL
     AND requested_username !~* '^[a-z0-9_]{3,24}$' THEN
    RAISE EXCEPTION 'invalid username';
  END IF;

  chosen_username := COALESCE(
    requested_username,
    'husky_' || left(replace(new.id::text, '-', ''), 18)
  );

  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, chosen_username);

  RETURN new;
END;
$function$;;
