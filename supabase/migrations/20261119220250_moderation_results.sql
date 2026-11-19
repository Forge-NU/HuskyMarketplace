-- Connect AI moderation (#10) to submitted listings.
--   1. Two new columns: why a listing was blocked or flagged, and when it was checked.
--   2. listings_to_moderate: the worker asks for pending listings it hasn't checked yet.
--   3. save_moderation_result: the worker saves allow / flag / block.
-- Both functions are backend only. Flagged listings stay pending for a moderator.

-- 1.
ALTER TABLE public.listings
    ADD COLUMN moderation_reason text,
    ADD COLUMN moderated_at timestamptz;

-- 2.
CREATE FUNCTION public.listings_to_moderate(p_limit integer DEFAULT 10)
RETURNS TABLE (id uuid, title text, description text, photo_paths text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT l.id, l.title, l.description,
           coalesce(array_agg(p.photo_url ORDER BY p.sort_order)
                    FILTER (WHERE p.photo_url IS NOT NULL), '{}')
    FROM public.listings l
    LEFT JOIN public.listing_photos p ON p.listing_id = l.id
    WHERE l.status = 'pending'
    AND l.moderated_at IS NULL
    GROUP BY l.id
    ORDER BY min(l.updated_at)
    LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.listings_to_moderate(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listings_to_moderate(integer) TO service_role;

-- 3.
CREATE FUNCTION public.save_moderation_result(p_id uuid, p_decision text, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_decision NOT IN ('allow', 'flag', 'block') THEN
        RAISE EXCEPTION 'Decision must be allow, flag or block (got %)', p_decision;
    END IF;

    UPDATE public.listings
    SET status = CASE p_decision
                     WHEN 'allow' THEN 'approved'
                     WHEN 'block' THEN 'blocked'
                     ELSE 'pending'
                 END,
        moderation_reason = p_reason,
        moderated_at = now(),
        updated_at = now()
    WHERE id = p_id
    AND status = 'pending';

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.save_moderation_result(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_moderation_result(uuid, text, text) TO service_role;
