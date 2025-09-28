-- TODO: keep "handle" only in one of users/profiles? (probably profiles, as it's public) considering that one user can have multiple profiles (e.g. priest + admin)


-- Prereqs (you already have citext; add pgcrypto for gen_random_uuid and pg_trgm for fast ILIKE)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS app;

-- Domain enums (avoid free-form text)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE app.user_status AS ENUM ('active','disabled','deleted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
    CREATE TYPE app.profile_visibility AS ENUM ('public','synaxis','private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE app.user_role AS ENUM ('user','admin','craftsman','clergy','moderator');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_addr') THEN
      CREATE DOMAIN email_addr AS citext
        CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Users (UUID PK, enums, constraints)
CREATE TABLE IF NOT EXISTS app.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           email_addr NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  password_hash   text    NOT NULL,              -- Argon2id/bcrypt string
  handle          varchar(32) UNIQUE,           -- public username
  roles           app.user_role[] NOT NULL DEFAULT ARRAY['user']::app.user_role[],
  status          app.user_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- light-weight format/length guards (full validation stays in app)
  CONSTRAINT users_handle_chk CHECK (handle ~* '^[a-z0-9_]{3,32}$'),
  CONSTRAINT users_email_at_chk CHECK (position('@' in email) > 1)
);

-- Profiles (UUID FK, enums)
CREATE TABLE IF NOT EXISTS app.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
  display_name  varchar(120),
  bio           text,
  avatar_url    text,
  location      varchar(120),
  role          app.user_role NOT NULL DEFAULT 'user',
  visibility    app.profile_visibility NOT NULL DEFAULT 'public',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Touch trigger (unchanged)
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_users_touch ON app.users;
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON app.users
FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_touch ON app.profiles;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON app.profiles
FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

-- ===== Indexes (practical, minimal, fast) =====

-- Users: time-based queries / recent first
CREATE INDEX IF NOT EXISTS users_created_at_desc_idx
  ON app.users (created_at DESC);

-- Users: status filtering (common path: only active)
CREATE INDEX IF NOT EXISTS users_active_idx
  ON app.users (created_at DESC)
  WHERE status = 'active';

-- Users: email lookups already UNIQUE; add fast ILIKE for handle (prefix/fuzzy)
CREATE INDEX IF NOT EXISTS users_handle_trgm_idx
  ON app.users USING GIN (handle gin_trgm_ops);

-- Users: roles array membership (e.g., WHERE roles @> ARRAY['priest'])
CREATE INDEX IF NOT EXISTS users_roles_gin_idx
  ON app.users USING GIN (roles);

-- Optional: frequent email_verified filters
CREATE INDEX IF NOT EXISTS users_email_verified_idx
  ON app.users (created_at DESC)
  WHERE email_verified = true;

-- Profiles: display-name and bio search
CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON app.profiles USING GIN (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profiles_bio_trgm_idx
  ON app.profiles USING GIN (bio gin_trgm_ops);

-- Profiles: visibility gating (e.g., only public)
CREATE INDEX IF NOT EXISTS profiles_visibility_idx
  ON app.profiles (visibility, created_at DESC);

CREATE OR REPLACE FUNCTION uniq_roles() RETURNS trigger AS $$
BEGIN
  -- Remove duplicates by unnesting → DISTINCT → array_agg
  NEW.roles := (
    SELECT array_agg(DISTINCT x ORDER BY x)
    FROM unnest(NEW.roles) AS t(x)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_roles_uniq ON app.users;
CREATE TRIGGER trg_users_roles_uniq
  BEFORE INSERT OR UPDATE ON app.users
  FOR EACH ROW
  EXECUTE FUNCTION uniq_roles();


-- Smoke insert (unchanged, now with UUID FK)
-- INSERT INTO app.users (email, password_hash, handle) VALUES ('demo@example.com','hashed_password','anr')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO app.profiles (user_id, display_name, bio)
-- SELECT id, 'Apostolos', 'Orthodox coder'
-- FROM app.users WHERE email = 'demo@example.com'
-- ON CONFLICT DO NOTHING;

-- -- Check
-- SELECT * --u.id, u.email, p.display_name
-- FROM app.users u
-- LEFT JOIN app.profiles p ON p.user_id = u.id
-- ORDER BY u.created_at DESC
-- LIMIT 5;
