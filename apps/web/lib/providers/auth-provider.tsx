"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "../api"
import type { UserWithProfile } from "../types"

interface AuthContextType {
  user: UserWithProfile | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const storedToken = localStorage.getItem("auth_token")
        const storedUser = localStorage.getItem("auth_user")

        if (storedToken && storedUser) {
          apiClient.setToken(storedToken)

          // Try to refresh the user from /me so roles are current & ensured
          let freshUser = null as any
          try {
            freshUser = await fetchMe(storedToken)
          } catch {
            // fallback to stored snapshot if /me fails
            freshUser = JSON.parse(storedUser)
          }

          const roles = Array.isArray(freshUser?.roles) ? freshUser.roles : []
          const finalUser = { ...freshUser, roles }

          setToken(storedToken)
          setUser(finalUser)

          // keep storage in sync (optional but safe)
          localStorage.setItem("auth_user", JSON.stringify(finalUser))
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])


  // --- helper: fetch current user (guarantee roles come from API) ---
  const fetchMe = async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) throw new Error(`ME ${res.status}`)
    return res.json()
  }


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      if (response.error || !response.data) return false

      // Backend returns { user, tokens: { accessToken, ... } }
      const accessToken: string | null = response.data.tokens?.accessToken ?? null
      if (!accessToken) return false

      apiClient.setToken(accessToken)

      // Use the payload's user; if roles missing, fetch /me
      let userData: any = response.data.user ?? null
      if (!Array.isArray(userData?.roles)) {
        try {
          userData = await fetchMe(accessToken)
        } catch {
          // keep payload user if /me fails
        }
      }
      const roles = Array.isArray(userData?.roles) ? userData.roles : []
      const finalUser = { ...userData, roles }

      setUser(finalUser)
      setToken(accessToken)

      localStorage.setItem("auth_token", accessToken)
      localStorage.setItem("auth_user", JSON.stringify(finalUser))

      return true
    } catch {
      return false
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await apiClient.register(userData)
      if (response.error || !response.data) return false

      const accessToken: string | null = response.data.tokens?.accessToken ?? null
      if (!accessToken) return false

      apiClient.setToken(accessToken)

      let newUser: any = response.data.user ?? null
      if (!Array.isArray(newUser?.roles)) {
        try {
          newUser = await fetchMe(accessToken)
        } catch {
          // keep payload user if /me fails
        }
      }
      const roles = Array.isArray(newUser?.roles) ? newUser.roles : []
      const finalUser = { ...newUser, roles }

      setUser(finalUser)
      setToken(accessToken)

      localStorage.setItem("auth_token", accessToken)
      localStorage.setItem("auth_user", JSON.stringify(finalUser))

      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    apiClient.setToken("")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    apiClient.logout() // Call API logout endpoint
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
