defmodule Mazee.Accounts do
  @moduledoc """
  The Accounts context.

  This is the public API for all user-related logic:
    * Registering a user
    * Authenticating with email/password
    * Listing users (with simple keyset pagination)
    * Fetching a user by id/email
    * Updating user fields
    * Soft-deleting (status = :deleted)

  Controllers should only call these functions, not schemas directly.
  """

  import Ecto.Query, warn: false

  alias Mazee.Accounts.{Credential, User}
  alias Mazee.Repo

  # ============ Handles ============

  @doc "True if no User uses the given handle."
  def handle_available?(handle) when is_binary(handle) do
    from(u in User, where: u.handle == ^handle, select: 1)
    |> Repo.exists?()
    |> Kernel.not()
  end

  @doc """
  Suggest a close alternative (tries `<handle>_`, `<handle>.<n>`, `<handle><n>`).
  """
  def suggest_handle(base) do
    candidates =
      Stream.concat([
        ["#{base}_"],
        Stream.map(1..99, &"#{base}.#{&1}"),
        Stream.map(1..999, &"#{base}#{&1}")
      ])
      |> Stream.take(1200)

    case Enum.find(candidates, &handle_available?/1) do
      nil -> base <> "_" <> Integer.to_string(:rand.uniform(9999))
      good -> good
    end
  end

  # ============ Queries ============

  @doc "Get a user by id or raise if not found."
  def get_user!(id), do: Repo.get!(User, id)

  @doc "Get a user by email (case-insensitive). Returns nil if not found."
  def get_user_by_email(email) when is_binary(email) do
    from(u in User, where: fragment("lower(?)", u.email) == ^String.downcase(email))
    |> Repo.one()
  end

  @doc """
  List users with simple keyset pagination.
  - limit: max number of rows
  - after_id: optional last-seen id for forward pagination
  """
  def list_users(limit \\ 20, after_id \\ nil) do
    base = from(u in User, order_by: [asc: u.id])

    q =
      if after_id do
        from(u in base, where: u.id > ^after_id, limit: ^limit)
      else
        from(u in base, limit: ^limit)
      end

    Repo.all(q)
  end

  # ============ Mutations ============

  @doc """
  Register a new user.
  Expects attrs with :email, :handle, and :password.
  - Validates via User.creation_changeset
  - Hashes password via Credential.put_password_hash
  - Inserts into DB
  """
  def register_user(%{password: password} = attrs) do
    %User{}
    |> User.creation_changeset(attrs)
    |> then(fn cs ->
      if is_binary(password) and String.length(password) >= 8 do
        Credential.put_password_hash(cs, password)
      else
        Ecto.Changeset.add_error(cs, :password, "too short (min 8 chars)")
      end
    end)
    |> Repo.insert()
  end

  @doc "Update a user with given attrs."
  def update_user(%User{} = user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  @doc "Soft-delete a user by setting status = :deleted."
  def soft_delete_user(%User{} = user) do
    user
    |> Ecto.Changeset.change(status: :deleted)
    |> Repo.update()
  end

  # ============ Auth ============

  @doc """
  Verify email+password.
  Returns {:ok, user} or {:error, :invalid_credentials}.
  """
  def authenticate(email, password) when is_binary(email) and is_binary(password) do
    with %User{} = u <- get_user_by_email(email),
         true <- Credential.valid_password?(u, password) do
      {:ok, u}
    else
      _var -> {:error, :invalid_credentials}
    end
  end
end
