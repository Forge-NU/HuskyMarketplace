-- Public profile fields and seller profile access (#20).
--   1. Adds display_name, bio, and campus_area to profiles so other students
--      can see them on seller profiles. The frontend currently stores these in
--      auth user metadata, which only the owner can read.
--   2. Validates them: display names must be trimmed and 2 to 60 characters,
--      bios can be up to 200, and campus_area must be one of the dropdown values.
--   3. Copies existing values over from user metadata. Values that don't pass
--      the new rules are left empty instead of failing the migration.
--   4. Keeps updated_at current with a trigger.
--   5. Limits which profile columns students can update.
--   6. Lets signed-in users read all profiles. Everything in profiles is
--      public, so private fields belong in a separate table (like
--      student_verifications).
--
-- Tests: supabase/tests/database/profiles.test.sql

ALTER TABLE "public"."profiles"
  ADD COLUMN "display_name" text,
  ADD COLUMN "bio"          text,
  ADD COLUMN "campus_area"  text,
  ADD CONSTRAINT "profiles_display_name_check" CHECK (((display_name = btrim(display_name)) AND (char_length(display_name) >= 2) AND (char_length(display_name) <= 60))),
  ADD CONSTRAINT "profiles_bio_check" CHECK ((char_length(bio) <= 200)),
  ADD CONSTRAINT "profiles_campus_area_check" CHECK ((campus_area = ANY (ARRAY['Fenway'::text, 'West Village'::text, 'East Village'::text, 'LightView'::text, 'Ruggles'::text, 'Other near campus'::text])));

UPDATE "public"."profiles" AS p
SET
  "display_name" = CASE
    WHEN char_length(btrim(u.raw_user_meta_data ->> 'display_name')) BETWEEN 2 AND 60
    THEN btrim(u.raw_user_meta_data ->> 'display_name')
  END,
  "bio" = CASE
    WHEN char_length(btrim(u.raw_user_meta_data ->> 'bio')) BETWEEN 1 AND 200
    THEN btrim(u.raw_user_meta_data ->> 'bio')
  END,
    "campus_area" = CASE
    WHEN btrim(u.raw_user_meta_data ->> 'campus_area') IN ('Fenway', 'West Village', 'East Village', 'LightView', 'Ruggles', 'Other near campus')
    THEN btrim(u.raw_user_meta_data ->> 'campus_area')
  END
FROM auth.users AS u
WHERE u.id = p.user_id;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."set_profiles_updated_at"() FROM PUBLIC;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

REVOKE UPDATE ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("username", "display_name", "bio", "campus_area") ON TABLE "public"."profiles" TO "authenticated";

DROP POLICY "users can read own profile" ON "public"."profiles";

CREATE POLICY "signed-in users can read profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);