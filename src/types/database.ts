import type {
  Comment,
  Community,
  CommunityMember,
  Conversation,
  Interest,
  Json,
  Message,
  NotificationRecord,
  Post,
  PostReaction,
  Profile,
  Report,
} from "./domain";

type Insertable<T> = Omit<T, "created_at" | "updated_at"> &
  Partial<Pick<T, Extract<keyof T, "created_at" | "updated_at">>>;
type Updatable<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insertable<Profile>;
        Update: Updatable<Profile>;
      };
      interests: {
        Row: Interest;
        Insert: Omit<Interest, "id"> & { id?: string };
        Update: Partial<Interest>;
      };
      user_interests: {
        Row: { user_id: string; interest_id: string };
        Insert: { user_id: string; interest_id: string };
        Update: never;
      };
      communities: {
        Row: Community;
        Insert: Insertable<Community>;
        Update: Updatable<Community>;
      };
      community_members: {
        Row: CommunityMember;
        Insert: CommunityMember;
        Update: Partial<CommunityMember>;
      };
      posts: {
        Row: Post;
        Insert: Insertable<Post>;
        Update: Updatable<Post>;
      };
      post_reactions: {
        Row: PostReaction;
        Insert: PostReaction;
        Update: never;
      };
      comments: {
        Row: Comment;
        Insert: Insertable<Comment>;
        Update: Updatable<Comment>;
      };
      saved_posts: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string; created_at?: string };
        Update: never;
      };
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string; created_at?: string };
        Update: never;
      };
      conversations: {
        Row: Conversation;
        Insert: Insertable<Conversation>;
        Update: Partial<Conversation>;
      };
      conversation_members: {
        Row: { conversation_id: string; user_id: string; joined_at: string };
        Insert: { conversation_id: string; user_id: string; joined_at?: string };
        Update: never;
      };
      messages: {
        Row: Message;
        Insert: Insertable<Message>;
        Update: Partial<Message>;
      };
      reports: {
        Row: Report;
        Insert: Insertable<Report>;
        Update: Partial<Report>;
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: never;
      };
      notifications: {
        Row: NotificationRecord;
        Insert: Omit<NotificationRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<NotificationRecord>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_or_create_community_conversation: {
        Args: { input_community_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type JsonValue = Json;
