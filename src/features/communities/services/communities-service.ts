import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCreateCommunity,
  demoGetCommunity,
  demoGetCommunityMembership,
  demoJoinCommunity,
  demoLeaveCommunity,
  demoListCommunities,
  demoListCommunityMembers,
  demoListCommunityPosts,
  demoListJoinedCommunities,
} from "../../../services/demo-service";
import type {
  CommunityMemberWithProfile,
  CommunityRole,
  CommunityWithMeta,
  PostWithMeta,
} from "../../../types/domain";
import type { CreateCommunityInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";
import { createSlug } from "../../../utils/slug";
import { mapPostRow } from "../../posts/services/post-mapper";

function mapCommunity(row: unknown): CommunityWithMeta {
  const source = row as Record<string, unknown>;
  const members = (source.community_members ?? []) as Array<{
    count?: number;
    role?: CommunityRole;
  }>;
  const firstMember = members[0];
  const postRows = (source.posts ?? []) as Array<{ count?: number }>;
  const recentPostCount = postRows[0]?.count;
  const memberCount = firstMember?.count ?? 0;

  return {
    ...(source as unknown as CommunityWithMeta),
    member_count: memberCount,
    online_count: Math.max(1, Math.ceil(memberCount * 0.35)),
    user_role: firstMember?.role ?? null,
    recent_post_count: recentPostCount,
  };
}

export async function listCommunities(params?: {
  query?: string | undefined;
  category?: string | undefined;
}) {
  if (env.demoMode) {
    return demoListCommunities(params);
  }

  let query = supabase
    .from("communities")
    .select("*, community_members(count), posts(count)")
    .in("visibility", ["public", "unlisted"])
    .order("created_at", { ascending: false });

  if (params?.query) {
    query = query.or(
      `name.ilike.%${params.query}%,description.ilike.%${params.query}%,category.ilike.%${params.query}%`,
    );
  }

  if (params?.category) {
    query = query.eq("category", params.category);
  }

  const { data, error } = await query.limit(40);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCommunity);
}

export async function createCommunity(
  input: CreateCommunityInput,
  ownerId: string,
) {
  if (env.demoMode) {
    return demoCreateCommunity(input, ownerId);
  }

  const slug = `${createSlug(input.name) || "orbita"}-${Date.now().toString(36)}`;
  const rules = input.rulesText
    ? input.rulesText
        .split("\n")
        .map((rule) => sanitizePlainText(rule).trim())
        .filter(Boolean)
    : [
        "Respeta a otras personas.",
        "Evita spam.",
        "Reporta contenido de riesgo.",
      ];

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({
      slug,
      name: sanitizePlainText(input.name),
      description: sanitizePlainText(input.description),
      avatar_url: input.avatarUrl ?? null,
      banner_url: input.bannerUrl ?? null,
      owner_id: ownerId,
      visibility: input.visibility,
      category: sanitizePlainText(input.category),
      rules,
    })
    .select("*, community_members(count), posts(count)")
    .single();

  if (communityError) {
    throw communityError;
  }

  const { error: memberError } = await supabase
    .from("community_members")
    .insert({
      community_id: community.id,
      user_id: ownerId,
      role: "owner",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    throw memberError;
  }

  await supabase.rpc("get_or_create_community_conversation", {
    input_community_id: community.id,
  });

  return mapCommunity(community);
}

export async function getCommunity(communityIdOrSlug: string) {
  if (env.demoMode) {
    return demoGetCommunity(communityIdOrSlug);
  }

  const { data, error } = await supabase
    .from("communities")
    .select("*, community_members(count), posts(count)")
    .or(`id.eq.${communityIdOrSlug},slug.eq.${communityIdOrSlug}`)
    .single();

  if (error) {
    throw error;
  }

  return mapCommunity(data);
}

export async function getCommunityMembership(
  communityId: string,
  userId: string,
) {
  if (env.demoMode) {
    return demoGetCommunityMembership(communityId, userId);
  }

  const { data, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listJoinedCommunities(userId: string) {
  if (env.demoMode) {
    return demoListJoinedCommunities(userId);
  }

  const { data, error } = await supabase
    .from("community_members")
    .select("role, communities(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...(row as unknown as { communities: CommunityWithMeta }).communities,
    user_role: (row as unknown as { role: CommunityRole }).role,
    member_count: 0,
  }));
}

export async function listCommunityMembers(
  communityId: string,
): Promise<CommunityMemberWithProfile[]> {
  if (env.demoMode) {
    return demoListCommunityMembers(communityId);
  }

  const { data, error } = await supabase
    .from("community_members")
    .select("*, profile:profiles(*)")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as CommunityMemberWithProfile[];
}

export async function joinCommunity(communityId: string, userId: string) {
  if (env.demoMode) {
    return demoJoinCommunity(communityId, userId);
  }

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: userId,
    role: "member",
    joined_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function leaveCommunity(communityId: string, userId: string) {
  if (env.demoMode) {
    return demoLeaveCommunity(communityId, userId);
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function listCommunityPosts({
  communityId,
  userId,
}: {
  communityId: string;
  userId?: string | null | undefined;
}) {
  if (env.demoMode) {
    return demoListCommunityPosts({ communityId, userId });
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(*), community:communities(*), reactions:post_reactions(reaction,user_id), saved_posts(user_id)",
    )
    .eq("community_id", communityId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPostRow(row, userId));
}
