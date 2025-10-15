"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Header } from "@/components/layout/header"
import { ProfileGrid } from "@/components/profile-management/profile-grid"

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold text-balance">Profile Management</h1>
                <p className="text-muted-foreground text-pretty">Browse and manage user profiles for Mazee</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search profiles by name, handle, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Profile Grid */}
            <ProfileGrid searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
