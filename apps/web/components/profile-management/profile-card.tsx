"use client"

import type React from "react"
import { useState } from "react"
import { Edit, MapPin, Calendar, Globe, Users, Lock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/providers/auth-provider"
import { canManageUser, roleLabels, getHighestRole } from "@/lib/utils/role-utils"
import type { UserWithProfile, ProfileVisibility } from "@/lib/types"
import { ProfileEditDialog } from "./profile-edit-dialog"

const visibilityConfig: Record<
  ProfileVisibility,
  { icon: React.ComponentType<{ className?: string }>; label: string; description: string; color: string }
> = {
  public: {
    icon: Globe,
    label: "Public",
    description: "Visible to everyone",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  synaxis: {
    icon: Users,
    label: "Synaxis",
    description: "Visible to Orthodox community",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  private: {
    icon: Lock,
    label: "Private",
    description: "Only visible to user",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
}

interface ProfileCardProps {
  user: UserWithProfile
  showActions?: boolean
}

export function ProfileCard({ user, showActions = true }: ProfileCardProps) {
  const { user: currentUser } = useAuth()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const profile = user.profile
  const canManageThisUser = currentUser ? canManageUser(currentUser.roles, user.roles) : false
  const isOwnProfile = currentUser?.id === user.id

  const visibilityInfo = profile ? visibilityConfig[profile.visibility] : visibilityConfig.public
  const VisibilityIcon = visibilityInfo.icon

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.display_name || user.email} />
              <AvatarFallback className="text-lg">
                {profile?.display_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold">{profile?.display_name || "No display name"}</h3>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">@{user.handle || "no-handle"}</code>
                <Badge variant="secondary">{roleLabels[getHighestRole(user.roles)]}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {profile?.bio && (
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <Separator />

          {/* Profile Details */}
          <div className="space-y-3">
            {profile?.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <VisibilityIcon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className={visibilityInfo.color}>
                {visibilityInfo.label}
              </Badge>
              <span className="text-muted-foreground text-xs">{visibilityInfo.description}</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (canManageThisUser || isOwnProfile) && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editDialogOpen && <ProfileEditDialog user={user} open={editDialogOpen} onOpenChange={setEditDialogOpen} />}
    </>
  )
}
