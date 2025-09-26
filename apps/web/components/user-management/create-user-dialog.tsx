"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateUser } from "@/lib/hooks/use-users"
import { useHandleAvailability } from "@/lib/hooks/use-profiles"
import { useAuth } from "@/lib/providers/auth-provider"
import { hasPermission, roleLabels, roleDescriptions } from "@/lib/utils/role-utils"
import { createUserSchema } from "@/lib/types"
import type { UserRole } from "@/lib/types"
import { z } from "zod"


type CreateUserFormData = z.input<typeof createUserSchema>

export function CreateUserDialog() {
  const { user: currentUser } = useAuth()
  const createUserMutation = useCreateUser()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateUserFormData, any, CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      handle: "",
      display_name: "",
      roles: ["user"] as import("@/lib/types").UserRole[],
    },
  })

  const watchedHandle = form.watch("handle")
  const { data: handleAvailability } = useHandleAvailability(watchedHandle)

  const canCreateUsers = currentUser ? hasPermission(currentUser.roles, "moderator") : false

  const onSubmit = async (data: CreateUserFormData) => {
    if (!canCreateUsers) return
    setIsSubmitting(true)
    try {
      await createUserMutation.mutateAsync({
        ...data,
        roles: (data.roles ?? ["user"]) as UserRole[], // <-- ensure required
      })
      form.reset()
      setOpen(false)
    } catch (error) {
      // handled by mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableRoles: UserRole[] = ["user", "craftsman", "clergy", "moderator", "admin"]

  if (!canCreateUsers) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the Orthodox Social platform. They will receive an email to verify their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as import("react-hook-form").UseFormReturn<CreateUserFormData>)} >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField<CreateUserFormData>
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<CreateUserFormData>
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Minimum 8 characters" />
                  </FormControl>
                  <FormDescription>User will be prompted to change this password on first login</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<CreateUserFormData>
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="username" />
                  </FormControl>
                  <FormDescription>
                    Unique username (3-32 characters, lowercase letters, numbers, and underscores only)
                    {handleAvailability && !handleAvailability.available && (
                      <span className="text-destructive block">
                        Handle not available
                        {handleAvailability.suggestion && ` - try "${handleAvailability.suggestion}"`}
                      </span>
                    )}
                    {handleAvailability && handleAvailability.available && (
                      <span className="text-green-600 block">Handle is available</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<CreateUserFormData>
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormDescription>The name that will be shown to other users</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<CreateUserFormData>
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Roles</FormLabel>
                    <FormDescription>Select the roles for this user. Users can have multiple roles.</FormDescription>
                  </div>
                  {availableRoles.map((role) => {
                    const value: UserRole[] = Array.isArray(field.value) ? field.value : []
                    const checked = value.includes(role)
                    return (
                      <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const next = isChecked === true
                                ? (Array.from(new Set([...value, role])) as UserRole[])
                                : (value.filter((v) => v !== role) as UserRole[])
                              field.onChange(next)
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          <div className="font-medium">{roleLabels[role]}</div>
                          <div className="text-xs text-muted-foreground">{roleDescriptions[role]}</div>
                        </FormLabel>
                      </FormItem>
                    )
                  })}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (handleAvailability && !handleAvailability.available)}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
