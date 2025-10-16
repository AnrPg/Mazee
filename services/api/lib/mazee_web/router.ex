defmodule MazeeWeb.Router do
  use MazeeWeb, :router

  # ---------- Pipelines ----------
  pipeline :api do
    plug :accepts, ["json"]
  end

  # Loads current user from Authorization: Bearer <jwt>
  pipeline :auth do
    plug MazeeWeb.Auth.Pipeline
  end

  # ---------- Routes ----------
  scope "/v1", MazeeWeb do
    pipe_through [:api]
    get "/health", HealthController, :index

    get "/handles/check", HandleController, :check

    # Public auth endpoints
    scope "/auth" do
      post "/register", AuthController, :register
      post "/login", AuthController, :login
      # (Later: POST /refresh, POST /logout if you add them)
    end

    post "/users", UsersController, :create

    # Protected endpoints (JWT required)
    scope "/" do
      pipe_through [:auth]

      scope "/auth" do
        get "/me", AuthController, :me
      end

      # Admin Users CRUD (controller enforces admin role)
      get "/users", UsersController, :index
      get "/users/:userId", UsersController, :show
      patch "/users/:userId", UsersController, :patch
      delete "/users/:userId", UsersController, :delete
    end
  end
end
