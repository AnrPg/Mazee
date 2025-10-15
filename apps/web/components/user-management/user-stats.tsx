"use client"

import { Users, UserCheck, UserX, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUsers } from "@/lib/hooks/use-users"
import type { UserRole, User } from "@/lib/types"


export function UserStats() {
  const { data: usersData, isLoading } = useUsers({ limit: 1000 }) // Get all users for stats

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const users: User[] = usersData?.data || []

  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.status === "active").length
  const disabledUsers = users.filter((user) => user.status === "disabled").length
  const adminUsers = users.filter((user) => user.roles.includes("admin" as UserRole)).length

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "All registered users",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: UserCheck,
      description: "Currently active accounts",
    },
    {
      title: "Disabled Users",
      value: disabledUsers,
      icon: UserX,
      description: "Temporarily disabled accounts",
    },
    {
      title: "Administrators",
      value: adminUsers,
      icon: Shield,
      description: "Users with admin privileges",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
