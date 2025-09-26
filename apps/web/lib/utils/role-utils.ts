import type { UserRole } from "../types"

export const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  craftsman: 2,
  clergy: 3,
  moderator: 4,
  admin: 5,
}

export const roleLabels: Record<UserRole, string> = {
  user: "User",
  craftsman: "Craftsman",
  clergy: "Clergy",
  moderator: "Moderator",
  admin: "Administrator",
}

export const roleDescriptions: Record<UserRole, string> = {
  user: "Regular community member",
  craftsman: "Skilled artisan or professional",
  clergy: "Orthodox clergy member",
  moderator: "Community moderator",
  admin: "System administrator",
}

export function hasPermission(userRoles: UserRole[], requiredRole: UserRole): boolean {
  const userMaxLevel = Math.max(...userRoles.map((role) => roleHierarchy[role]))
  const requiredLevel = roleHierarchy[requiredRole]
  return userMaxLevel >= requiredLevel
}

export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest
  }, roles[0] || "user")
}

export function canManageUser(managerRoles: UserRole[], targetRoles: UserRole[]): boolean {
  const managerLevel = Math.max(...managerRoles.map((role) => roleHierarchy[role]))
  const targetLevel = Math.max(...targetRoles.map((role) => roleHierarchy[role]))
  return managerLevel > targetLevel
}
