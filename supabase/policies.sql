alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_read_public_safe" on public.profiles;
create policy "profiles_read_public_safe"
on public.profiles for select
using (
  is_banned = false
  and (
    auth.uid() is null
    or id = auth.uid()
    or not public.is_blocked_between(auth.uid(), id)
  )
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and is_banned = false);

drop policy if exists "interests_read_all" on public.interests;
create policy "interests_read_all"
on public.interests for select
using (true);

drop policy if exists "user_interests_read_visible" on public.user_interests;
create policy "user_interests_read_visible"
on public.user_interests for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = user_interests.user_id
      and p.is_banned = false
      and not public.is_blocked_between(auth.uid(), p.id)
  )
);

drop policy if exists "user_interests_manage_self" on public.user_interests;
create policy "user_interests_manage_self"
on public.user_interests for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "communities_read_visible" on public.communities;
create policy "communities_read_visible"
on public.communities for select
using (
  visibility in ('public', 'unlisted')
  or public.is_community_member(id, auth.uid())
);

drop policy if exists "communities_insert_owner" on public.communities;
create policy "communities_insert_owner"
on public.communities for insert
with check (owner_id = auth.uid());

drop policy if exists "communities_update_mods" on public.communities;
create policy "communities_update_mods"
on public.communities for update
using (public.is_community_moderator(id, auth.uid()))
with check (public.is_community_moderator(id, auth.uid()));

drop policy if exists "community_members_read" on public.community_members;
create policy "community_members_read"
on public.community_members for select
using (
  user_id = auth.uid()
  or public.can_read_community(community_id, auth.uid())
);

drop policy if exists "community_members_join_self" on public.community_members;
create policy "community_members_join_self"
on public.community_members for insert
with check (
  user_id = auth.uid()
  and (
    role = 'member'
    or exists (
      select 1 from public.communities c
      where c.id = community_members.community_id
        and c.owner_id = auth.uid()
        and role = 'owner'
    )
  )
);

drop policy if exists "community_members_update_mods" on public.community_members;
create policy "community_members_update_mods"
on public.community_members for update
using (public.is_community_moderator(community_id, auth.uid()))
with check (public.is_community_moderator(community_id, auth.uid()));

drop policy if exists "community_members_leave_or_mod" on public.community_members;
create policy "community_members_leave_or_mod"
on public.community_members for delete
using (
  user_id = auth.uid()
  or public.is_community_moderator(community_id, auth.uid())
);

drop policy if exists "posts_read_visible" on public.posts;
create policy "posts_read_visible"
on public.posts for select
using (
  (
    status = 'published'
    and public.can_read_community(community_id, auth.uid())
    and not public.is_blocked_between(auth.uid(), author_id)
  )
  or public.is_community_moderator(community_id, auth.uid())
);

drop policy if exists "posts_insert_member_self" on public.posts;
create policy "posts_insert_member_self"
on public.posts for insert
with check (
  author_id = auth.uid()
  and public.is_community_member(community_id, auth.uid())
);

drop policy if exists "posts_update_author_or_mod" on public.posts;
create policy "posts_update_author_or_mod"
on public.posts for update
using (
  author_id = auth.uid()
  or public.is_community_moderator(community_id, auth.uid())
)
with check (
  author_id = auth.uid()
  or public.is_community_moderator(community_id, auth.uid())
);

drop policy if exists "posts_delete_author_or_mod" on public.posts;
create policy "posts_delete_author_or_mod"
on public.posts for delete
using (
  author_id = auth.uid()
  or public.is_community_moderator(community_id, auth.uid())
);

drop policy if exists "post_reactions_read_visible" on public.post_reactions;
create policy "post_reactions_read_visible"
on public.post_reactions for select
using (
  exists (
    select 1 from public.posts p
    where p.id = post_reactions.post_id
      and p.status = 'published'
      and public.can_read_community(p.community_id, auth.uid())
  )
);

drop policy if exists "post_reactions_write_self" on public.post_reactions;
create policy "post_reactions_write_self"
on public.post_reactions for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = post_reactions.post_id
      and p.status = 'published'
      and public.can_read_community(p.community_id, auth.uid())
  )
);

drop policy if exists "post_reactions_delete_self" on public.post_reactions;
create policy "post_reactions_delete_self"
on public.post_reactions for delete
using (user_id = auth.uid());

drop policy if exists "comments_read_visible" on public.comments;
create policy "comments_read_visible"
on public.comments for select
using (
  status = 'published'
  and exists (
    select 1 from public.posts p
    where p.id = comments.post_id
      and public.can_read_community(p.community_id, auth.uid())
  )
);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
on public.comments for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = comments.post_id
      and p.status = 'published'
      and public.can_read_community(p.community_id, auth.uid())
  )
);

drop policy if exists "comments_update_author_or_mod" on public.comments;
create policy "comments_update_author_or_mod"
on public.comments for update
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.is_community_moderator(p.community_id, auth.uid())
  )
)
with check (
  author_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.is_community_moderator(p.community_id, auth.uid())
  )
);

drop policy if exists "comments_delete_author_or_mod" on public.comments;
create policy "comments_delete_author_or_mod"
on public.comments for delete
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.is_community_moderator(p.community_id, auth.uid())
  )
);

drop policy if exists "saved_posts_self" on public.saved_posts;
create policy "saved_posts_self"
on public.saved_posts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "follows_read_involving_self" on public.follows;
create policy "follows_read_involving_self"
on public.follows for select
using (follower_id = auth.uid() or following_id = auth.uid());

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self"
on public.follows for insert
with check (
  follower_id = auth.uid()
  and not public.is_blocked_between(follower_id, following_id)
);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self"
on public.follows for delete
using (follower_id = auth.uid());

drop policy if exists "conversations_read_members" on public.conversations;
create policy "conversations_read_members"
on public.conversations for select
using (public.is_conversation_member(id, auth.uid()));

drop policy if exists "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated"
on public.conversations for insert
with check (auth.uid() is not null);

drop policy if exists "conversation_members_read_self" on public.conversation_members;
create policy "conversation_members_read_self"
on public.conversation_members for select
using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "conversation_members_insert_self_or_rpc" on public.conversation_members;
create policy "conversation_members_insert_self_or_rpc"
on public.conversation_members for insert
with check (user_id = auth.uid());

drop policy if exists "messages_read_members" on public.messages;
create policy "messages_read_members"
on public.messages for select
using (
  public.is_conversation_member(conversation_id, auth.uid())
);

drop policy if exists "messages_insert_members_self" on public.messages;
create policy "messages_insert_members_self"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
);

drop policy if exists "messages_update_sender_or_mod" on public.messages;
create policy "messages_update_sender_or_mod"
on public.messages for update
using (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.community_id is not null
      and public.is_community_moderator(c.community_id, auth.uid())
  )
)
with check (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.community_id is not null
      and public.is_community_moderator(c.community_id, auth.uid())
  )
);

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self"
on public.reports for insert
with check (reporter_id = auth.uid());

drop policy if exists "reports_read_reporter_or_mod" on public.reports;
create policy "reports_read_reporter_or_mod"
on public.reports for select
using (
  reporter_id = auth.uid()
  or public.can_moderate_target(target_type, target_id, auth.uid())
);

drop policy if exists "reports_update_mod" on public.reports;
create policy "reports_update_mod"
on public.reports for update
using (public.can_moderate_target(target_type, target_id, auth.uid()))
with check (public.can_moderate_target(target_type, target_id, auth.uid()));

drop policy if exists "blocks_self" on public.blocks;
create policy "blocks_self"
on public.blocks for all
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

drop policy if exists "notifications_self" on public.notifications;
create policy "notifications_self"
on public.notifications for select
using (user_id = auth.uid());

drop policy if exists "notifications_insert_mods" on public.notifications;
create policy "notifications_insert_mods"
on public.notifications for insert
with check (auth.uid() is not null);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id in ('avatars', 'banners', 'post-media', 'community-assets'));

drop policy if exists "avatars_upload_self" on storage.objects;
create policy "avatars_upload_self"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars_update_self" on storage.objects;
create policy "avatars_update_self"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "banners_upload_self" on storage.objects;
create policy "banners_upload_self"
on storage.objects for insert
with check (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "banners_update_self" on storage.objects;
create policy "banners_update_self"
on storage.objects for update
using (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "post_media_upload_author" on storage.objects;
create policy "post_media_upload_author"
on storage.objects for insert
with check (
  bucket_id = 'post-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "community_assets_upload_mods" on storage.objects;
create policy "community_assets_upload_mods"
on storage.objects for insert
with check (
  bucket_id = 'community-assets'
  and public.is_community_moderator(((storage.foldername(name))[1])::uuid, auth.uid())
);

drop policy if exists "community_assets_update_mods" on storage.objects;
create policy "community_assets_update_mods"
on storage.objects for update
using (
  bucket_id = 'community-assets'
  and public.is_community_moderator(((storage.foldername(name))[1])::uuid, auth.uid())
)
with check (
  bucket_id = 'community-assets'
  and public.is_community_moderator(((storage.foldername(name))[1])::uuid, auth.uid())
);
