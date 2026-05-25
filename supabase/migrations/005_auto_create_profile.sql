-- Auto-create a public.profiles row whenever a new auth.users row is inserted.
-- Username is temporary (`nexo_<shortid>`) so isProfileComplete() returns false
-- and the client routes the user to /onboarding to finish setup.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  short_id text := substr(replace(new.id::text, '-', ''), 1, 10);
  temp_username text := 'nexo_' || short_id;
  meta_display_name text := nullif(new.raw_user_meta_data ->> 'display_name', '');
  meta_full_name text := nullif(new.raw_user_meta_data ->> 'full_name', '');
  meta_name text := nullif(new.raw_user_meta_data ->> 'name', '');
  meta_avatar text := nullif(new.raw_user_meta_data ->> 'avatar_url', '');
  meta_picture text := nullif(new.raw_user_meta_data ->> 'picture', '');
  resolved_display_name text := coalesce(meta_display_name, meta_full_name, meta_name);
  resolved_avatar text := coalesce(meta_avatar, meta_picture);
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, temp_username, resolved_display_name, resolved_avatar)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Seed default interests so the onboarding step 3 always has options to pick.
insert into public.interests (id, name, slug, icon)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Arte', 'arte', 'art'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Gaming', 'gaming', 'game'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Lectura', 'lectura', 'book'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Musica', 'musica', 'music'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Tecnologia', 'tecnologia', 'code'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Cine', 'cine', 'film')
on conflict (id) do nothing;
