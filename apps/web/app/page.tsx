"use client"
import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Header } from "@/components/layout/header"
import { UserStats } from "@/components/user-management/user-stats"
import { UserTable } from "@/components/user-management/user-table"
import { CreateUserDialog } from "@/components/user-management/create-user-dialog"

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <AuthGuard requiredRole="moderator">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-serif font-bold text-balance">User Account Management</h1>
                <p className="text-muted-foreground text-pretty">
                  Manage user accounts, profiles, and permissions for Orthodox Social
                </p>
              </div>
              <CreateUserDialog />
            </div>

            {/* Stats */}
            <UserStats />

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by email, handle, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Table */}
            <UserTable searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
