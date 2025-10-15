"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../api"
import type { CreateUserRequest, UpdateUserRequest } from "../types"
import { toast } from "../hooks/use-toast"

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: { limit?: number; after?: string }) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// Get users list with pagination
export function useUsers(params?: { limit?: number; after?: string }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.getUsers(params)
      if (response.error) {
        throw new Error(response.error)
      }
      // Normalize to { data, next? }, in case backend returns either [] or { data: [] }
      const payload = response.data as any
      if (!payload) return { data: [] }
      if (Array.isArray(payload)) return { data: payload }
      if (Array.isArray(payload.data)) return { data: payload.data, next: payload.next }
      return { data: [] }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const response = await apiClient.getUser(userId)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data!
    },
    enabled: !!userId,
  })
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const response = await apiClient.createUser(userData)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data!
    },
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast({
        title: "User created",
        description: `Successfully created user ${newUser.handle}`,
      })
    },
    onError: (error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) => {
      const response = await apiClient.updateUser(userId, userData)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data!
    },
    onSuccess: (updatedUser, { userId }) => {
      // Update the user in cache
      queryClient.setQueryData(userKeys.detail(userId), updatedUser)
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast({
        title: "User updated",
        description: `Successfully updated user ${updatedUser.handle}`,
      })
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.deleteUser(userId)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    },
    onSuccess: (_, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) })
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast({
        title: "User deleted",
        description: "User has been successfully deactivated",
      })
    },
    onError: (error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
