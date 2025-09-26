"use client"

import { useState } from "react"
import { Edit, MapPin, Calendar, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/providers/auth-provider"
import { canManageUser, roleLabels, getHighestRole } from "@/lib/utils/role-utils"
import type { UserWithProfile } from "@/lib/types"
import { ProfileEditDialog } from "./profile-edit-dialog"

interface ProfileListItemProps {
  user: UserWithProfile
}

export function ProfileListItem({ user }: ProfileListItemProps) {
  const { user: currentUser } = useAuth()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const profile = user.profile
  const canManageThisUser = currentUser ? canManageUser(currentUser.roles, user.roles) : false
  const isOwnProfile = currentUser?.id === user.id

  return (
    <>
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.display_name || user.email} />
          <AvatarFallback>{profile?.display_name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{profile?.display_name || "No display name"}</h4>
            <Badge variant="secondary" className="shrink-0">
              {roleLabels[getHighestRole(user.roles)]}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <code className="bg-muted px-2 py-1 rounded text-xs">@{user.handle || "no-handle"}</code>
            {profile?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {profile?.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}
        </div>

        {(canManageThisUser || isOwnProfile) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>Copy user ID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {editDialogOpen && <ProfileEditDialog user={user} open={editDialogOpen} onOpenChange={setEditDialogOpen} />}
    </>
  )
}
