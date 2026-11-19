-- Moderation now decides what gets approved, so stop approving every submission.
-- approve_pending_listing stays so moderators can approve flagged listings by hand.

DROP TRIGGER auto_approve_submitted_listing ON public.listings;
DROP FUNCTION public.auto_approve_submitted_listing();
