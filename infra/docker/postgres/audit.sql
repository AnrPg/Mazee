-- DROP TABLE audit.audit_log CASCADE;

-- ===== 0) Prereqs =====
CREATE SCHEMA IF NOT EXISTS audit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Optional: your app schema
CREATE SCHEMA IF NOT EXISTS app;

-- ===== 1) Session context (who/where) via custom GUCs =====
-- Set these at request start from your app (no superuser needed):
--   SELECT set_config('app.user_id',    '123',        true);
--   SELECT set_config('app.request_id', 'req_abc123', true);
--   SELECT set_config('app.ip',         '203.0.113.5',true);
--   SELECT set_config('app.ua',         'Mozilla/5',  true);

-- ===== 2) Main audit table (monthly partitions optional below) =====
CREATE TABLE IF NOT EXISTS audit.audit_log (
  id                uuid NOT NULL DEFAULT uuid_generate_v4(),
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  txid              bigint       NOT NULL DEFAULT txid_current(),
  action            text         NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','TRUNCATE')),
  schema_name       text         NOT NULL,
  table_name        text         NOT NULL,
  pk                jsonb,                 -- primary key(s) as JSON
  actor_user_id     bigint,                -- from app.user_id
  request_id        text,
  source_ip         inet,
  user_agent        text,
  app_name          text,                  -- current_setting('application_name')
  client_addr       inet,                  -- inet_client_addr()
  client_port       int,                   -- inet_client_port()
  server_pid        int,

  -- Row images
  row_old           jsonb,                 -- BEFORE image
  row_new           jsonb,                 -- AFTER image

  -- UPDATE convenience
  changed_cols      text[],                -- names of columns that changed
  diff              jsonb,                 -- { col: {old:..., new:...}, ... }

  -- DDL/extra data
  statement_tag     text,                  -- TG_TAG / pg_event_trigger
  extra             jsonb,                 -- anything else you pass (optional)

  -- ✅ PK must include the partition key
  PRIMARY KEY (occurred_at, id)
) PARTITION BY RANGE (occurred_at);

-- Helpful indexes for common filters
-- (1) Replace btree time index with BRIN (better for append-only + partitions)
DROP INDEX IF EXISTS audit_log_occurred_at_idx;
CREATE INDEX IF NOT EXISTS audit_log_occurred_at_brin
  ON audit.audit_log
  USING BRIN (occurred_at) WITH (pages_per_range = 64);

-- (2) Keep existing table+time index; add action-aware composite for common filters
CREATE INDEX IF NOT EXISTS audit_log_tbl_idx
  ON audit.audit_log (schema_name, table_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_tbl_action_at_idx
  ON audit.audit_log (schema_name, table_name, action, occurred_at DESC);

-- (3) Actor history (keep)
CREATE INDEX IF NOT EXISTS audit_log_actor_idx
  ON audit.audit_log (actor_user_id, occurred_at DESC);

-- (4) Fast lookups by changed column / diff / pk
CREATE INDEX IF NOT EXISTS audit_log_changed_cols_gin
  ON audit.audit_log USING GIN (changed_cols);

CREATE INDEX IF NOT EXISTS audit_log_diff_gin
  ON audit.audit_log USING GIN (diff jsonb_path_ops);

CREATE INDEX IF NOT EXISTS audit_log_pk_gin
  ON audit.audit_log USING GIN (pk jsonb_path_ops);

-- Optional targeted equality by entity id (uncomment ONE depending on your id type)
-- CREATE INDEX IF NOT EXISTS audit_log_pk_id_bigint_idx ON audit.audit_log ( ((pk->>'id')::bigint) );
-- CREATE INDEX IF NOT EXISTS audit_log_pk_id_text_idx   ON audit.audit_log ( (pk->>'id') );

-- ===== 3) Generic row-diff function for DML triggers =====
CREATE OR REPLACE FUNCTION audit.fn_row_audit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id    bigint;
  v_request_id text;
  v_ip         inet;
  v_ua         text;
  v_app        text := current_setting('application_name', true);
  v_client_ip  inet := inet_client_addr();
  v_client_port int := inet_client_port();
  v_pk         jsonb := '{}'::jsonb;
  v_old        jsonb;
  v_new        jsonb;
  v_changed    text[];
  v_diff       jsonb := '{}'::jsonb;
  v_action     text := TG_OP; -- INSERT/UPDATE/DELETE
  k text;
BEGIN
  -- Pull app context if present
  BEGIN v_user_id    := nullif(current_setting('app.user_id', true), '')::bigint; EXCEPTION WHEN others THEN v_user_id := NULL; END;
  BEGIN v_request_id := nullif(current_setting('app.request_id', true), '');      EXCEPTION WHEN others THEN v_request_id := NULL; END;
  BEGIN v_ip         := nullif(current_setting('app.ip', true), '')::inet;        EXCEPTION WHEN others THEN v_ip := NULL; END;
  BEGIN v_ua         := nullif(current_setting('app.ua', true), '');              EXCEPTION WHEN others THEN v_ua := NULL; END;

  -- Primary key(s): prefer constraint; fallback to 'id' if present
  IF TG_ARGV[0] IS NOT NULL AND TG_ARGV[0] <> '' THEN
    -- Explicit PK column list passed as first trigger arg (comma-separated)
    FOREACH k IN ARRAY string_to_array(TG_ARGV[0], ',')
    LOOP
      IF TG_OP IN ('INSERT','UPDATE') THEN
        v_pk := v_pk || jsonb_build_object(k, to_jsonb(NEW.*)::jsonb -> k);
      ELSE
        v_pk := v_pk || jsonb_build_object(k, to_jsonb(OLD.*)::jsonb -> k);
      END IF;
    END LOOP;
  ELSIF TG_OP IN ('INSERT','UPDATE') AND (to_jsonb(NEW.*) ? 'id') THEN
    v_pk := jsonb_build_object('id', to_jsonb(NEW.*)->'id');
  ELSIF TG_OP = 'DELETE' AND (to_jsonb(OLD.*) ? 'id') THEN
    v_pk := jsonb_build_object('id', to_jsonb(OLD.*)->'id');
  END IF;

  -- Row images
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW.*);
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD.*);
  ELSE
    v_old := to_jsonb(OLD.*);
    v_new := to_jsonb(NEW.*);
    -- compute changed columns + diff
    v_changed := ARRAY(
      SELECT key FROM jsonb_each_text(v_new)
      WHERE v_old -> key IS DISTINCT FROM v_new -> key
    );
    IF v_changed IS NOT NULL THEN
      SELECT jsonb_object_agg(key, jsonb_build_object('old', v_old->key, 'new', v_new->key))
      INTO v_diff
      FROM unnest(v_changed) AS key;
    END IF;
  END IF;

  INSERT INTO audit.audit_log
    (action, schema_name, table_name, pk,
     actor_user_id, request_id, source_ip, user_agent, app_name, client_addr, client_port, server_pid,
     row_old, row_new, changed_cols, diff,
     statement_tag, extra)
  VALUES
    (v_action, TG_TABLE_SCHEMA, TG_TABLE_NAME, NULLIF(v_pk,'{}'::jsonb),
     v_user_id, v_request_id, v_ip, v_ua, v_app, v_client_ip, v_client_port, pg_backend_pid(),
     v_old, v_new, v_changed, NULLIF(v_diff,'{}'::jsonb),
     TG_OP, NULL);

  RETURN COALESCE(NEW, OLD);
END $$;

-- ===== 4) TRUNCATE auditing via event trigger =====
CREATE OR REPLACE FUNCTION audit.fn_ddl_audit()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.command_tag = 'TRUNCATE TABLE' THEN
      INSERT INTO audit.audit_log(
        action, schema_name, table_name,
        statement_tag, app_name, client_addr, client_port, server_pid
      )
      SELECT
        'TRUNCATE',
        (obj.object_identity::regclass)::regclass::text::regclass::regclass::text,  -- fallback, but we’ll parse below anyway
        split_part(obj.object_identity, '.', 2),
        obj.command_tag,
        current_setting('application_name', true),
        inet_client_addr(), inet_client_port(), pg_backend_pid()
      ON CONFLICT DO NOTHING; -- defensive
    END IF;
  END LOOP;
END $$;

DROP EVENT TRIGGER IF EXISTS trg_audit_truncate;
CREATE EVENT TRIGGER trg_audit_truncate
  ON ddl_command_end
  EXECUTE FUNCTION audit.fn_ddl_audit();

-- ===== 5) Attach DML trigger to ALL existing tables in "app" schema =====
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  n.nspname = 'app' AND c.relkind = 'r'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_audit_row ON %s;
      CREATE TRIGGER trg_audit_row
        AFTER INSERT OR UPDATE OR DELETE ON %s
        FOR EACH ROW EXECUTE FUNCTION audit.fn_row_audit();',
      r.tbl, r.tbl);
  END LOOP;
END $$;

-- ===== 6) Auto-attach to FUTURE tables in "app" schema =====
CREATE OR REPLACE FUNCTION audit.fn_auto_attach_triggers()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
  tgt regclass;
  sch text;
BEGIN
  FOR rec IN
    SELECT command_tag, object_type, object_identity
    FROM pg_event_trigger_ddl_commands()
  LOOP
    IF rec.command_tag = 'CREATE TABLE' THEN
      -- try to cast the created object to regclass; skip if not a table we can address
      BEGIN
        tgt := rec.object_identity::regclass;
      EXCEPTION WHEN others THEN
        CONTINUE;
      END;

      sch := split_part(tgt::text, '.', 1);
      IF sch = 'app' THEN
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_row ON %s;', tgt);
        EXECUTE format($f$
          CREATE TRIGGER trg_audit_row
            AFTER INSERT OR UPDATE OR DELETE ON %s
          FOR EACH ROW EXECUTE FUNCTION audit.fn_row_audit();
        $f$, tgt);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ✅ ensure idempotency on redeploys
DROP EVENT TRIGGER IF EXISTS trg_audit_auto_attach;
CREATE EVENT TRIGGER trg_audit_auto_attach
  ON ddl_command_end
  EXECUTE FUNCTION audit.fn_auto_attach_triggers();

-- ===== 7) (Optional) Monthly partitioning by occurred_at =====
-- Speeds up retention + queries. Comment out if you prefer a single table.
DO $$
DECLARE
  y int := date_part('year', now())::int;
  m int := date_part('month', now())::int;
  start_date date := make_date(y, m, 1);
  part_name text := format('audit_log_%s', to_char(start_date, 'YYYYMM'));
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = part_name AND relnamespace = 'audit'::regnamespace
  ) THEN
    EXECUTE format($f$
      CREATE TABLE audit.%I
      PARTITION OF audit.audit_log
      FOR VALUES FROM (%L) TO (%L);
    $f$, part_name, start_date::timestamptz, (start_date + INTERVAL '1 month')::timestamptz);
  END IF;
END $$;

-- You can schedule a monthly job to create next partition and drop old ones.

-- ===== 8) Permissions: auditors can read, apps can write, others none =====
REVOKE ALL ON SCHEMA audit FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA audit FROM PUBLIC;

-- Example roles (adjust to your org)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'auditor') THEN
    CREATE ROLE auditor;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_writer') THEN
    CREATE ROLE app_writer;
  END IF;
END $$;

GRANT USAGE ON SCHEMA audit TO auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO auditor;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT ON TABLES TO auditor;

GRANT INSERT ON audit.audit_log TO app_writer;  -- triggers insert as table owner; keep tight
