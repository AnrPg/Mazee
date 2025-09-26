import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../api"
import type { UpdateProfileRequest, Profile } from "../types"
import { toast } from "../hooks/use-toast"

// Query keys
export const profileKeys = {
  all: ["profiles"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (userId: string) => [...profileKeys.details(), userId] as const,
  handleCheck: (handle: string) => [...profileKeys.all, "handle", handle] as const,
}

// Get profile
export function useProfile(userId: string) {
  return useQuery<Profile>({
    queryKey: profileKeys.detail(userId),
    queryFn: async () => {
      const response = await apiClient.getProfile(userId)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data! as Profile
    },
    enabled: !!userId,
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, { userId: string; profileData: UpdateProfileRequest }>({
    mutationFn: async ({ userId, profileData }: { userId: string; profileData: UpdateProfileRequest }) => {
      const response = await apiClient.updateProfile(userId, profileData)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data! as Profile
    },
    onSuccess: (updatedProfile: Profile, { userId }: { userId: string; profileData: UpdateProfileRequest }) => {
      // Update profile in cache
      queryClient.setQueryData(profileKeys.detail(userId), updatedProfile)
      // Also update the user cache if it exists
      queryClient.invalidateQueries({ queryKey: ["users", "detail", userId] })
      toast({
        title: "Profile updated",
        description: "Profile has been successfully updated",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Check handle availability
export function useHandleAvailability(handle: string) {
  return useQuery<{ available: boolean; suggestion?: string }>({
    queryKey: profileKeys.handleCheck(handle),
    queryFn: async () => {
      const response = await apiClient.checkHandleAvailability(handle)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data! as { available: boolean; suggestion?: string }
    },
    enabled: !!handle && handle.length >= 3,
    staleTime: 30 * 1000, // 30 seconds
  })
}
