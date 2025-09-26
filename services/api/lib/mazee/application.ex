defmodule Mazee.Application do
  @moduledoc false
  use Application

  def start(_type, _args) do
    children = [
      # DB
      Mazee.Repo,
      # PubSub
      {Phoenix.PubSub, name: Mazee.PubSub},
      # HTTP endpoint
      MazeeWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Mazee.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Hot config changes (e.g., during releases)
  def config_change(changed, _new, removed) do
    MazeeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
