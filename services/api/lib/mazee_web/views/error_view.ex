defmodule MazeeWeb.ErrorView do
  use MazeeWeb, :view

  def render("404.json", _assigns), do: %{error: "Not found"}
  def render("500.json", _assigns), do: %{error: "Internal server error"}

  def template_not_found(_, assigns), do: render("404.json", assigns)
end
