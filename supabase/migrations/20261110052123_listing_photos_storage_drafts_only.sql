-- Listing photo uploads and deletes for drafts only (#33).
-- The #39 policies only checked the owner's folder, so an owner could delete
-- an approved listing's photo and upload different content at the same path,
-- skipping moderation. The upload and delete policies are replaced so the
-- folder's listing must be the caller's own draft. Viewing is unchanged.

DROP POLICY "Users can upload listing photos to their own folder" ON storage.objects;
DROP POLICY "Users can delete listing photos from their own folder" ON storage.objects;

CREATE POLICY "Users can upload photos to their own draft listings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    -- Compared as text, so a folder name that isn't a uuid is denied
    -- instead of causing an error.
    AND EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id::text = (storage.foldername(objects.name))[2]
        AND listings.seller_id = (SELECT auth.uid())
        AND listings.status = 'draft'
    )
);

CREATE POLICY "Users can delete photos from their own draft listings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.listings
        WHERE listings.id::text = (storage.foldername(objects.name))[2]
        AND listings.seller_id = (SELECT auth.uid())
        AND listings.status = 'draft'
    )
);
