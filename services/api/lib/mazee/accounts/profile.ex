defmodule Mazee.Accounts.Profile do
  use Ecto.Schema
  import Ecto.Changeset

  @schema_prefix "app"
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime]

  schema "profiles" do
    belongs_to :user, Mazee.Accounts.User

    field :handle, :string
    field :display_name, :string
    field :bio, :string
    field :avatar_url, :string
    field :location, :string
    timestamps(inserted_at: :created_at, updated_at: :updated_at)
  end

  @handle_regex ~r/^[a-z0-9_.]{3,30}$/

  def changeset(profile, attrs) do
    profile
    |> cast(attrs, [:handle, :display_name, :bio, :avatar_url, :location])
    |> update_change(:handle, &String.downcase/1)
    |> validate_required([:handle, :display_name])
    |> validate_format(:handle, @handle_regex, message: "must match ^[a-z0-9_.]{3,30}$")
    |> unique_constraint(:handle)
  end

end
