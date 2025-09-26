defmodule Mazee.Accounts.Credential do
  @moduledoc """
  Helper for password handling (hashing & verifying).

  Why separate?
    - Keeps `User` schema focused only on DB fields/validation.
    - Encapsulates crypto details (easy to swap Argon2 <-> Bcrypt if needed).
  """

  alias Mazee.Accounts.User
  import Ecto.Changeset

  @doc """
  Takes a changeset and a plaintext password, and puts the hashed password.

  Example:
      changeset
      |> Mazee.Accounts.Credential.put_password_hash("superSecret123")

  Uses Argon2 hashing algorithm (`argon2_elixir` package).
  """
  def put_password_hash(%Ecto.Changeset{} = changeset, password)
      when is_binary(password) do
    change(changeset, password_hash: Argon2.hash_pwd_salt(password))
  end

  @doc """
  Checks if a plaintext password matches the stored hash.

  Returns true/false.

  Example:
      Mazee.Accounts.Credential.valid_password?(user, "candidatePw")
  """
  def valid_password?(%User{password_hash: hash}, password)
      when is_binary(hash) and is_binary(password) do
    Argon2.verify_pass(password, hash)
  end

  def valid_password?(_var1, _var2), do: false
end
