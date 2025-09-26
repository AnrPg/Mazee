import { z } from "zod"

export type UserStatus = "active" | "disabled" | "deleted"
export type ProfileVisibility = "public" | "synaxis" | "private"
export type UserRole = "user" | "admin" | "craftsman" | "clergy" | "moderator"

// Zod schemas for validation
export const userStatusSchema = z.enum(["active", "disabled", "deleted"])
export const profileVisibilitySchema = z.enum(["public", "synaxis", "private"])
export const userRoleSchema = z.enum(["user", "admin", "craftsman", "clergy", "moderator"])

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  email_verified: z.boolean(),
  handle: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]{3,32}$/),
  roles: z.array(userRoleSchema),
  status: userStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const profileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string().max(120).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional(),
  location: z.string().max(120).optional(),
  role: userRoleSchema,
  visibility: profileVisibilitySchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const userWithProfileSchema = userSchema.extend({
  profile: profileSchema.optional(),
})

// API request/response schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  handle: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]{3,32}$/),
  display_name: z.string().max(120).optional(),
  roles: z.array(userRoleSchema).default(["user"]),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  handle: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]{3,32}$/)
    .optional(),
  roles: z.array(userRoleSchema).optional(),
  status: userStatusSchema.optional(),
})

export const updateProfileSchema = z.object({
  display_name: z.string().max(120).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional(),
  location: z.string().max(120).optional(),
  visibility: profileVisibilitySchema.optional(),
})

// TypeScript types
export type User = z.infer<typeof userSchema>
export type Profile = z.infer<typeof profileSchema>
export type UserWithProfile = z.infer<typeof userWithProfileSchema>
export type CreateUserRequest = z.infer<typeof createUserSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}
