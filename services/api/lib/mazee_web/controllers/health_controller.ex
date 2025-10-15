defmodule MazeeWeb.HealthController do
  use MazeeWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok"})
  end
end
