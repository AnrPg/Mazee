import type {
  Profile,
  UserWithProfile,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  ApiResponse,
  PaginatedResponse,
} from "./types"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1").replace(/\/+$/, "")

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token) // also persist (helps page reloads)
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    }

    // ⬇️ MINIMAL: auto-pick token from localStorage if setToken wasn't called yet
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "omit",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // ===== User management points (admin-only in the backend) =====
  async getUsers(params?: { limit?: number; after?: string }): Promise<
    ApiResponse<PaginatedResponse<UserWithProfile>>
  > {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.after) searchParams.set("after", params.after)
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
    return this.request(`/users${qs}`)
  }

  async getUser(userId: string): Promise<ApiResponse<UserWithProfile>> {
    return this.request(`/users/${userId}`)
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<UserWithProfile>> {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<UserWithProfile>> {
    return this.request(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    })
  }

  // ===== Profiles =====
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    return this.request(`/profiles/${userId}`)
  }

  async updateProfile(userId: string, profileData: UpdateProfileRequest): Promise<ApiResponse<Profile>> {
    return this.request(`/profiles/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(profileData),
    })
  }

  async checkHandleAvailability(handle: string): Promise<ApiResponse<{ available: boolean; suggestion?: string }>> {
    return this.request(`/profiles/handle-available?handle=${encodeURIComponent(handle)}`)
  }

  // ===== Auth (expects /v1/auth/... thanks to base) =====
  async login(email: string, password: string): Promise<ApiResponse<{ user: UserWithProfile; token: string }>> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(
    userData: CreateUserRequest & { password: string },
  ): Promise<ApiResponse<{ user: UserWithProfile; token: string }>> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request("/auth/logout", { method: "POST" })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)