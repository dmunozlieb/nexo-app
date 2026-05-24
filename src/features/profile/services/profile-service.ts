import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoBlockProfile,
  demoFollowProfile,
  demoGetProfileById,
  demoListProfilePostsInCommunity,
  demoListProfilePosts,
  demoUnfollowProfile,
  demoUpdateProfile,
} from "../../../services/demo-service";
import type { PostWithMeta, Profile } from "../../../types/domain";
import type { ProfileInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";
import { mapPostRow } from "../../posts/services/post-mapper";

export async function getProfileById(profileId: string) {
  if (env.demoMode) {
    return demoGetProfileById(profileId);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function listProfilePosts(profileId: string, viewerId?: string | null) {
  if (env.demoMode) {
    return demoListProfilePosts(profileId, viewerId);
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(*), community:communities(*), reactions:post_reactions(reaction,user_id), saved_posts(user_id)",
    )
    .eq("author_id", profileId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPostRow(row, viewerId)) as PostWithMeta[];
}

export async function listProfilePostsInCommunity({
  profileId,
  communityId,
  viewerId,
}: {
  profileId: string;
  communityId: string;
  viewerId?: string | null | undefined;
}) {
  if (env.demoMode) {
    return demoListProfilePostsInCommunity({ profileId, communityId, viewerId });
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(*), community:communities(*), reactions:post_reactions(reaction,user_id), saved_posts(user_id)",
    )
    .eq("author_id", profileId)
    .eq("community_id", communityId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPostRow(row, viewerId)) as PostWithMeta[];
}

export async function updateProfile(
  profileId: string,
  input: ProfileInput,
) {
  if (env.demoMode) {
    return demoUpdateProfile(profileId, input);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      display_name: sanitizePlainText(input.displayName),
      bio: input.bio ? sanitizePlainText(input.bio) : null,
      avatar_url: input.avatarUrl ?? null,
      banner_url: input.bannerUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function followProfile({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (env.demoMode) {
    return demoFollowProfile({ followerId, followingId });
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function unfollowProfile({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (env.demoMode) {
    return demoUnfollowProfile({ followerId, followingId });
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    throw error;
  }
}

export async function blockProfile({
  blockerId,
  blockedId,
}: {
  blockerId: string;
  blockedId: string;
}) {
  if (env.demoMode) {
    return demoBlockProfile({ blockerId, blockedId });
  }

  const { error } = await supabase.from("blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
