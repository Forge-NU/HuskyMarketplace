-- Listing photo storage (#35, requirements in #33).
--   1. Private listing-photos bucket: WebP only, 1 MB max. Photos can be
--      unmoderated, blocked, or deleted, so the app shows them with short-lived
--      signed URLs instead of public links.
--   2. Storage policies: signed-in users can upload, view, and delete files
--      only inside their own folder (<user id>/<listing id>/<file>.webp).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-photos',
    'listing-photos',
    false,
    1048576, -- 1 MB
    ARRAY['image/webp']
)
ON CONFLICT (id) DO NOTHING;
