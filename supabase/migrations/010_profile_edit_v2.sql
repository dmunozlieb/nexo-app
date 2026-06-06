-- 010_profile_edit_v2.sql
-- Edit-profile backend: long bio, accent color, safe links, username cooldown.

-- 1. Bio: relax 160 -> 2000.
-- The original constraint was defined inline in 001 and named by Postgres as
-- "profiles_bio_check". Drop it (if present) and recreate with an explicit name.
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles
  add constraint profiles_bio_check
  check (bio is null or char_length(bio) <= 2000);

-- 2. New columns.
alter table public.profiles
  add column if not exists username_changed_at timestamptz,
  add column if not exists accent_color text,
  add column if not exists links jsonb not null default '[]'::jsonb;

-- accent_color: hex #RRGGBB (added separately so re-runs don't duplicate the constraint).
alter table public.profiles drop constraint if exists profiles_accent_color_check;
alter table public.profiles
  add constraint profiles_accent_color_check
  check (accent_color is null or accent_color ~* '^#[0-9a-f]{6}$');

-- links: must be a JSON array of at most 5 elements (per-element shape validated in app layer).
alter table public.profiles drop constraint if exists profiles_links_check;
alter table public.profiles
  add constraint profiles_links_check
  check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 5);

-- 3. Username change cooldown: 90 days, enforced in DB (cannot be bypassed by the client).
create or replace function public.enforce_username_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null
       and old.username_changed_at > now() - interval '90 days' then
      raise exception 'USERNAME_COOLDOWN'
        using detail = to_char(old.username_changed_at + interval '90 days', 'YYYY-MM-DD');
    end if;
    new.username_changed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_username_cooldown on public.profiles;
create trigger enforce_username_cooldown
before update on public.profiles
for each row execute function public.enforce_username_cooldown();
