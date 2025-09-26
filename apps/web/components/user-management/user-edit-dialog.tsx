"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useUpdateUser } from "@/lib/hooks/use-users"
import { useAuth } from "@/lib/providers/auth-provider"
import { canManageUser, roleLabels, roleDescriptions } from "@/lib/utils/role-utils"
import type { UserWithProfile, UserRole } from "@/lib/types"
import type { CheckedState } from "@radix-ui/react-checkbox"

 const roleValues = ["user", "admin", "craftsman", "clergy", "moderator"] as const
 const statusValues = ["active", "disabled", "deleted"] as const

 const editUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  handle: z.string()
    .min(3, "Handle must be at least 3 characters")
    .max(32, "Handle must be at most 32 characters")
    .regex(/^[a-z0-9_]{3,32}$/, "Handle can only contain lowercase letters, numbers, and underscores"),
   roles: z.array(z.enum(roleValues)).min(1, "At least one role is required"),
   status: z.enum(statusValues),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface UserEditDialogProps {
  user: UserWithProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserEditDialog({ user, open, onOpenChange }: UserEditDialogProps) {
  const { user: currentUser } = useAuth()
  const updateUserMutation = useUpdateUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: user.email,
      handle: user.handle || "",
      roles: user.roles,
      status: user.status,
    },
  })

  const canManageThisUser = currentUser ? canManageUser(currentUser.roles, user.roles) : false

  const onSubmit = async (data: EditUserFormData) => {
    if (!canManageThisUser) return
    setIsSubmitting(true)
    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        userData: data,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableRoles: readonly UserRole[] = ["user", "craftsman", "clergy", "moderator", "admin"] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1) Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={!canManageThisUser} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2) Handle */}
            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="username" disabled={!canManageThisUser} />
                  </FormControl>
                  <FormDescription>
                    Unique username for the user (3–32 chars, lowercase letters, numbers, underscores)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3) Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canManageThisUser}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4) Roles (checkbox group) */}
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Roles</FormLabel>
                    <FormDescription>Select the roles for this user. Users can have multiple roles.</FormDescription>
                  </div>

                 {availableRoles.map((role) => (
                   <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0">
                     <FormControl>
                       <Checkbox
                         checked={Array.isArray(field.value) ? field.value.includes(role) : false}
                         onCheckedChange={(checked: CheckedState) => {
                           const isChecked = checked === true
                           const current: UserRole[] = Array.isArray(field.value) ? field.value : []
                           const next = isChecked
                             ? (Array.from(new Set([...current, role])) as UserRole[])
                             : (current.filter((v) => v !== role) as UserRole[])
                           field.onChange(next)
                         }}
                         disabled={!canManageThisUser}
                       />
                     </FormControl>
                     <FormLabel className="text-sm font-normal">
                       <div className="font-medium">{roleLabels[role]}</div>
                       <div className="text-xs text-muted-foreground">{roleDescriptions[role]}</div>
                     </FormLabel>
                   </FormItem>
                 ))}

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !canManageThisUser} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
