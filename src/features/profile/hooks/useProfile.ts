import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import {
  blockProfile,
  followProfile,
  getProfileById,
  listProfilePostsInCommunity,
  listProfilePosts,
  unfollowProfile,
  updateProfile,
} from "../services/profile-service";

export function useProfileById(profileId?: string) {
  return useQuery({
    queryKey: ["profile", profileId],
    queryFn: () => getProfileById(profileId ?? ""),
    enabled: Boolean(profileId),
  });
}

export function useProfilePosts(profileId?: string, viewerId?: string | null) {
  return useQuery({
    queryKey: ["profile-posts", profileId, viewerId],
    queryFn: () => listProfilePosts(profileId ?? "", viewerId),
    enabled: Boolean(profileId),
  });
}

export function useCommunityProfilePosts(
  profileId?: string,
  communityId?: string,
  viewerId?: string | null,
) {
  return useQuery({
    queryKey: ["profile-posts", profileId, communityId, viewerId],
    queryFn: () =>
      listProfilePostsInCommunity({
        profileId: profileId ?? "",
        communityId: communityId ?? "",
        viewerId,
      }),
    enabled: Boolean(profileId && communityId),
  });
}

export function useUpdateProfileMutation(profileId?: string) {
  return useMutation({
    mutationFn: (input: Parameters<typeof updateProfile>[1]) =>
      updateProfile(profileId ?? "", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", profileId] });
    },
  });
}

export function useFollowMutation(viewerId?: string) {
  return useMutation({
    mutationFn: (profileId: string) =>
      followProfile({ followerId: viewerId ?? "", followingId: profileId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useUnfollowMutation(viewerId?: string) {
  return useMutation({
    mutationFn: (profileId: string) =>
      unfollowProfile({ followerId: viewerId ?? "", followingId: profileId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useBlockProfileMutation(viewerId?: string) {
  return useMutation({
    mutationFn: (profileId: string) =>
      blockProfile({ blockerId: viewerId ?? "", blockedId: profileId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
