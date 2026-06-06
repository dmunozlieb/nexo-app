# Perfil — Banner real + Fondo derivado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `banner_url` into a real cover banner (immersive hero over the avatar) and derive the full-screen profile background from that same image (blurred top glow), looking good on mobile and desktop. No backend changes.

**Architecture:** Two new components — `ProfileHero` (banner + centered spinning-ring avatar + name/handle, reused by the profile card and the edit preview) and `DerivedBackdrop` (blurred banner top-glow fading into the cosmic stars). Wire them into `ProfileScreen`, `LivePreviewHeader`, `EditProfileScreen`. `banner_url` keeps its single field; it is reinterpreted as the banner and the background is derived at render time.

**Tech Stack:** Expo/React Native 0.85, TS strict, expo-image, expo-blur (BlurView, already a dep), expo-linear-gradient, Animated API, useReducedMotion.

**Branch:** `redesign/edit-profile` · **Spec:** `docs/superpowers/specs/2026-06-06-profile-banner-derived-background-design.md`

**Validation gate:** `npm run typecheck` + `npm test` + `npx expo export --platform web`. `npm run lint` is broken — don't use it. `noUnusedLocals` is NOT enabled (expo base tsconfig), so leftover dead code/imports won't fail typecheck — but remove what this change makes dead, for cleanliness. Commits omit the `Co-Authored-By` signature.

**Existing facts:**
- `NebulaBackdrop` (`src/components/ui/NebulaBackdrop.tsx`): props `source`, `dim?`, `style?`, `children?`; absolute full-fill image + dim veil.
- `CosmicBackground` (`src/components/ui/CosmicBackground.tsx`): galaxy + twinkling stars; returns null in light mode; props `source?`, `dim?`.
- `AnimatedGradient` (`src/components/ui/AnimatedGradient.tsx`): props `colors?`, `style?`.
- `ProfileScreen.tsx` card background color is `#0F1330`; `ProfileShell` currently renders `DerivedBackdrop` target spot; `Identity` puts the avatar (`AvatarRing`, spinning) top-left then name/handle/badges/`CollapsibleBio`/`ProfileLinks`/`StatsBlock`/`MetaInfo`/actions.
- `LivePreviewHeader.tsx` currently renders its own banner + spinning ring + name/handle.
- `EditProfileScreen.tsx` "Apariencia" section: avatar row + a banner-image preview box + actions; `handlePickBackground` uses `pickImage({ aspect: [9, 16] })` and uploads to `banners/{userId}/background.jpg` → `banner_url`.

---

## File Structure
- **Create:** `src/features/profile/components/ProfileHero.tsx` — banner + centered spinning-ring avatar + name/handle.
- **Create:** `src/features/profile/components/DerivedBackdrop.tsx` — blurred banner top-glow + cosmic stars.
- **Modify:** `src/features/profile/components/LivePreviewHeader.tsx` — render `ProfileHero` inside a card.
- **Modify:** `src/features/profile/screens/ProfileScreen.tsx` — `ProfileShell` uses `DerivedBackdrop`; `Identity` uses `ProfileHero`; drop old hero pieces.
- **Modify:** `src/features/profile/screens/EditProfileScreen.tsx` — banner copy + landscape aspect.

---

## Task 1: ProfileHero component

**Files:**
- Create: `src/features/profile/components/ProfileHero.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/profile/components/ProfileHero.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../../../components/ui/Avatar";
import { AnimatedGradient } from "../../../components/ui/AnimatedGradient";
import { radius, typography } from "../../../theme/tokens";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useTheme } from "../../../theme/useTheme";
import type { AccentPair } from "../utils/profile-accent";

const BANNER_HEIGHT = 140;
const AVATAR_SIZE = 96;
const CARD_BG = "#0F1330";

// Cabecera "hero" del perfil: banner a sangre arriba (imagen nitida o gradiente
// de acento si no hay), con el avatar (aro girando) + nombre + handle centrados
// solapando el banner. Reutilizada por ProfileScreen y por la preview del editor.
export function ProfileHero({
  avatarUrl,
  displayName,
  username,
  bannerUrl,
  accent,
  online = false,
}: {
  avatarUrl: string | null;
  displayName: string;
  username: string;
  bannerUrl: string | null;
  accent: AccentPair;
  online?: boolean;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduced]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View>
      <View style={styles.banner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <AnimatedGradient
            style={StyleSheet.absoluteFill}
            colors={[accent[0], accent[1], "#22D3FF", accent[0]]}
          />
        )}
        <LinearGradient
          colors={["transparent", "transparent", CARD_BG]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <View style={styles.ring}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: radius.pill, overflow: "hidden", transform: reduced ? [] : [{ rotate }] },
              ]}
            >
              <LinearGradient
                colors={accent as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <View style={[styles.ringInner, { backgroundColor: theme.colors.background }]}>
              <Avatar uri={avatarUrl} label={displayName || username} size={AVATAR_SIZE} />
            </View>
          </View>
          {online ? (
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: theme.colors.success, borderColor: theme.colors.background },
              ]}
            />
          ) : null}
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {displayName || "Tu nombre"}
        </Text>
        <Text style={[styles.handle, { color: accent[0] }]} numberOfLines={1}>
          @{username || "username"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    width: "100%",
  },
  identity: {
    alignItems: "center",
    marginTop: -(AVATAR_SIZE / 2),
    paddingHorizontal: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  ring: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  ringInner: {
    borderRadius: radius.pill,
    padding: 2,
  },
  onlineDot: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  name: {
    fontSize: typography.h1,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 10,
  },
  handle: {
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/ProfileHero.tsx
git commit -m "Add ProfileHero (immersive banner + centered spinning-ring avatar)"
```

---

## Task 2: DerivedBackdrop component

**Files:**
- Create: `src/features/profile/components/DerivedBackdrop.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/profile/components/DerivedBackdrop.tsx`:

```tsx
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CosmicBackground } from "../../../components/ui/CosmicBackground";

// Fondo derivado del banner: estrellas cosmicas de base + el banner difuminado
// como "glow" en la franja superior, disuelto hacia el fondo oscuro. El blur
// oculta el recorte, asi que funciona en movil y desktop por igual.
export const DerivedBackdrop = memo(function DerivedBackdrop({ source }: { source: string }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fill}
    >
      <CosmicBackground dim="rgba(6,7,22,0.62)" />
      <View style={styles.glow}>
        <Image source={{ uri: source }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["transparent", "#070B1A"]} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    overflow: "hidden",
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/DerivedBackdrop.tsx
git commit -m "Add DerivedBackdrop (blurred banner top-glow over cosmic stars)"
```

---

## Task 3: LivePreviewHeader uses ProfileHero

**Files:**
- Modify: `src/features/profile/components/LivePreviewHeader.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the component**

Replace the ENTIRE contents of `src/features/profile/components/LivePreviewHeader.tsx` with:

```tsx
import { StyleSheet, View } from "react-native";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { AccentPair } from "../utils/profile-accent";
import { ProfileHero } from "./ProfileHero";

export function LivePreviewHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  accent,
}: {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  accent: AccentPair;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      <ProfileHero
        avatarUrl={avatarUrl}
        displayName={displayName}
        username={username}
        bannerUrl={bannerUrl}
        accent={accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F1330",
    paddingBottom: 16,
  },
});
```

- [ ] **Step 2: Typecheck + tests + commit**

Run: `npm run typecheck` → PASS.
Run: `npm test` → PASS.
```bash
git add src/features/profile/components/LivePreviewHeader.tsx
git commit -m "LivePreviewHeader: render ProfileHero (banner + centered avatar)"
```

---

## Task 4: ProfileScreen — derived backdrop + hero card

**Files:**
- Modify: `src/features/profile/screens/ProfileScreen.tsx`

- [ ] **Step 1: Imports**

Add these imports after the line `import { ProfileLinks } from "../components/ProfileLinks";`:

```ts
import { DerivedBackdrop } from "../components/DerivedBackdrop";
import { ProfileHero } from "../components/ProfileHero";
```

- [ ] **Step 2: Use DerivedBackdrop in ProfileShell**

In `ProfileShell`, find:

```tsx
      {backgroundUri ? (
        <NebulaBackdrop source={{ uri: backgroundUri }} dim="rgba(6,7,22,0.72)" />
      ) : (
        <CosmicBackground dim="rgba(6,7,22,0.62)" />
      )}
```

Replace with:

```tsx
      {backgroundUri ? (
        <DerivedBackdrop source={backgroundUri} />
      ) : (
        <CosmicBackground dim="rgba(6,7,22,0.62)" />
      )}
```

`NebulaBackdrop` is now unused in this file. Remove its import line (`import { NebulaBackdrop } from "../../../components/ui/NebulaBackdrop";`).

- [ ] **Step 3: Replace the Identity card body with the hero**

In the `Identity` component, replace this entire block — from the opening `return (` through the closing of the name/handle/badges/bio/links wrapper `</View>` (the block currently rendering `headerWrap`, `card`, `cardWash`, `cornerMenu`, `avatarSlot`+`AvatarRing`, and the `identityCentered` View):

```tsx
  return (
    <View style={[styles.headerWrap, { paddingTop: avatarSize * 0.5 + 40 }]}>
      <View style={[styles.card, centered ? styles.cardCentered : null]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardWash}
          pointerEvents="none"
        />

        {!isOwn ? (
          <View style={styles.cornerMenu}>
            <MoreMenu onReport={onReport} onBlock={onBlock} />
          </View>
        ) : null}

        <View style={[styles.avatarSlot, { marginTop: -(avatarSize * 0.5) }]}>
          <AvatarRing
            uri={data.avatar_url}
            label={displayName}
            accent={accent}
            size={avatarSize}
            online={!isOwn}
          />
        </View>

        <View style={centered ? styles.identityCentered : undefined}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.handle, { color: accent[0] }]}>
            @{data.username}
          </Text>

          <View style={[styles.badges, centered ? styles.badgesCentered : null]}>
            <HeaderBadge label="Perfil público" color={accent[0]} />
            {contextual && role ? <RoleBadge role={role} /> : null}
            {data.is_banned ? (
              <HeaderBadge label="Baneado" color={theme.colors.error} />
            ) : null}
          </View>

          {data.bio ? (
            <CollapsibleBio bio={data.bio} accent={accent} centered={centered} />
          ) : null}
          <ProfileLinks links={data.links ?? []} accent={accent} />
        </View>
```

with:

```tsx
  return (
    <View style={styles.headerWrap}>
      <View style={styles.card}>
        {!isOwn ? (
          <View style={styles.cornerMenu}>
            <MoreMenu onReport={onReport} onBlock={onBlock} />
          </View>
        ) : null}

        <ProfileHero
          avatarUrl={data.avatar_url}
          displayName={displayName}
          username={data.username}
          bannerUrl={data.banner_url}
          accent={accent}
          online={!isOwn}
        />

        <View style={styles.cardBody}>
          <View style={styles.badges}>
            <HeaderBadge label="Perfil público" color={accent[0]} />
            {contextual && role ? <RoleBadge role={role} /> : null}
            {data.is_banned ? (
              <HeaderBadge label="Baneado" color={theme.colors.error} />
            ) : null}
          </View>

          {data.bio ? (
            <CollapsibleBio bio={data.bio} accent={accent} centered={centered} />
          ) : null}
          <ProfileLinks links={data.links ?? []} accent={accent} />
```

Note what changed: `headerWrap` no longer takes the inline `paddingTop`; the card drops `cardCentered`, `cardWash`, and the overlapping `avatarSlot`/`AvatarRing`; the hero is rendered by `ProfileHero`; and the remaining identity content now lives inside a new `cardBody` View. The `StatsBlock`, `MetaInfo`, and `actionsSlot` that follow are still rendered after this block, but they must now be INSIDE `cardBody`. Continue to Step 4 to close `cardBody` correctly.

- [ ] **Step 4: Move stats/meta/actions inside cardBody and close it**

Immediately after the block you just edited, the code currently is:

```tsx
        </View>

        <StatsBlock stats={stats} centered={centered} />

        <MetaInfo
          accent={accent}
          contextual={contextual}
          role={role}
          isOwn={isOwn}
          joinedNexo={data.created_at}
          joinedCommunity={joinedCommunity}
          centered={centered}
        />

        <View
          style={[
            styles.actionsSlot,
            centered ? styles.actionsCentered : null,
          ]}
        >
          <ProfileActions
            isOwn={isOwn}
            accent={accent}
            following={following}
            followPending={followPending}
            chatPending={chatPending}
            stacked={stacked}
            onToggleFollow={onToggleFollow}
            onMessage={onMessage}
            onEdit={onEdit}
          />
        </View>
      </View>
```

Replace it with (note: the stray `</View>` that closed the old identity wrapper is removed; stats/meta/actions stay; `cardBody` and `card` close at the end):

```tsx
          <StatsBlock stats={stats} centered={centered} />

          <MetaInfo
            accent={accent}
            contextual={contextual}
            role={role}
            isOwn={isOwn}
            joinedNexo={data.created_at}
            joinedCommunity={joinedCommunity}
            centered={centered}
          />

          <View style={styles.actionsSlot}>
            <ProfileActions
              isOwn={isOwn}
              accent={accent}
              following={following}
              followPending={followPending}
              chatPending={chatPending}
              stacked={stacked}
              onToggleFollow={onToggleFollow}
              onMessage={onMessage}
              onEdit={onEdit}
            />
          </View>
        </View>
      </View>
```

- [ ] **Step 5: Remove the now-unused `avatarSize` local**

In `Identity`, delete the line:

```tsx
  const avatarSize = centered ? 104 : 88;
```

- [ ] **Step 6: Update card/header styles**

In the `StyleSheet.create`, find the `headerWrap` and `card` styles:

```tsx
  headerWrap: {
    paddingTop: 8,
  },
```

Leave `headerWrap` as is (paddingTop 8 is correct now).

Find the `card` style and replace it with (remove horizontal/top padding so the banner bleeds full-width, clip with overflow):

```tsx
  card: {
    backgroundColor: "#0F1330",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 28,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 14,
  },
```

Then add a new `cardBody` style immediately after `card` (provides the horizontal padding for everything below the hero):

```tsx
  cardBody: {
    paddingHorizontal: 22,
  },
```

- [ ] **Step 7: Remove the dead AvatarRing hero pieces**

The old hero is fully replaced by `ProfileHero`. Delete the `AvatarRing` function definition and the `avatarInitials` helper (both only served the old hero). If `npm run typecheck` reports either is still referenced somewhere, leave that one in place. (Their leftover style keys — `avatarSlot`, `avatarRingWrap`, `avatarRing`, `avatarInner`, `onlineDot`, `cardWash`, `cardCentered`, `identityCentered` — can remain; unused style keys are harmless and `noUnusedLocals` is off.)

- [ ] **Step 8: Typecheck + tests + commit**

Run: `npm run typecheck` → PASS.
Run: `npm test` → PASS.
```bash
git add src/features/profile/screens/ProfileScreen.tsx
git commit -m "ProfileScreen: derived backdrop + ProfileHero card (real banner)"
```

---

## Task 5: EditProfileScreen — banner copy + landscape aspect

**Files:**
- Modify: `src/features/profile/screens/EditProfileScreen.tsx`

- [ ] **Step 1: Landscape aspect for the banner pick**

Find:

```tsx
      const asset = await pickImage({ aspect: [9, 16] });
```

Replace with:

```tsx
      const asset = await pickImage({ aspect: [3, 1] });
```

- [ ] **Step 2: Rename the empty-state copy**

Find:

```tsx
              <Text style={[styles.bgEmptyText, { color: theme.colors.textFaint }]}>
                Sin fondo · se usa el cosmico
              </Text>
```

Replace with:

```tsx
              <Text style={[styles.bgEmptyText, { color: theme.colors.textFaint }]}>
                Sin banner · el fondo se genera de el
              </Text>
```

- [ ] **Step 3: Rename the buttons**

Find:

```tsx
          <Button
            title={bannerUrl ? "Cambiar fondo" : "Elegir fondo"}
            variant="secondary"
            icon={<ImageIcon size={18} color={theme.colors.text} />}
            loading={uploadingBg}
            onPress={handlePickBackground}
          />
```

Replace with:

```tsx
          <Button
            title={bannerUrl ? "Cambiar banner" : "Elegir banner"}
            variant="secondary"
            icon={<ImageIcon size={18} color={theme.colors.text} />}
            loading={uploadingBg}
            onPress={handlePickBackground}
          />
```

- [ ] **Step 4: Typecheck + tests + commit**

Run: `npm run typecheck` → PASS.
Run: `npm test` → PASS.
```bash
git add src/features/profile/screens/EditProfileScreen.tsx
git commit -m "EditProfileScreen: banner copy + landscape (3:1) aspect"
```

---

## Task 6: Final validation

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck` → PASS.

- [ ] **Step 2: Tests**

Run: `npm test` → PASS (existing 24 tests, no regressions).

- [ ] **Step 3: Web export smoke check**

Run: `npx expo export --platform web`
Expected: completes without bundling errors (confirms `expo-blur` BlurView and the new components resolve on web).

- [ ] **Step 4: Spec coverage**

Re-read `docs/superpowers/specs/2026-06-06-profile-banner-derived-background-design.md` sections 4-5 and confirm each maps to a task: ProfileHero hero (T1), DerivedBackdrop top-glow + cosmic fallback (T2), preview uses hero (T3), ProfileShell derived backdrop + Identity hero card (T4), edit banner copy + landscape aspect (T5), no-banner fallbacks (T1 AnimatedGradient + T2/T4 CosmicBackground).

Expected: every requirement covered.

---

## Out of scope (do not implement)
A second independent background image, backend/migration changes, in-app banner cropping, count-up or other new animations, and other screens.
