-- OPTIONAL, USER-APPLIED ONLY. This file is not run by the app.
-- Inspect this output in Supabase's SQL Editor first:
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.moderation_log'::regclass AND contype = 'c';

-- If action has a CHECK that excludes comment_removed, this transaction extends
-- its current expression rather than guessing or replacing its allowed values.
-- A composite CHECK requires individual review and is deliberately not changed.
BEGIN;
DO $$
DECLARE
  action_column smallint;
  constraint_row record;
BEGIN
  SELECT attnum INTO STRICT action_column
  FROM pg_attribute
  WHERE attrelid = 'public.moderation_log'::regclass
    AND attname = 'action' AND NOT attisdropped;

  FOR constraint_row IN
    SELECT conname, conkey, pg_get_expr(conbin, conrelid) AS expression
    FROM pg_constraint
    WHERE conrelid = 'public.moderation_log'::regclass
      AND contype = 'c' AND action_column = ANY(conkey)
  LOOP
    IF cardinality(constraint_row.conkey) <> 1 THEN
      RAISE EXCEPTION 'Review composite constraint % manually; no changes applied.', constraint_row.conname;
    END IF;
    EXECUTE format('ALTER TABLE public.moderation_log DROP CONSTRAINT %I', constraint_row.conname);
    EXECUTE format(
      'ALTER TABLE public.moderation_log ADD CONSTRAINT %I CHECK ((%s) OR action = %L)',
      constraint_row.conname, constraint_row.expression, 'comment_removed'
    );
  END LOOP;
END $$;
COMMIT;
