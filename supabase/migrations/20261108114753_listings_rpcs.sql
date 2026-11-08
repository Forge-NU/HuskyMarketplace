-- Listing workflow RPCs (#33). Users can only read listing tables, so every
-- write goes through these functions, which check ownership and status first.
--   1. listing_workflow_version: returns 'draft-review-v1' so the app knows
--      the workflow is deployed. This is a deployment check, not authorization.
--   2. save_listing_draft: creates a draft, or updates the caller's own draft.
--   3. attach_listing_photo: records an uploaded photo on the caller's draft.
--   4. submit_listing: sends the caller's draft for moderation (pending).
--   5. delete_listing: deletes the caller's own listing in any status except
--      blocked, so moderation records stay.
-- Functions 2-5 run as SECURITY DEFINER with an empty search_path, so they
-- check the caller with auth.uid() themselves. Only signed-in users can call
-- them.

-- 1.
CREATE FUNCTION public.listing_workflow_version()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'draft-review-v1';
END;
$$;

REVOKE ALL ON FUNCTION public.listing_workflow_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listing_workflow_version() TO authenticated;

-- 2.
CREATE FUNCTION public.save_listing_draft(p_id uuid, p_details jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user uuid;
    v_seller uuid;
    v_status text;
BEGIN
    v_user := auth.uid();
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not signed in';
    END IF;

    IF num_nulls(
        p_details ->> 'title',
        p_details ->> 'description',
        p_details ->> 'price',
        p_details ->> 'category_id',
        p_details ->> 'condition',
        p_details ->> 'location'
    ) > 0 THEN
        RAISE EXCEPTION 'Title, description, price, category, condition, and location are required';
    END IF;

    SELECT seller_id, status
    INTO v_seller, v_status
    FROM public.listings
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.listings (
            id,
            seller_id,
            status,
            title,
            description,
            price,
            category_id,
            condition,
            location
        )
        VALUES (
            p_id,
            v_user,
            'draft',
            p_details ->> 'title',
            p_details ->> 'description',
            (p_details ->> 'price')::numeric,
            (p_details ->> 'category_id')::uuid,
            p_details ->> 'condition',
            p_details ->> 'location'
        );
    ELSE
        IF v_seller != v_user THEN
            RAISE EXCEPTION 'Listing belongs to another user';
        END IF;
        IF v_status != 'draft' THEN
            RAISE EXCEPTION 'Only drafts can be edited (status is %)', v_status;
        END IF;

        UPDATE public.listings
        SET title = p_details ->> 'title',
            description = p_details ->> 'description',
            price = (p_details ->> 'price')::numeric,
            category_id = (p_details ->> 'category_id')::uuid,
            condition = p_details ->> 'condition',
            location = p_details ->> 'location',
            updated_at = now()
        WHERE id = p_id;
    END IF;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.save_listing_draft(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_listing_draft(uuid, jsonb) TO authenticated;

-- 3.
CREATE FUNCTION public.attach_listing_photo(p_listing_id uuid, p_path text, p_sort_order integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user uuid;
    v_seller uuid;
    v_status text;
BEGIN
    v_user := auth.uid();
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not signed in';
    END IF;

    SELECT seller_id, status
    INTO v_seller, v_status
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    IF v_seller != v_user THEN
        RAISE EXCEPTION 'Listing belongs to another user';
    END IF;
    IF v_status != 'draft' THEN
        RAISE EXCEPTION 'Photos can only be added to drafts (status is %)', v_status;
    END IF;
    IF storage.foldername(p_path) != ARRAY[v_user::text, p_listing_id::text] THEN
        RAISE EXCEPTION 'Photo path must be in your folder for this listing';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'listing-photos'
        AND name = p_path
    ) THEN
        RAISE EXCEPTION 'Photo has not been uploaded';
    END IF;

    INSERT INTO public.listing_photos (
        listing_id,
        photo_url,
        sort_order
    )
    VALUES (
        p_listing_id,
        p_path,
        p_sort_order
    )
    ON CONFLICT (listing_id, photo_url) DO NOTHING;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_listing_photo(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_listing_photo(uuid, text, integer) TO authenticated;