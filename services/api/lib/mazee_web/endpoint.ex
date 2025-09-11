defmodule MazeeWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :mazee

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
end
