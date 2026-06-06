# Edit Perfil — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend/data support for editing a user profile — long bio (2000), avatar, full-screen background (`banner_url`), accent color, safe links (https-only, max 5), and a 90-day username change cooldown enforced by a DB trigger.

**Architecture:** One new Supabase migration extends `public.profiles` (relax bio constraint, add `username_changed_at`, `accent_color`, `links` jsonb) and installs a `before update` trigger that enforces the 90-day username cooldown. The app layer (Zod validation, profile service, domain types, demo service) is extended to read/write the new fields. No screen/UI work is in scope.

**Tech Stack:** Supabase/Postgres (SQL migrations), TypeScript (strict), Zod, Jest (jest-expo), React Native / Expo.

**Branch:** `redesign/edit-profile` · **Spec:** `docs/superpowers/specs/2026-06-06-edit-profile-backend-design.md`

**Validation gate (this repo):** `npm run typecheck` and `npm test`. `npm run lint` is broken in this environment — do NOT rely on it. Commits omit the `Co-Authored-By` signature.

---

## File Structure

- **Create:** `supabase/migrations/010_profile_edit_v2.sql` — schema changes + cooldown trigger.
- **Modify:** `src/types/domain.ts` — add `ProfileLink` type and `Profile` fields.
- **Modify:** `src/utils/validation.ts` — accent color + links schemas, bio→2000, extend `profileSchema`, export `ProfileLink` inferred type alias.
- **Modify:** `src/features/profile/services/profile-service.ts` — persist `accent_color`/`links`, sanitize labels, map cooldown error.
- **Modify:** `src/services/demo-service.ts` — reflect `accent_color`/`links` in `demoUpdateProfile`.
- **Modify:** `tests/validation.test.ts` — unit tests for the new/changed schemas (TDD).

> Note: `ProfileInput` is `z.infer<typeof profileSchema>` (validation.ts:145). Adding fields to `profileSchema` automatically widens `ProfileInput`, which both `profile-service.ts` and `demo-service.ts` consume. Keep the validation field names (`accentColor`, `links`) consistent everywhere.

---

## Task 1: Migration — schema changes + cooldown trigger

**Files:**
- Create: `supabase/migrations/010_profile_edit_v2.sql`

There is no SQL test harness in this repo (data layer is exercised via demo mode), so this task is verified by structural review, not an automated test. The migration is applied by the Supabase GitHub integration on push to `main`; it must be idempotent and safe to re-run.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/010_profile_edit_v2.sql` with exactly:

```sql
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
```

- [ ] **Step 2: Review the migration for correctness**

Confirm by reading the file:
- Every `alter` uses `if exists` / `if not exists` (idempotent re-runs).
- `enforce_username_cooldown` is `create or replace` and the trigger is dropped before create.
- The cooldown only fires when `username` actually changes (`is distinct from`).
- It coexists with the existing `set_profiles_updated_at` trigger (both `before update`, independent).

Expected: all four points hold.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/010_profile_edit_v2.sql
git commit -m "Add migration 010: long bio, accent color, links, username cooldown"
```

---

## Task 2: Domain types

**Files:**
- Modify: `src/types/domain.ts:46-57` (the `Profile` type)

- [ ] **Step 1: Add `ProfileLink` and extend `Profile`**

In `src/types/domain.ts`, immediately before `export type Profile = {` (line 46), add:

```ts
export type ProfileLink = { label: string; url: string };
```

Then inside `Profile`, after the `is_banned: boolean;` line, add the three optional fields so the type reads:

```ts
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
```

- [ ] **Step 2: Verify typecheck still passes**

Run: `npm run typecheck`
Expected: PASS (optional fields don't break existing consumers).

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts
git commit -m "Add ProfileLink type and accent_color/links/username_changed_at to Profile"
```

---

## Task 3: Validation schemas (TDD)

**Files:**
- Test: `tests/validation.test.ts`
- Modify: `src/utils/validation.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/validation.test.ts`, add `profileSchema` to the import from `../src/utils/validation` (line 3-9 import block becomes):

```ts
import {
  authLoginSchema,
  authRegisterSchema,
  commentSchema,
  postFormSchema,
  profileSchema,
  usernameSchema,
} from "../src/utils/validation";
```

Then add this block inside the top-level `describe` (before its closing `});` on line 70):

```ts
  it("acepta una bio larga de hasta 2000 caracteres", () => {
    const parsed = profileSchema.parse({
      displayName: "Luna",
      username: "luna_123",
      bio: "x".repeat(2000),
      accentColor: null,
      links: [],
    });
    expect(parsed.bio?.length).toBe(2000);
  });

  it("rechaza una bio de mas de 2000 caracteres", () => {
    expect(() =>
      profileSchema.parse({
        displayName: "Luna",
        username: "luna_123",
        bio: "x".repeat(2001),
        accentColor: null,
        links: [],
      }),
    ).toThrow();
  });

  it("acepta accent color hex valido y rechaza el invalido", () => {
    expect(
      profileSchema.parse({
        displayName: "Luna",
        username: "luna_123",
        bio: null,
        accentColor: "#A1B2C3",
        links: [],
      }).accentColor,
    ).toBe("#A1B2C3");

    expect(() =>
      profileSchema.parse({
        displayName: "Luna",
        username: "luna_123",
        bio: null,
        accentColor: "rojo",
        links: [],
      }),
    ).toThrow();
  });

  it("acepta links https con label y rechaza http", () => {
    const parsed = profileSchema.parse({
      displayName: "Luna",
      username: "luna_123",
      bio: null,
      accentColor: null,
      links: [{ label: "Mi web", url: "https://luna.example" }],
    });
    expect(parsed.links?.[0]?.url).toBe("https://luna.example");

    expect(() =>
      profileSchema.parse({
        displayName: "Luna",
        username: "luna_123",
        bio: null,
        accentColor: null,
        links: [{ label: "Inseguro", url: "http://luna.example" }],
      }),
    ).toThrow();
  });

  it("rechaza mas de 5 links", () => {
    const link = { label: "x", url: "https://a.example" };
    expect(() =>
      profileSchema.parse({
        displayName: "Luna",
        username: "luna_123",
        bio: null,
        accentColor: null,
        links: [link, link, link, link, link, link],
      }),
    ).toThrow();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- validation`
Expected: FAIL — `profileSchema` rejects unknown fields / has bio max 160 / has no `accentColor` or `links`.

- [ ] **Step 3: Implement the schema changes**

In `src/utils/validation.ts`, add these two schemas immediately above `export const profileSchema` (line 55):

```ts
export const accentColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usa un color hex valido (#RRGGBB).");

const profileLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "La etiqueta no puede estar vacia.")
    .max(40, "La etiqueta no puede superar 40 caracteres."),
  url: z
    .string()
    .trim()
    .max(200, "El enlace no puede superar 200 caracteres.")
    .url("Introduce un enlace valido.")
    .refine((value) => value.startsWith("https://"), "Solo se permiten enlaces https seguros."),
});

export const linksSchema = z
  .array(profileLinkSchema)
  .max(5, "Maximo 5 enlaces.");
```

Then replace the whole `profileSchema` definition (lines 55-65) with:

```ts
export const profileSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  // El edit perfil permite una bio larga (2000). El onboarding mantiene 160 a proposito.
  bio: z
    .string()
    .trim()
    .max(2000, "La bio no puede superar 2000 caracteres.")
    .nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  accentColor: accentColorSchema.nullable().optional(),
  links: linksSchema.optional(),
});
```

Finally, add the inferred link type next to the other type exports (after `export type ProfileInput = ...`, line 145):

```ts
export type ProfileLinkInput = z.infer<typeof profileLinkSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- validation`
Expected: PASS (all new cases plus the pre-existing ones).

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/validation.ts tests/validation.test.ts
git commit -m "Validate long bio, accent color and safe https links in profileSchema"
```

---

## Task 4: Profile service — persist new fields + map cooldown error

**Files:**
- Modify: `src/features/profile/services/profile-service.ts:88-115` (the `updateProfile` function)

- [ ] **Step 1: Persist accent_color/links and map the cooldown error**

Replace the entire `updateProfile` function (lines 88-115) with:

```ts
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
      accent_color: input.accentColor ?? null,
      links: (input.links ?? []).map((link) => ({
        label: sanitizePlainText(link.label),
        url: link.url,
      })),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) {
    // El trigger de cooldown lanza "USERNAME_COOLDOWN" con la fecha de desbloqueo en details.
    if (error.message?.includes("USERNAME_COOLDOWN")) {
      const unlockDate = error.details ?? null;
      throw new Error(
        unlockDate
          ? `Podras cambiar tu username de nuevo el ${unlockDate}.`
          : "Solo puedes cambiar tu username una vez cada 90 dias.",
      );
    }
    throw error;
  }

  return data as Profile;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS. (`error.details` exists on Supabase's `PostgrestError`; `input.accentColor`/`input.links` exist via the widened `ProfileInput`.)

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/services/profile-service.ts
git commit -m "Persist accent color and links; surface username cooldown error"
```

---

## Task 5: Demo service — reflect new fields

**Files:**
- Modify: `src/services/demo-service.ts:1329-1341` (the `demoUpdateProfile` function)

- [ ] **Step 1: Reflect accent_color and links in demo profile**

Replace the body of `demoUpdateProfile` (lines 1329-1341) with:

```ts
export async function demoUpdateProfile(
  profileId: string,
  input: ProfileInput,
) {
  const profile = findProfile(profileId);
  profile.username = input.username;
  profile.display_name = sanitizePlainText(input.displayName);
  profile.bio = input.bio ? sanitizePlainText(input.bio) : null;
  profile.avatar_url = input.avatarUrl ?? null;
  profile.banner_url = input.bannerUrl ?? null;
  profile.accent_color = input.accentColor ?? null;
  profile.links = (input.links ?? []).map((link) => ({
    label: sanitizePlainText(link.label),
    url: link.url,
  }));
  // Nota: el cooldown de username solo aplica en Supabase real (lo enforce el trigger en BD).
  profile.updated_at = now();
  return profile;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS (`accent_color` and `links` are now valid `Profile` fields from Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/services/demo-service.ts
git commit -m "Reflect accent color and links in demo profile update"
```

---

## Task 6: Final full validation

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Confirm spec coverage**

Re-read `docs/superpowers/specs/2026-06-06-edit-profile-backend-design.md` sections 4-6 and confirm each requirement maps to a task: bio 2000 (T1/T3), `username_changed_at` + cooldown trigger (T1), `accent_color` (T1/T3), `links` jsonb ≤5 (T1/T3), https-only links (T3), service persistence + sanitization + cooldown error (T4), domain types (T2), demo mode (T5).

Expected: every requirement is covered.

---

## Out of scope (documented as future improvements in the spec)

Pronouns, headline/tagline, username history table, domain allowlist / URL-shortener blocking, case-insensitive username uniqueness, renaming `banner_url`→`background_url`, and all UI/screen work. Do not implement these.
