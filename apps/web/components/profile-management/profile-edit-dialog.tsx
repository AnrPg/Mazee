"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUpdateProfile } from "@/lib/hooks/use-profiles"
import { useAuth } from "@/lib/providers/auth-provider"
import { canManageUser } from "@/lib/utils/role-utils"
import type { UserWithProfile, ProfileVisibility } from "@/lib/types"

const editProfileSchema = z.object({
  display_name: z.string().max(120, "Display name must be at most 120 characters").optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().max(120, "Location must be at most 120 characters").optional(),
  visibility: z.enum(["public", "synaxis", "private"]),
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface ProfileEditDialogProps {
  user: UserWithProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ user, open, onOpenChange }: ProfileEditDialogProps) {
  const { user: currentUser } = useAuth()
  const updateProfileMutation = useUpdateProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const profile = user.profile
  const canManageThisUser = currentUser ? canManageUser(currentUser.roles, user.roles) : false
  const isOwnProfile = currentUser?.id === user.id

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      avatar_url: profile?.avatar_url || "",
      location: profile?.location || "",
      visibility: profile?.visibility || "public",
    },
  })

  const onSubmit = async (data: EditProfileFormData) => {
    if (!canManageThisUser && !isOwnProfile) return

    setIsSubmitting(true)
    try {
      // Filter out empty strings
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value]),
      )

      await updateProfileMutation.mutateAsync({
        userId: user.id,
        profileData: cleanedData,
      })
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarUrlChange = (url: string) => {
    form.setValue("avatar_url", url)
    setAvatarPreview(url)
  }

  const clearAvatar = () => {
    form.setValue("avatar_url", "")
    setAvatarPreview(null)
  }

  const visibilityOptions: { value: ProfileVisibility; label: string; description: string }[] = [
    {
      value: "public",
      label: "Public",
      description: "Visible to everyone on the internet",
    },
    {
      value: "synaxis",
      label: "Synaxis",
      description: "Visible only to Orthodox community members",
    },
    {
      value: "private",
      label: "Private",
      description: "Only visible to you",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be visible according to your privacy settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <FormLabel>Profile Picture</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={avatarPreview || form.watch("avatar_url") || profile?.avatar_url || "/placeholder.svg"}
                    alt="Profile preview"
                  />
                  <AvatarFallback>{form.watch("display_name")?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              {...field}
                              placeholder="https://example.com/avatar.jpg"
                              onChange={(e) => {
                                field.onChange(e)
                                handleAvatarUrlChange(e.target.value)
                              }}
                            />
                            {field.value && (
                              <Button type="button" variant="outline" size="sm" onClick={clearAvatar}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your profile picture or leave empty for default
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your full name" />
                  </FormControl>
                  <FormDescription>This is the name that will be shown to other users</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell others about yourself..."
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormDescription>A brief description about yourself (max 500 characters)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="City, Country" />
                  </FormControl>
                  <FormDescription>Your general location (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibilityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Control who can see your profile information</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!canManageThisUser && !isOwnProfile)}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
