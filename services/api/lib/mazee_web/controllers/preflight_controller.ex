defmodule MazeeWeb.PreflightController do
  use MazeeWeb, :controller

  # Respond to CORS preflight (OPTIONS) with 204 No Content.
  def options(conn, _params) do
    send_resp(conn, 204, "")
  end
end
