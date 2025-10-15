defmodule MazeeWeb.Plugs.CORS do
  import Plug.Conn

  @allowed_origins MapSet.new([
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "http://127.0.0.1:3000"
  ])

  def init(opts), do: opts

  def call(conn, _opts) do
    origin = get_req_header(conn, "origin") |> List.first()

    conn
    |> put_resp_header("vary", "Origin")
    |> register_before_send(fn c ->
      if origin in @allowed_origins do
        c
        |> put_resp_header("access-control-allow-origin", origin)
        |> put_resp_header("access-control-allow-credentials", "true")
        |> put_resp_header("access-control-allow-methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
        |> put_resp_header("access-control-allow-headers", "authorization, content-type, accept")
      else
        c
      end
    end)

  end

  # defp maybe_allow_origin(conn, _), do: conn
end
