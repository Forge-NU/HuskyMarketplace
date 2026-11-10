-- Public profile fields and seller profile access (#20).
--   1. Adds display_name, bio, and campus_area to profiles so other students
--      can see them on seller profiles. The frontend currently stores these in
--      auth user metadata, which only the owner can read.
--   2. Copies existing values over from user metadata. Values that break the
--      new length rules are left empty instead of failing the migration.
--   3. Adds is_mover for students offering moving help.
--   4. Limits which profile columns students can update.
--   5. Lets signed-in users read all profiles. Everything in profiles is
--      public, so private fields belong in a separate table (like
--      student_verifications).

ALTER TABLE "public"."profiles"
  ADD COLUMN "display_name" text,
  ADD COLUMN "bio"          text,
  ADD COLUMN "campus_area"  text,
  ADD COLUMN "is_mover"     boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT "profiles_display_name_check" CHECK (((char_length(display_name) >= 2) AND (char_length(display_name) <= 60))),
  ADD CONSTRAINT "profiles_bio_check" CHECK ((char_length(bio) <= 200));

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
  "campus_area" = NULLIF(btrim(u.raw_user_meta_data ->> 'campus_area'), '')
FROM auth.users AS u
WHERE u.id = p.user_id;

REVOKE UPDATE ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("username", "display_name", "bio", "campus_area", "is_mover") ON TABLE "public"."profiles" TO "authenticated";

DROP POLICY "users can read own profile" ON "public"."profiles";

CREATE POLICY "signed-in users can read profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);