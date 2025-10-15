import Config

# --- Postgres ---
# Expect DATABASE_URL like:
#  postgres://USER:PASS@HOST:5432/DBNAME
db_user = System.get_env("POSTGRES_USER", "mazee")
db_pass = System.get_env("POSTGRES_PASSWORD", "mazee_dev_pw")
# set to service name if inside Docker network
db_host = System.get_env("POSTGRES_HOST", "postgres")
db_port = System.get_env("POSTGRES_PORT", "5432")
db_name = System.get_env("POSTGRES_DB", "mazee_dev")

database_url =
  System.get_env("DATABASE_URL") ||
    "postgres://#{db_user}:#{db_pass}@#{db_host}:#{db_port}/#{db_name}"

config :mazee, Mazee.Repo,
  url: database_url,
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  ssl: String.downcase(System.get_env("DB_SSL") || "false") == "true",
  migration_primary_key: [type: :binary_id],
  migration_timestamps: [type: :utc_datetime_usec],
  timeout: 15_000,
  queue_target: 5_000,
  # IMPORTANT: our tables live under the "app" schema by default
  default_options: [search_path: "app,public"],
  socket_options: [:inet],
  ssl: false

# --- Meilisearch ---
config :mazee, :meili,
  host: System.get_env("MEILI_HOST", "http://localhost:7700"),
  master_key: System.get_env("MEILI_MASTER_KEY", "dev_meili_master_key_change_me")

# --- MongoDB (NoSQL) ---
# Standard Mongo URL form:
# mongodb://USER:PASS@HOST:PORT/DB?authSource=admin
config :mazee, :mongo,
  url:
    System.get_env(
      "MONGO_URL",
      "mongodb://mazee_app:mazee_app_pw@localhost:27017/mazee_dev?authSource=admin"
    )

# ---------- Guardian (JWT) ----------
# Generate a strong secret once and set GUARDIAN_SECRET_KEY in the env.
guardian_secret =
  System.get_env("GUARDIAN_SECRET_KEY") ||
    raise """
    GUARDIAN_SECRET_KEY not set.
    Generate one in IEx:
      :crypto.strong_rand_bytes(64) |> Base.encode64() |> IO.puts()
    """

config :mazee, MazeeWeb.Auth.Guardian,
  issuer: "mazee",
  secret_key: guardian_secret,
  # Optional: set default TTLs (you can also pass token_type-specific claims on issue)
  ttl: {1, :hour}

# ---------- Endpoint (HTTP) ----------
host = System.get_env("PHX_HOST") || "localhost"
port = String.to_integer(System.get_env("PORT") || "4000")

config :mazee, MazeeWeb.Endpoint,
  url: [host: host, port: port],
  http: [ip: {0, 0, 0, 0}, port: port],
  secret_key_base:
    System.get_env("SECRET_KEY_BASE") ||
      raise("""
      SECRET_KEY_BASE not set.
      Generate one:
        mix phx.gen.secret
      """),
  server: true
