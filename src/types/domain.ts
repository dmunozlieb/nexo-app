export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Visibility = "public" | "private" | "unlisted";
export type CommunityRole = "owner" | "admin" | "mod" | "helper" | "member";
export type PostType =
  | "debate"
  | "help"
  | "fanart"
  | "poll"
  | "story"
  | "recommendation"
  | "event";
export type ContentStatus = "published" | "hidden" | "deleted";
export type ReactionType = "inspire" | "relate" | "curious" | "support";
export type ConversationType = "direct" | "community";
export type MessageStatus = "sent" | "hidden" | "deleted";
export type ReportTargetType =
  | "post"
  | "comment"
  | "message"
  | "profile"
  | "community";
export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at?: string | null;
  is_banned: boolean;
};

export type Interest = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  visibility: Visibility;
  category: string | null;
  rules: Json;
  created_at: string;
  updated_at: string;
};

export type CommunityMember = {
  community_id: string;
  user_id: string;
  role: CommunityRole;
  joined_at: string;
};

export type Post = {
  id: string;
  community_id: string;
  author_id: string;
  type: PostType;
  title: string | null;
  body: string | null;
  media_urls: string[];
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type PostReaction = {
  post_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  type: ConversationType;
  community_id: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  media_urls: string[];
  status: MessageStatus;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
};

export type CommunityWithMeta = Community & {
  member_count: number;
  online_count?: number | undefined;
  user_role?: CommunityRole | null | undefined;
  recent_post_count?: number | undefined;
  new_posts_count?: number | undefined;
  active_chat?: boolean | undefined;
  event_today?: boolean | undefined;
  mission_active?: boolean | undefined;
};

export type CommunityMemberWithProfile = CommunityMember & {
  profile: Profile | null;
};

export type PostWithMeta = Post & {
  author: Profile | null;
  community: Community | null;
  reaction_counts: Record<ReactionType, number>;
  user_reactions: ReactionType[];
  is_saved: boolean;
  recommendation_reason?: string;
};

export type CommentWithAuthor = Comment & {
  author: Profile | null;
  replies?: CommentWithAuthor[];
};

export type ConversationPreview = Conversation & {
  community: Community | null;
  last_message: Message | null;
  unread_count: number;
};
