defmodule Mazee.Accounts.User do
  @moduledoc """
  Ecto schema for `app.users`.

  - Mirrors your existing DB table (UUID id, email, handle, roles[], status enum).
  - Uses changesets to validate/cast data before touching the DB.
  - Does **not** hash passwords here (see `Mazee.Accounts.Credential`).
  """

  use Ecto.Schema
  import Ecto.Changeset

  # We use UUIDs everywhere in Mazee.
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  # Your tables live under the "app" schema in Postgres.
  @schema_prefix "app"

  schema "users" do
    field :email, :string
    field :handle, :string

    # Stored hash (we will set it from the credential helper when registering).
    field :password_hash, :string

    # Keep roles aligned with your DB (text[]). Example default: ["user"].
    field :roles, {:array, :string}, default: ["user"]

    # Mirror your Postgres enum app.user_status = ('active'|'disabled'|'deleted').
    field :status, Ecto.Enum, values: [:active, :disabled, :deleted], default: :active

    # Map to your timestamp column names from SQL:
    timestamps(
      inserted_at: :created_at,
      updated_at: :updated_at,
      type: :utc_datetime_usec
    )
  end

  @doc """
  Changeset for creating users (email, handle, roles?, status?).

  Notes:
    * Does **not** accept `:password` here — we hash it in the Accounts layer
      using `Mazee.Accounts.Credential.put_password_hash/2`.
    * We validate format & uniqueness in app-space; DB still enforces final uniqueness.
  """
  def creation_changeset(%__MODULE__{} = user, attrs) do
    user
    |> cast(attrs, [:email, :handle, :roles, :status])
    |> validate_required([:email, :handle])
    |> validate_format(:email, ~r/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    |> validate_format(:handle, ~r/^[a-z0-9_\.]{3,30}$/)
    # Fast app-level pre-checks; DB remains the source of truth.
    |> unsafe_validate_unique(:email, Mazee.Repo)
    |> unsafe_validate_unique(:handle, Mazee.Repo)
    # Map DB unique constraint errors back onto the changeset.
    # If your constraint/index names differ, adjust :name accordingly.
    # e.g. name: :users_email_idx
    |> unique_constraint(:email)
    # e.g. name: :users_handle_idx
    |> unique_constraint(:handle)
  end

  @doc """
  Changeset for updating users (admin/self). We keep this narrow on purpose.
  """
  def update_changeset(%__MODULE__{} = user, attrs) do
    user
    |> cast(attrs, [:handle, :roles, :status])
    |> validate_format(:handle, ~r/^[a-z0-9_\.]{3,30}$/)
    |> unsafe_validate_unique(:handle, Mazee.Repo)
    # adjust :name if your DB uses a custom index name
    |> unique_constraint(:handle)
  end
end
