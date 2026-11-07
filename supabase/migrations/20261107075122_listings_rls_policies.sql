-- Read access for listings (#33). All policies are SELECT only, since
-- users never write these tables directly (writes go through RPCs).
--   1. Signed in users can view approved listings.
--   2. Sellers can view all of their own listings in any status.
--   3. Listing photo rows are visible when their listing is visible.
--   4. Signed in users can view all categories.
--   5. Photo files in the listing-photos bucket are viewable for listings
--      the user can view, so the app can create signed URLs for them.

-- 1.
CREATE POLICY "Authenticated users can view approved listings"
ON public.listings
FOR SELECT
TO authenticated
USING (
    status = 'approved'
);

-- 2.
CREATE POLICY "Sellers can view their own listings"
ON public.listings
FOR SELECT
TO authenticated
USING (
    seller_id = (SELECT auth.uid())
);

-- 3.
CREATE POLICY "Photos are visible when their listing is visible"
ON public.listing_photos
FOR SELECT
TO authenticated
USING (
    -- listings RLS applies inside this subquery, so this only finds
    -- listings the user can already see (policies 1 and 2).
    EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id = listing_photos.listing_id
    )
);

-- 4.
CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

-- 5.
CREATE POLICY "Authenticated users can view photo files of visible listings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'listing-photos'
    AND EXISTS (
        SELECT 1
        FROM public.listing_photos
        WHERE listing_photos.photo_url = objects.name
    )
);
