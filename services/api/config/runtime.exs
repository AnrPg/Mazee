import Config

# --- Postgres ---
db_user = System.get_env("POSTGRES_USER", "mazee")
db_pass = System.get_env("POSTGRES_PASSWORD", "mazee_dev_pw")
# set to service name if inside Docker network
db_host = System.get_env("POSTGRES_HOST", "localhost")
db_port = System.get_env("POSTGRES_PORT", "5432")
db_name = System.get_env("POSTGRES_DB", "mazee_dev")

database_url =
  System.get_env("DATABASE_URL") ||
    "ecto://#{db_user}:#{db_pass}@#{db_host}:#{db_port}/#{db_name}"

config :mazee, Mazee.Repo,
  url: database_url,
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
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
