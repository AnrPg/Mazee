defmodule MazeeWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :mazee

  plug MazeeWeb.Plugs.CORS
  plug :handle_preflight

  plug Plug.RequestId
  plug Plug.Logger

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, store: :cookie, key: "_mazee_key", signing_salt: "changeme"

  plug MazeeWeb.Router

  defp handle_preflight(%Plug.Conn{method: "OPTIONS"} = conn, _opts) do
    origin = Plug.Conn.get_req_header(conn, "origin") |> List.first()

    conn
    |> (fn c ->
          if is_binary(origin) do
            Plug.Conn.put_resp_header(c, "access-control-allow-origin", origin)
          else
            c
          end
        end).()
    |> Plug.Conn.put_resp_header(
      "access-control-allow-methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    )
    |> Plug.Conn.put_resp_header(
      "access-control-allow-headers",
      "authorization, content-type, accept"
    )
    |> Plug.Conn.put_resp_header("access-control-allow-credentials", "true")
    |> Plug.Conn.put_resp_header("vary", "Origin")
    |> Plug.Conn.send_resp(204, "")
    |> Plug.Conn.halt()
  end

  defp handle_preflight(conn, _opts), do: conn
end
