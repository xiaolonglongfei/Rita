-- Run in the Supabase SQL editor as the database owner.
-- No instructor, review, or user rows are read, changed, or deleted.
-- Service-role server queries retain their existing access.
-- Table-level SELECT overrides column-level restrictions, so replace it with
-- explicit SELECT grants on all current instructor columns except these two.
BEGIN;

REVOKE SELECT ON TABLE public.instructors FROM PUBLIC, anon, authenticated;
REVOKE SELECT (bio_source_url, bio_source_checked_at)
  ON TABLE public.instructors FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  allowed_columns text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO allowed_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructors'
      AND column_name NOT IN ('bio_source_url', 'bio_source_checked_at');
  IF allowed_columns IS NULL THEN
    RAISE EXCEPTION 'No public instructor columns found; transaction cancelled';
  END IF;
  EXECUTE format(
    'GRANT SELECT (%s) ON TABLE public.instructors TO anon, authenticated',
    allowed_columns
  );
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
