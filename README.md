# Nexo

Nexo is an advanced MVP foundation for a community-based social app. Communities are **Orbitas**, posts have their own energy, and reactions are meaningful **Ecos**.

## Technical Decisions

- **Stable Expo SDK 56**: official template with `expo@~56.0.3`, `react-native@0.85.3`, `react@19.2.3`, local Node 24, and Android SDK 36 managed by Expo. This is above Google Play's current target API 35 requirement for new and updated apps since August 31, 2025.
- **Expo Router**: file-based navigation with protected routes and mandatory onboarding.
- **Supabase**: Auth, PostgreSQL, Realtime, Storage, RLS, and an optional Edge Function for moderation actions.
- **TanStack Query**: caching, pagination, invalidation, and server state.
- **Zustand**: minimal local state, currently light/dark theme.
- **React Hook Form + Zod**: forms with shared validation and safety limits.
- **Custom token-based styling system**: a NativeWind-equivalent alternative to avoid compatibility risk on a newly released SDK while keeping tokens centralized, responsive, and reusable.

## Requirements

- Node >= 22.13.0.
- npm >= 10.
- Expo CLI via `npx expo`.
- Supabase CLI if you want to run the backend locally.
- EAS CLI for builds and submission.

## Configuration

1. Create `.env` from `.env.example`.
2. Set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

3. In Supabase, apply the migrations and seed.
4. Enable Email/Password in Auth. Google OAuth is prepared in the service layer, but it requires configuring the provider and redirect URLs.

### Demo Mode Without Docker

If you cannot use Docker/WSL, enable:

```bash
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key
```

With this mode, you can sign in and move through screens using local in-memory data. The real Supabase setup remains untouched for cloud or local Docker usage.

## Commands

```bash
npm install
npx expo start
npx supabase start
npx supabase db reset
npm run typecheck
npm test
eas build --platform android --profile production
eas submit --platform android
```

## Structure

- `app/`: Expo Router routes.
- `src/components/`: reusable UI and layout.
- `src/features/`: auth, feed, communities, posts, comments, chat, profile, search, moderation, settings.
- `src/lib/`: Supabase and Query Client.
- `src/theme/`: tokens and theme.
- `supabase/`: migrations, RLS, seed, and optional Edge Function.
- `docs/`: architecture, privacy, moderation, and Play Store.
- `tests/`: validations and utilities.

## Local Supabase

The seed demo credentials are:

- `luna@nexo.local` / `Password123!`
- `kai@nexo.local` / `Password123!`
- `iris@nexo.local` / `Password123!`

The seed creates interests, profiles, Orbitas, members, posts, comments, reactions, rooms, and messages.

## Minimum Manual QA

- Register with email/password.
- Log in and keep a persistent session.
- Onboarding: username, interests, and optional avatar.
- Discover Orbitas and join one.
- Create a post with energy and a target Orbita.
- React with Ecos.
- Save a post.
- Comment and reply to a comment.
- Open a chat room and send a realtime message.
- Report a post, comment, message, profile, or community.
- Block a user from their profile.
- Review the moderation queue as mod/owner.
- Edit profile.
- Change theme.
- Log out.

## Production Notes

- Private keys must not be exposed. The app only uses `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- RLS is mandatory: the client does not decide sensitive permissions.
- Privacy policy, terms, support, and the Data Safety form still need to be connected before publishing.
- For real push notifications, create an EAS project, configure FCM/APNs, and Expo Notifications channels.
- For stronger rate limiting, move sensitive actions to Edge Functions with user checks and IP/user limits.
- `npm audit` shows moderate transitive warnings in Expo tooling for `uuid` via `@expo/config-plugins`; do not run `npm audit fix --force` because it proposes downgrading Expo in an incompatible way.
