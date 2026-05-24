import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import {
  createCommunity,
  getCommunity,
  getCommunityMembership,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listCommunityMembers,
  listCommunityPosts,
  listJoinedCommunities,
} from "../services/communities-service";

export function useCommunities(query?: string, category?: string) {
  return useQuery({
    queryKey: ["communities", query, category],
    queryFn: () => listCommunities({ query, category }),
  });
}

export function useCommunity(communityIdOrSlug?: string) {
  return useQuery({
    queryKey: ["community", communityIdOrSlug],
    queryFn: () => getCommunity(communityIdOrSlug ?? ""),
    enabled: Boolean(communityIdOrSlug),
  });
}

export function useCommunityMembership(communityId?: string, userId?: string) {
  return useQuery({
    queryKey: ["community-membership", communityId, userId],
    queryFn: () => getCommunityMembership(communityId ?? "", userId ?? ""),
    enabled: Boolean(communityId && userId),
  });
}

export function useJoinedCommunities(userId?: string) {
  return useQuery({
    queryKey: ["joined-communities", userId],
    queryFn: () => listJoinedCommunities(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useCommunityMembers(communityId?: string) {
  return useQuery({
    queryKey: ["community-members", communityId],
    queryFn: () => listCommunityMembers(communityId ?? ""),
    enabled: Boolean(communityId),
  });
}

export function useCommunityPosts(communityId?: string, userId?: string | null) {
  return useQuery({
    queryKey: ["community-posts", communityId, userId],
    queryFn: () => listCommunityPosts({ communityId: communityId ?? "", userId }),
    enabled: Boolean(communityId),
  });
}

export function useJoinCommunityMutation(communityId: string, userId: string) {
  return useMutation({
    mutationFn: () => joinCommunity(communityId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      await queryClient.invalidateQueries({
        queryKey: ["community-membership", communityId, userId],
      });
      await queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
      await queryClient.invalidateQueries({ queryKey: ["joined-communities", userId] });
    },
  });
}

export function useCreateCommunityMutation(userId?: string) {
  return useMutation({
    mutationFn: (input: Parameters<typeof createCommunity>[0]) =>
      createCommunity(input, userId ?? ""),
    onSuccess: async (community) => {
      await queryClient.invalidateQueries({ queryKey: ["communities"] });
      await queryClient.invalidateQueries({ queryKey: ["joined-communities", userId] });
      await queryClient.invalidateQueries({ queryKey: ["community", community.id] });
    },
  });
}

export function useLeaveCommunityMutation(communityId: string, userId: string) {
  return useMutation({
    mutationFn: () => leaveCommunity(communityId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      await queryClient.invalidateQueries({
        queryKey: ["community-membership", communityId, userId],
      });
      await queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
      await queryClient.invalidateQueries({ queryKey: ["joined-communities", userId] });
    },
  });
}
