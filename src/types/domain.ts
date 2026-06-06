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
export type ChatVisibility = "public" | "invite_only";
export type ChatRole = "admin" | "co_admin" | "member" | "banned";
export type ChatAuditAction =
  | "chat_created"
  | "chat_updated"
  | "chat_deleted"
  | "role_granted"
  | "role_revoked"
  | "admin_transferred"
  | "member_kicked"
  | "member_banned"
  | "member_unbanned"
  | "message_pinned"
  | "message_unpinned"
  | "slow_mode_changed";
export type MessageStatus = "sent" | "hidden" | "deleted";
export type ReportTargetType =
  | "post"
  | "comment"
  | "message"
  | "profile"
  | "community";
export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected";

export type ProfileLink = { label: string; url: string };

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
  username_changed_at?: string | null;
  accent_color?: string | null;
  links?: ProfileLink[];
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
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  background_url: string | null;
  created_by: string | null;
  visibility: ChatVisibility;
  slow_mode_seconds: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  role: ChatRole;
  muted: boolean;
  last_read_at: string | null;
  joined_at: string;
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

export type ChatPinnedMessage = {
  conversation_id: string;
  message_id: string;
  pinned_by: string | null;
  pinned_at: string;
};

export type MessageReaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type ChatAuditEntry = {
  id: string;
  conversation_id: string;
  actor_id: string | null;
  action: ChatAuditAction;
  target_id: string | null;
  metadata: Json;
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
  member_count: number;
  role: ChatRole | null;
};

export type ConversationMemberWithProfile = ConversationMember & {
  profile: Profile | null;
};

export type MessageWithMeta = Message & {
  sender: Profile | null;
  reactions: Array<{ emoji: string; count: number; reacted_by_me: boolean }>;
  is_pinned: boolean;
};

export type ChatDetails = {
  conversation: Conversation;
  members: ConversationMemberWithProfile[];
  pinned_messages: MessageWithMeta[];
  current_user_role: ChatRole | null;
};
