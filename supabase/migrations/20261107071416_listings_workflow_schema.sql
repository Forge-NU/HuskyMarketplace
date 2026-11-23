-- Listings workflow schema (#33).
--   1. Listing status: draft, pending, approved, blocked, or sold (default
--      draft). Existing active listings become approved, the visible state.
--   2. Listing photos: up to five per listing, ordered 0-4, no duplicates.
--   3. Indexes: for visible listings, photo paths, and each seller's own listings.
--   4. Grants: signed-in users can only read listings, photos, and categories.
--      Writes go through RPCs only. Leftover baseline privileges (TRUNCATE,
--      TRIGGER, REFERENCES) are removed.
--   5. Listing details: length limits for title, description, and location,
--      a price range, and allowed conditions (new rows only, since older
--      listing mock data uses other condition values).

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

CREATE INDEX idx_listing_photos_photo_url ON public.listing_photos (photo_url);

-- 4. Grants
GRANT SELECT ON public.listings, public.listing_photos, public.categories TO authenticated;

REVOKE TRUNCATE, TRIGGER, REFERENCES
    ON public.listings, public.listing_photos, public.categories
    FROM anon, authenticated;

-- 5. Listing details
-- condition is NOT VALID: existing listings use old values that
-- don't match current allowed list, so only new and changed rows
-- are checked.
ALTER TABLE public.listings
    ADD CONSTRAINT listings_title_check
        CHECK (char_length(btrim(title)) BETWEEN 3 AND 100),
    ADD CONSTRAINT listings_description_check
        CHECK (char_length(btrim(description)) BETWEEN 1 AND 1200),
    ADD CONSTRAINT listings_price_check
        CHECK (price BETWEEN 0 AND 999999.99),
    ADD CONSTRAINT listings_condition_check
        CHECK (condition IN ('New', 'Like new', 'Excellent', 'Good', 'Fair')) NOT VALID,
    ADD CONSTRAINT listings_location_check
        CHECK (char_length(btrim(location)) BETWEEN 1 AND 100);