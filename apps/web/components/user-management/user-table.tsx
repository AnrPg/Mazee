"use client"

import type React from "react"
import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Shield, User, Crown, Hammer, Cross } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUsers, useDeleteUser } from "@/lib/hooks/use-users"
import { useAuth } from "@/lib/providers/auth-provider"
import { canManageUser, roleLabels, getHighestRole } from "@/lib/utils/role-utils"
import type { UserWithProfile, UserStatus, UserRole } from "@/lib/types"
import { UserEditDialog } from "./user-edit-dialog"

const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  disabled: "bg-yellow-100 text-yellow-800 border-yellow-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
}

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  user: User,
  craftsman: Hammer,
  clergy: Cross,
  moderator: Shield,
  admin: Crown,
}

interface UserTableProps {
  searchQuery?: string
}

export function UserTable({ searchQuery }: UserTableProps) {
  const { user: currentUser } = useAuth()
  const { data: usersData, isLoading, error } = useUsers({ limit: 50 })
  const deleteUserMutation = useDeleteUser()
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null)

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
            <p>Error loading users: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const users: UserWithProfile[] = (usersData?.items as UserWithProfile[]) || []
  const filteredUsers: UserWithProfile[] = searchQuery
    ? users.filter((user: UserWithProfile) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : users

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      deleteUserMutation.mutate(userId)
    }
  }

  const canManageThisUser = (targetUser: UserWithProfile) => {
    if (!currentUser) return false
    return canManageUser(currentUser.roles, targetUser.roles)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">User Management</CardTitle>
          <CardDescription>Manage user accounts and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: UserWithProfile) => {
                const RoleIcon = roleIcons[getHighestRole(user.roles)]
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.profile?.display_name?.[0] || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.profile?.display_name || "No display name"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">@{user.handle || "no-handle"}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" />
                        <Badge variant="secondary">{roleLabels[getHighestRole(user.roles)]}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[user.status as UserStatus]}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Copy user ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canManageThisUser(user) && (
                            <>
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit user
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive"
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate user
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No users found matching your search." : "No users found."}
            </div>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </>
  )
}
