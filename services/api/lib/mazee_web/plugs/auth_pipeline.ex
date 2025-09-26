defmodule MazeeWeb.Auth.Guardian do
  @moduledoc """
  Guardian module that knows how to turn a User into a JWT (and back).

  - subject_for_token/2: says what goes into the "sub" claim (we use user.id)
  - resource_from_claims/1: how to load the resource when a token is verified
  """
  use Guardian, otp_app: :mazee
  alias Mazee.Accounts

  # Called when issuing a token for a user.
  @impl true
  def subject_for_token(%{id: id}, _claims) when is_binary(id), do: {:ok, id}
  def subject_for_token(_resource, _claims), do: {:error, :no_subject}

  # Called when verifying a token to load the "current resource".
  @impl true
  def resource_from_claims(%{"sub" => id}) do
    {:ok, Accounts.get_user!(id)}
  rescue
    Ecto.NoResultsError -> {:error, :resource_not_found}
  end

  def resource_from_claims(_var), do: {:error, :no_sub_claim}
end

defmodule MazeeWeb.Auth.ErrorHandler do
  @moduledoc """
  Returns a JSON 401 when the Guardian pipeline raises an auth error.
  """
  import Plug.Conn

  @spec auth_error(Plug.Conn.t(), {atom(), any()}, any()) :: Plug.Conn.t()
  def auth_error(conn, {_type, _reason}, _opts) do
    body = %{error: %{code: "unauthorized", message: "Unauthorized"}}

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, Jason.encode!(body))
  end
end

defmodule MazeeWeb.Auth.Pipeline do
  @moduledoc """
  Plug pipeline that:
    * checks Authorization: Bearer <jwt>
    * verifies it using MazeeWeb.Auth.Guardian
    * loads current user (or leaves it blank if allow_blank: true)

  Use this in the router with: `pipe_through [:auth]`
  """
  use Guardian.Plug.Pipeline,
    otp_app: :mazee,
    module: MazeeWeb.Auth.Guardian,
    error_handler: MazeeWeb.Auth.ErrorHandler

  # Look for "Authorization: Bearer <token>"
  plug Guardian.Plug.VerifyHeader, realm: "Bearer"

  # If verified, load the resource (current user) into conn.assigns
  plug Guardian.Plug.LoadResource, allow_blank: true
end
