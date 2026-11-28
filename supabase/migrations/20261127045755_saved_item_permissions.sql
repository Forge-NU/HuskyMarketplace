-- Saved listings (#26): let the existing ownership and device policies take effect.
-- No UPDATE grant: a student saves or removes a row rather than reassigning it.
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_items TO authenticated;
