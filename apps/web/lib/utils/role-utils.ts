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

export function hasPermission(userRoles: UserRole[] = [], requiredRole: UserRole): boolean {
  // No roles → no permissions
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false;

  const userMaxLevel = Math.max(
    ...userRoles.map((role) => (roleHierarchy[role] ?? Number.NEGATIVE_INFINITY))
  );
  const requiredLevel = roleHierarchy[requiredRole] ?? Number.POSITIVE_INFINITY;

  return userMaxLevel >= requiredLevel;
}

export function getHighestRole(roles: UserRole[] = []): UserRole {
  if (!Array.isArray(roles) || roles.length === 0) return "user";
  // Pick the role with the highest level; unknown roles are treated as very low
  return roles.reduce<UserRole>((highest, current) => {
    const hi = roleHierarchy[highest] ?? Number.NEGATIVE_INFINITY;
    const cu = roleHierarchy[current] ?? Number.NEGATIVE_INFINITY;
    return cu > hi ? current : highest;
  }, "user");
}

export function canManageUser(managerRoles: UserRole[] = [], targetRoles: UserRole[] = []): boolean {
  if (!Array.isArray(managerRoles) || managerRoles.length === 0) return false;
  if (!Array.isArray(targetRoles) || targetRoles.length === 0) return true; // empty target → manageable

  const managerLevel = Math.max(
    ...managerRoles.map((role) => (roleHierarchy[role] ?? Number.NEGATIVE_INFINITY))
  );
  const targetLevel = Math.max(
    ...targetRoles.map((role) => (roleHierarchy[role] ?? Number.NEGATIVE_INFINITY))
  );

  return managerLevel > targetLevel;
}
