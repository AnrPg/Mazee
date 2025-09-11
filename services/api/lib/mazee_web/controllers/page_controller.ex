defmodule MazeeWeb.PageController do
  use MazeeWeb, :controller

  def home(conn, _params) do
    send_resp(conn, 200, "ok")
  end
end
