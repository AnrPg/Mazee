-- Create an additional test DB and grant privileges.
CREATE DATABASE IF NOT EXISTS <%= ENV['POSTGRES_DB_TEST'] || 'mazee_test' %>;
-- The official Postgres entrypoint doesn't do ERB; keep it static instead:
-- Replacing with plain SQL for portability:

-- Create test DB (safe if it already exists)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mazee_test') THEN
      PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE mazee_test');
   END IF;
EXCEPTION WHEN undefined_table THEN
   -- dblink not installed; fallback simple create ignoring errors
   BEGIN
      CREATE DATABASE mazee_test;
   EXCEPTION WHEN duplicate_database THEN
      -- ok
   END;
END$$;

-- Ensure our user is superuser in dev (adjust for prod!)
ALTER USER mazee WITH SUPERUSER;
