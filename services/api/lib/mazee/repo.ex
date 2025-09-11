defmodule Mazee.Repo do
  use Ecto.Repo,
    otp_app: :mazee,
    adapter: Ecto.Adapters.Postgres
end
