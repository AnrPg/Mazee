defmodule MazeeWeb.HandleController do
  use MazeeWeb, :controller
  alias Mazee.Accounts

  @handle_re ~r/^[a-z0-9_.]{3,30}$/

  def check(conn, %{"handle" => handle_param}) do
    handle = normalize(handle_param)

    with :ok <- validate(handle) do
      case Accounts.handle_available?(handle) do
        true ->
          json(conn, %{available: true})

        false ->
          suggestion = Accounts.suggest_handle(handle)
          json(conn, %{available: false, suggestion: suggestion})
      end
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{code: "bad_request", message: reason})
    end
  end

  def check(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{code: "bad_request", message: "Missing 'handle' query param"})
  end

  defp normalize(h) when is_binary(h), do: String.downcase(h) |> String.trim()

  defp validate(h) do
    cond do
      is_reserved?(h) ->
        {:error, "Handle is reserved"}

      !Regex.match?(@handle_re, h) ->
        {:error, "Handle must match ^[a-z0-9_.]{3,30}$"}

      true ->
        :ok
    end
  end

  # keep this in sync with your frontend paths & brand words
  @reserved ~w[
    admin root system support moderator mod staff team api www web app apps
    mazee koinonein priest confessor confession synaxarion services
  ]
  defp is_reserved?(h), do: h in @reserved
end
