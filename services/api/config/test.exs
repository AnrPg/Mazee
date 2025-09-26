# import Config

# config :mazee, MazeeWeb.Endpoint, server: false

import Config

config :mazee, Mazee.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "mazee_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  default_options: [search_path: "app,public"]

config :mazee, MazeeWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false

config :logger, level: :warning
