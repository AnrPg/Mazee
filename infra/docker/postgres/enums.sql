-- Idempotent enum creator/updater
CREATE OR REPLACE FUNCTION public.ensure_enum(enum_name text, labels text[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  lbl text;
BEGIN
  -- 1) Create the enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e'
      AND t.typname = enum_name
      AND n.nspname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TYPE public.%I AS ENUM (%s)',
      enum_name,
      array_to_string(ARRAY(SELECT quote_literal(x) FROM unnest(labels) AS x), ', ')
    );
  END IF;

  -- 2) Add any missing labels (append to the end)
  FOREACH lbl IN ARRAY labels LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = enum_name
        AND e.enumlabel = lbl
    ) THEN
      EXECUTE format('ALTER TYPE public.%I ADD VALUE %L', enum_name, lbl);
    END IF;
  END LOOP;
END
$$;
