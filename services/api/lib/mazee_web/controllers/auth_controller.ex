defmodule MazeeWeb.AuthController do
  @moduledoc """
  Auth endpoints:

    POST /v1/auth/register
    POST /v1/auth/login
    GET /v1/auth/me

  Returns:
    {
      "user": { ... minimal Profile subset ... },
      "tokens": {
        "accessToken": "...",
        "refreshToken": "...",
        "expiresInSec": <int>
      }
    }

  Notes:
  - We expose a minimal "Profile" view from the user to match your OpenAPI
    (id, handle, displayName). You can later swap this to a real Profile table.
  """
  use MazeeWeb, :controller

  alias Mazee.Accounts
  alias MazeeWeb.Auth.Guardian

  # =========== POST /v1/auth/register ===========
  # Body: { "email": "...", "password": "...", "handle": "..." }
  def register(conn, params) do
    with {:ok, email} <- require_param(params, "email"),
         {:ok, handle} <- require_param(params, "handle"),
         {:ok, pass} <- require_param(params, "password"),
         {:ok, user} <- Accounts.register_user(%{email: email, handle: handle, password: pass}),
         {:ok, payload} <- tokens_payload(user) do
      json(conn |> put_status(:created), payload)
    else
      {:error, :missing, field} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: %{code: "missing_field", field: field}})

      {:error, :validation, cs} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{code: "validation_error", details: cs.errors}})

      {:error, :token_issue_failed} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: %{code: "token_issue_failed", message: "Could not issue tokens"}})
    end
  end

  # =========== POST /v1/auth/login ===========
  # Body: { "email": "...", "password": "..." }
  def login(conn, params) do
    with {:ok, email} <- require_param(params, "email"),
         {:ok, pass} <- require_param(params, "password"),
         {:ok, user} <- Accounts.authenticate(email, pass),
         {:ok, payload} <- tokens_payload(user) do
      json(conn, payload)
    else
      {:error, :missing, field} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: %{code: "missing_field", field: field}})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          error: %{code: "invalid_credentials", message: "Invalid email or password"}
        })

      {:error, :token_issue_failed} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: %{code: "token_issue_failed", message: "Could not issue tokens"}})
    end
  end

  # =========== GET /v1/auth/me ===========
  def me(conn, _params) do
    case MazeeWeb.Auth.Guardian.Plug.current_resource(conn) do
      %{} = user -> json(conn, profile_view(user))
      _ -> conn |> put_status(:unauthorized) |> json(%{error: %{code: "unauthorized"}})
    end
  end


  # -------------------- helpers --------------------

  # Ensure a body key exists and is non-empty (after trimming).
  defp require_param(map, key) do
    case Map.get(map, key) do
      v when is_binary(v) ->
        trimmed = String.trim(v)
        if byte_size(trimmed) > 0, do: {:ok, trimmed}, else: {:error, :missing, key}

      _var ->
        {:error, :missing, key}
    end
  end

  # Issue JWTs and format the unified response payload.
  defp tokens_payload(user) do
    with {:ok, access, claims} <- Guardian.encode_and_sign(user, %{roles: user.roles}, token_type: "access"),
      {:ok, refresh, _}     <- Guardian.encode_and_sign(user, %{roles: user.roles}, token_type: "refresh"),
      exp when is_integer(exp) <- Map.get(claims, "exp"),
      iat when is_integer(iat) <- Map.get(claims, "iat") do
    {:ok,
    %{
      user: profile_view(user),
      tokens: %{
        accessToken: access,
        refreshToken: refresh,
        expiresInSec: exp - iat
      }
    }}
  else
    _ -> {:error, :token_issue_failed}
  end
  end

  # Minimal "Profile" shape from User (strict subset).
  # Replace later with real Profile fields if/when you add a profiles table.
  defp profile_view(u) do
    %{
      id: u.id,
      email: u.email,
      handle: u.handle,
      displayName: u.handle,
      roles: u.roles,
      status: to_string(u.status)
    }
  end

end
