"use client"

import type React from "react"
import { useAuth } from "@/lib/providers/auth-provider"
import { hasPermission } from "@/lib/utils/role-utils"
import type { UserRole } from "@/lib/types"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, loading, status } = useAuth() as {
    user?: { roles?: UserRole[] } | null
    loading?: boolean
    status?: "loading" | "authenticated" | "unauthenticated"
  }

  const isLoading = loading ?? status === "loading"

  // 1) While auth state is loading, show a neutral placeholder (prevents flicker and crashes)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <CardTitle className="font-serif">Checking access…</CardTitle>
            <CardDescription>Please wait.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // 2) If a role is required, verify against a defined roles array
  if (requiredRole) {
    const roles: UserRole[] = Array.isArray(user?.roles) ? (user!.roles as UserRole[]) : []
    if (!hasPermission(roles, requiredRole)) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <CardTitle className="font-serif">Access Denied</CardTitle>
                <CardDescription>
                  You don&apos;t have permission to access this page. Required role: {requiredRole}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )
      )
    }
  }

  // 3) No required role or permission granted
  return <>{children}</>
}