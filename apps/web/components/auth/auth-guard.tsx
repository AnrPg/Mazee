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
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="font-serif">Authentication Required</CardTitle>
              <CardDescription>You need to be signed in to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    )
  }

  if (requiredRole && !hasPermission(user.roles, requiredRole)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <CardTitle className="font-serif">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page. Required role: {requiredRole}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    )
  }

  return <>{children}</>
}
