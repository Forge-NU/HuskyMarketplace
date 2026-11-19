-- Moderators review flagged, appealed, and reported listings (#10, #22).
-- Kept in the private schema so students can't see or change who is on it.

CREATE TABLE private.moderators (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.moderators ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.moderators FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (SELECT 1 FROM private.moderators WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_moderator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated;

