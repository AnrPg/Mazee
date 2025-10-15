"use client"

import { useState } from "react"
import { Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUsers } from "@/lib/hooks/use-users"
import { ProfileCard } from "./profile-card"
import { ProfileListItem } from "./profile-list-item"
import type { UserWithProfile } from "@/lib/types"

interface ProfileGridProps {
  searchQuery?: string
}

export function ProfileGrid({ searchQuery }: ProfileGridProps) {
  const { data: usersData, isLoading, error } = useUsers({ limit: 100 })
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading profiles: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const users: UserWithProfile[] = usersData?.data || []
  const filteredUsers = searchQuery
    ? users.filter(
        (user: UserWithProfile) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.profile?.bio?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : users

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif">User Profiles</CardTitle>
            <CardDescription>Browse and manage user profiles</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user: UserWithProfile) => (
              <ProfileCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user: UserWithProfile) => (
              <ProfileListItem key={user.id} user={user} />
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No profiles found matching your search." : "No profiles found."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
