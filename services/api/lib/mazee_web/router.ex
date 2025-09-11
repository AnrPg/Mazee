defmodule MazeeWeb.Router do
  use MazeeWeb, :router

  pipeline :browser do
    plug :accepts, ["html", "json"]
  end

  scope "/", MazeeWeb do
    pipe_through :browser
    get "/", PageController, :home
  end
end
