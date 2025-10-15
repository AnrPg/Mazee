defmodule MazeeWeb do
  @moduledoc """
  Macro hub for web layers (controllers, router, etc.).

  Provides:
    use MazeeWeb, :controller
    use MazeeWeb, :router
    use MazeeWeb, :html
    use MazeeWeb, :verified_routes
  """

  # ----- quoted helpers -----

  def controller do
    quote do
      use Phoenix.Controller, formats: [:json], layouts: []
      import Plug.Conn
      unquote(verified_routes())
    end
  end

  def router do
    quote do
      use Phoenix.Router
      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def html do
    quote do
      # Placeholder for HTML helpers (LiveView etc.)
    end
  end

  def view do
    quote do
      use Phoenix.View,
        root: "lib/mazee_web/templates",
        namespace: MazeeWeb
    end
  end

  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: MazeeWeb.Endpoint,
        router: MazeeWeb.Router,
        statics: []
    end
  end

  # ----- THIS IS THE MAGIC ENTRYPOINT -----
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end

# # defmodule MazeeWeb do
# #   @moduledoc false

# #   # For controllers that do: `use MazeeWeb, :controller`
# #   def controller do
# #     quote do
# #       use Phoenix.Controller, formats: [:json], layouts: []
# #       import Plug.Conn
# #       alias MazeeWeb.Router.Helpers, as: Routes
# #     end
# #   end

# #   # For router that does: `use MazeeWeb, :router`
# #   def router do
# #     quote do
# #       use Phoenix.Router
# #       import Plug.Conn
# #       import Phoenix.Controller
# #     end
# #   end

# #   # Optional for LiveView/components later. Safe no-op for now.
# #   def html do
# #     quote do
# #       # keep empty for now
# #     end
# #   end

# #   # Phoenix 1.7+/1.8 verified routes helper — minimal stub so compiles
# #   def verified_routes do
# #     quote do
# #       use Phoenix.VerifiedRoutes,
# #         endpoint: MazeeWeb.Endpoint,
# #         router: MazeeWeb.Router,
# #         statics: []
# #     end
# #   end
# # end

# defmodule MazeeWeb do
#   @moduledoc """
#   Macro hub for web layers (router, controller, etc.).
#   """

#   # ----- public quoted helpers -----

#   def controller do
#     quote do
#       use Phoenix.Controller, formats: [:json], layouts: []
#       import Plug.Conn
#       unquote(verified_routes())
#     end
#   end

#   def router do
#     quote do
#       use Phoenix.Router
#       import Plug.Conn
#       import Phoenix.Controller
#     end
#   end

#   def html do
#     quote do
#       # HTML helpers can be added later
#     end
#   end

#   def verified_routes do
#     quote do
#       use Phoenix.VerifiedRoutes,
#         endpoint: MazeeWeb.Endpoint,
#         router: MazeeWeb.Router,
#         statics: []
#     end
#   end

#   # ----- THIS MUST BE A MACRO -----
#   defmacro _using_(which) when is_atom(which) do
#     apply(_MODULE_, which, [])
#   end
# end
