defmodule MazeeWeb.UsersController do
  @moduledoc """
  Admin-only endpoints for managing users.

  Routes:
    GET    /v1/users
    GET    /v1/users/:userId
    PATCH  /v1/users/:userId
    DELETE /v1/users/:userId
  """
  use MazeeWeb, :controller

  alias Mazee.Accounts
  alias MazeeWeb.Auth.Guardian

  # plug :require_admin

  # =========== GET /v1/users ===========
  def index(conn, params) do
    limit =
      case Map.get(params, "limit") do
        nil ->
          20

        val when is_binary(val) ->
          case Integer.parse(val) do
            {num, _} -> min(num, 100)
            :error -> 20
          end

        val when is_integer(val) ->
          min(val, 100)

        _ ->
          20
      end

    after_id =
      case Map.get(params, "after") do
        nil ->
          nil

        val when is_binary(val) ->
          case Integer.parse(val) do
            {num, _} -> num
            :error -> nil
          end

        _ ->
          nil
      end

    users = Accounts.list_users(limit, after_id)

    json(conn, %{
      data: Enum.map(users, &user_admin_view/1),
      next: (List.last(users) && List.last(users).id) || nil
    })
  end

  # =========== GET /v1/users/:userId ===========
  def show(conn, %{"userId" => id}) do
    user = Accounts.get_user!(id)
    json(conn, user_admin_view(user))
  end

  # =========== PATCH /v1/users/:userId ===========
  def patch(conn, %{"userId" => id} = params) do
    user = Accounts.get_user!(id)
    attrs = Map.take(params, ["handle", "roles", "status"])

    case Accounts.update_user(user, attrs) do
      {:ok, user} ->
        json(conn, user_admin_view(user))

      {:error, cs} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{code: "validation_error", details: cs.errors}})
    end
  end

  # =========== DELETE /v1/users/:userId ===========
  def delete(conn, %{"userId" => id}) do
    user = Accounts.get_user!(id)
    {:ok, user} = Accounts.soft_delete_user(user)
    json(conn, user_admin_view(user))
  end

  # ----------------- helpers -----------------

  defp require_admin(conn, _opts) do
    case Guardian.Plug.current_resource(conn) do
      %{roles: roles} when is_list(roles) ->
        if Enum.any?(roles, &(&1 == "admin")) do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> json(%{error: %{code: "forbidden", message: "Admin role required"}})
          |> halt()
        end

      _var ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: %{code: "forbidden", message: "Admin role required"}})
        |> halt()
    end
  end

  defp user_admin_view(u) do
    %{
      id: u.id,
      email: u.email,
      handle: u.handle,
      roles: u.roles,
      status: to_string(u.status),
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }
  end
end
