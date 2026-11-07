-- Listings workflow schema (#33).
--   1. Listing status: draft, pending, approved, blocked, or sold (default
--      draft). Existing active listings become approved, the visible state.
--   2. Listing photos: up to five per listing, ordered 0-4, no duplicates.
--   3. Indexes for visible listings and each seller's own listings.
--   4. Grants: signed-in users can read listings, photos, and categories.
--      Writes go through RPCs only.

-- 1. Listing status
UPDATE public.listings SET status = 'approved' WHERE status = 'active';

ALTER TABLE public.listings
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT listings_status_check
        CHECK (status IN ('draft', 'pending', 'approved', 'blocked', 'sold'));

-- 2. Listing photos
ALTER TABLE public.listing_photos
    ALTER COLUMN sort_order SET NOT NULL,
    ADD CONSTRAINT listing_photos_sort_order_check
        CHECK (sort_order BETWEEN 0 AND 4),
    ADD CONSTRAINT listing_photos_listing_id_sort_order_key
        UNIQUE (listing_id, sort_order),
    ADD CONSTRAINT listing_photos_listing_id_photo_url_key
        UNIQUE (listing_id, photo_url);

COMMENT ON COLUMN public.listing_photos.photo_url
    IS 'Not a URL. Contains a path in the listing-photos bucket (<seller id>/<listing id>/<file>.webp).';

-- 3. Indexes
DROP INDEX IF EXISTS public.idx_listings_visible;

CREATE INDEX idx_listings_visible ON public.listings (status, is_available)
    WHERE ((status = 'approved') AND (is_available = true));

CREATE INDEX idx_listings_seller ON public.listings (seller_id);

-- 4. Grants
GRANT SELECT ON public.listings, public.listing_photos, public.categories TO authenticated;