# services/api/config/config.exs
import Config

config :mazee,
  ecto_repos: [Mazee.Repo]

# Use Jason for JSON
config :phoenix, :json_library, Jason
