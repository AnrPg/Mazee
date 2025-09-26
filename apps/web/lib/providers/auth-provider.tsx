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
    // Check for stored token on mount
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        apiClient.setToken(storedToken)
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      if (response.error || !response.data) {
        return false
      }

      const { user: userData, token: authToken } = response.data
      setUser(userData)
      setToken(authToken)
      apiClient.setToken(authToken)

      // Store in localStorage
      localStorage.setItem("auth_token", authToken)
      localStorage.setItem("auth_user", JSON.stringify(userData))

      return true
    } catch (error) {
      return false
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await apiClient.register(userData)
      if (response.error || !response.data) {
        return false
      }

      const { user: newUser, token: authToken } = response.data
      setUser(newUser)
      setToken(authToken)
      apiClient.setToken(authToken)

      // Store in localStorage
      localStorage.setItem("auth_token", authToken)
      localStorage.setItem("auth_user", JSON.stringify(newUser))

      return true
    } catch (error) {
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
