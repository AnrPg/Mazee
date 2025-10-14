"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Header } from "@/components/layout/header"
import { ProfileCard } from "@/components/profile-management/profile-card"
import { ProfileEditDialog } from "@/components/profile-management/profile-edit-dialog"
import { useAuth } from "@/lib/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

export default function Page() {
  const { user } = useAuth()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  if (!user) return null

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-serif font-bold text-balance">My Profile</h1>
                <p className="text-muted-foreground text-pretty">
                  Manage your profile information and privacy settings
                </p>
              </div>
              <Button onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>

            {/* Profile Card */}
            <div className="flex justify-center">
              <ProfileCard user={user} showActions={false} />
            </div>
          </div>
        </div>
      </div>

      {editDialogOpen && <ProfileEditDialog user={user} open={editDialogOpen} onOpenChange={setEditDialogOpen} />}
    </AuthGuard>
  )
}
