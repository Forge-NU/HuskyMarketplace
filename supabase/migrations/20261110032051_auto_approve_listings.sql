-- Auto-approve submitted listings until moderation is connected (#10).
--   1. approve_pending_listing: sets a pending listing to approved. Backend only.
--   2. Trigger: approves a listing as soon as it is submitted.

-- 1.
CREATE FUNCTION public.approve_pending_listing(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.listings
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_id
    AND status = 'pending';

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_pending_listing(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pending_listing(uuid) TO service_role;

-- 2.
CREATE FUNCTION public.auto_approve_submitted_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM public.approve_pending_listing(new.id);
    RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_approve_submitted_listing() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER auto_approve_submitted_listing
AFTER UPDATE OF status ON public.listings
FOR EACH ROW
WHEN (old.status = 'draft' AND new.status = 'pending')
EXECUTE FUNCTION public.auto_approve_submitted_listing();

