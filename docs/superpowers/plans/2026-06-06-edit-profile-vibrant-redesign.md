# Edit/Profile — Vibrant Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EditProfileScreen and ProfileScreen feel vibrant/youthful — real brand-logo link icons, multicolor animated gradients, a spinning avatar ring, staggered entrance, link "pop", twinkling-star backdrop, and higher-contrast text — without changing any data/validation/navigation.

**Architecture:** Add three reusable visual primitives (`BrandIcon` via `simple-icons` + `react-native-svg`, `AnimatedGradient`, `useStaggerIn`), all reduced-motion aware, then adopt them across the existing profile components and the two screens. Brand colors live in one tested map in `link-presentation.ts`.

**Tech Stack:** Expo/React Native 0.85, TS strict, react-native-svg (already a dep), simple-icons (NEW data dep), expo-linear-gradient, Animated API, lucide-react-native, Jest.

**Branch:** `redesign/edit-profile` · **Spec:** `docs/superpowers/specs/2026-06-06-edit-profile-vibrant-redesign-design.md`

**Validation gate:** `npm run typecheck` + `npm test`. `npm run lint` is broken — do not use it. Commits omit the `Co-Authored-By` signature.

**Existing facts to rely on:**
- `useReducedMotion()` → `boolean` (`src/hooks/useReducedMotion.ts`).
- `CosmicBackground` (`src/components/ui/CosmicBackground.tsx`) renders the galaxy + twinkling stars; returns null in light mode; props `source?`, `dim?`.
- `linkPresentation(url)` → `{ platform, domain }`; `LinkPlatform` union has 8 platforms + `generic`.
- `ProfileLinks`, `AccentPicker`, `LinksEditor`, `LivePreviewHeader` are in `src/features/profile/components/`.
- ProfileScreen already imports `Animated`, `useReducedMotion`, `useTheme`, `AccentPair`, `hoverTransition`, `pointerStyle`.

---

## File Structure
- **Modify:** `src/features/profile/utils/link-presentation.ts` — add tested `BRAND_COLORS` map.
- **Create:** `src/features/profile/components/BrandIcon.tsx` — brand glyph (simple-icons path) + color.
- **Create:** `src/components/ui/AnimatedGradient.tsx` — shifting multicolor gradient.
- **Create:** `src/hooks/useStaggerIn.ts` — staggered entrance animated style.
- **Modify:** `ProfileLinks.tsx`, `LivePreviewHeader.tsx`, `AccentPicker.tsx`, `LinksEditor.tsx`.
- **Modify:** `ProfileScreen.tsx`, `EditProfileScreen.tsx`.
- **Test:** `tests/link-presentation.test.ts` (extend).

---

## Task 1: Brand colors map (TDD)

**Files:**
- Modify: `src/features/profile/utils/link-presentation.ts`
- Test: `tests/link-presentation.test.ts`

- [ ] **Step 1: Add failing tests**

Append inside the existing `describe("linkPresentation", ...)` block in `tests/link-presentation.test.ts` (and add the import). At the top, change the import line to:

```ts
import { BRAND_COLORS, linkPresentation } from "../src/features/profile/utils/link-presentation";
```

Add these tests before the closing `});` of the describe:

```ts
  it("expone un color de marca por plataforma conocida", () => {
    expect(BRAND_COLORS.youtube).toBe("#FF0000");
    expect(BRAND_COLORS.instagram).toBe("#E4405F");
    expect(BRAND_COLORS.twitch).toBe("#9146FF");
  });

  it("tiene color para todas las plataformas, incluida generic", () => {
    const platforms = [
      "youtube",
      "twitch",
      "twitter",
      "instagram",
      "github",
      "linkedin",
      "facebook",
      "tiktok",
      "generic",
    ] as const;
    for (const p of platforms) {
      expect(BRAND_COLORS[p]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test -- link-presentation`
Expected: FAIL — `BRAND_COLORS` not exported.

- [ ] **Step 3: Implement**

In `src/features/profile/utils/link-presentation.ts`, add after the `LinkPlatform` type definition (after line 10):

```ts
/**
 * Color de marca por plataforma (para teñir icono/fila). Para marcas oscuras
 * (X, GitHub) usamos blanco para que se vean sobre el tema oscuro.
 * `generic` es un fallback neutro; en la UI se suele sustituir por el acento.
 */
export const BRAND_COLORS: Record<LinkPlatform, string> = {
  youtube: "#FF0000",
  twitch: "#9146FF",
  twitter: "#FFFFFF",
  instagram: "#E4405F",
  github: "#FFFFFF",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  tiktok: "#FF0050",
  generic: "#8B5CF6",
};
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm test -- link-presentation`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/utils/link-presentation.ts tests/link-presentation.test.ts
git commit -m "Add BRAND_COLORS map for link platforms"
```

---

## Task 2: BrandIcon component (real brand glyphs)

**Files:**
- Create: `src/features/profile/components/BrandIcon.tsx`
- Modify: `package.json` (add `simple-icons`)

- [ ] **Step 1: Install simple-icons**

`simple-icons` is a pure data package (SVG path strings + hex), not an Expo native module, so install with npm (NOT `npx expo install`):

Run: `npm install simple-icons`
Expected: adds `simple-icons` to `dependencies`.

- [ ] **Step 2: Create the component**

Create `src/features/profile/components/BrandIcon.tsx`:

```tsx
import Svg, { Path } from "react-native-svg";
import {
  siFacebook,
  siGithub,
  siInstagram,
  siLinkedin,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";
import { Link as LinkIcon } from "lucide-react-native";
import { BRAND_COLORS, type LinkPlatform } from "../utils/link-presentation";

// simple-icons exporta { path, hex, ... }; usamos solo la geometria (24x24).
const GLYPHS: Partial<Record<LinkPlatform, string>> = {
  youtube: siYoutube.path,
  instagram: siInstagram.path,
  twitch: siTwitch.path,
  twitter: siX.path,
  tiktok: siTiktok.path,
  github: siGithub.path,
  linkedin: siLinkedin.path,
  facebook: siFacebook.path,
};

export function BrandIcon({
  platform,
  size = 16,
  color,
}: {
  platform: LinkPlatform;
  size?: number;
  color?: string;
}) {
  const fill = color ?? BRAND_COLORS[platform];
  const glyph = GLYPHS[platform];
  if (!glyph) {
    // generic u otras: icono de enlace de lucide.
    return <LinkIcon size={size} color={fill} />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={glyph} fill={fill} />
    </Svg>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS. If a `simple-icons` named export is not found (version differences), check the installed package's exports and use the correct names (they follow `si<Name>`; X may be `siX`). Do not leave a broken import.

```bash
git add package.json package-lock.json src/features/profile/components/BrandIcon.tsx
git commit -m "Add BrandIcon (real brand glyphs via simple-icons + react-native-svg)"
```

---

## Task 3: AnimatedGradient component

**Files:**
- Create: `src/components/ui/AnimatedGradient.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ui/AnimatedGradient.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const DEFAULT_COLORS = ["#FF5FA2", "#FF3DF0", "#7B5CFF", "#22D3FF"] as const;

// Degradado multicolor que se desplaza horizontalmente en bucle. La banda interna
// mide el doble de ancho y se anima con translateX (native driver) para un loop
// continuo. Con reduce-motion queda estatico.
export function AnimatedGradient({
  colors = DEFAULT_COLORS,
  style,
}: {
  colors?: readonly string[];
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  // Colores duplicados para que el desplazamiento sea continuo (tile).
  const tiled = [...colors, ...colors] as unknown as readonly [string, string];

  useEffect(() => {
    if (reduced || width === 0) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [x, reduced, width]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });

  return (
    <View
      style={[styles.clip, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { width: width * 2, transform: reduced ? [] : [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={tiled}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/components/ui/AnimatedGradient.tsx
git commit -m "Add AnimatedGradient (shifting multicolor gradient, reduced-motion aware)"
```

---

## Task 4: useStaggerIn hook

**Files:**
- Create: `src/hooks/useStaggerIn.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useStaggerIn.ts`:

```ts
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

// Entrada en cascada: fade + slide-up con retardo segun el indice. Devuelve un
// estilo animado para envolver una seccion en <Animated.View>. Con reduce-motion
// el contenido aparece estatico (sin animacion).
export function useStaggerIn(index: number) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, index, reduced]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/hooks/useStaggerIn.ts
git commit -m "Add useStaggerIn hook for staggered entrance animation"
```

---

## Task 5: ProfileLinks — brand icons + tint + pop

**Files:**
- Modify: `src/features/profile/components/ProfileLinks.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the component**

Replace the ENTIRE contents of `src/features/profile/components/ProfileLinks.tsx` with:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ChevronRight } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import type { AccentPair } from "../utils/profile-accent";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { BRAND_COLORS, linkPresentation } from "../utils/link-presentation";
import { BrandIcon } from "./BrandIcon";

export function ProfileLinks({
  links,
  accent,
}: {
  links: ProfileLink[];
  accent: AccentPair;
}) {
  const theme = useTheme();
  if (!links.length) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: theme.colors.text }]}>ENLACES</Text>
      <View style={styles.rows}>
        {links.map((link, index) => {
          const { platform, domain } = linkPresentation(link.url);
          // generic usa el acento; el resto su color de marca.
          const brand = platform === "generic" ? accent[0] : BRAND_COLORS[platform];
          return (
            <Pressable
              key={`${link.url}-${index}`}
              accessibilityRole="link"
              accessibilityLabel={`${link.label} (${domain})`}
              onPress={() => void WebBrowser.openBrowserAsync(link.url)}
              style={({ pressed, hovered }) => [
                styles.row,
                hoverTransition,
                pointerStyle,
                {
                  borderColor: hovered ? `${brand}99` : `${brand}40`,
                  backgroundColor: `${brand}14`,
                  transform: [{ scale: pressed ? 0.97 : hovered ? 1.02 : 1 }],
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${brand}26` }]}>
                <BrandIcon platform={platform} size={18} color={brand} />
              </View>
              <View style={styles.texts}>
                <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
                  {link.label}
                </Text>
                <Text style={[styles.domain, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {domain}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  eyebrow: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  domain: {
    fontSize: typography.tiny,
    fontWeight: "600",
    marginTop: 1,
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/ProfileLinks.tsx
git commit -m "ProfileLinks: real brand icons, brand tint and press pop"
```

---

## Task 6: LivePreviewHeader — animated banner + spinning ring

**Files:**
- Modify: `src/features/profile/components/LivePreviewHeader.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the component**

Replace the ENTIRE contents of `src/features/profile/components/LivePreviewHeader.tsx` with:

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
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduced]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.banner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <AnimatedGradient style={StyleSheet.absoluteFill} colors={[accent[0], accent[1], "#22D3FF", accent[0]]} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.avatarRing}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: reduced ? [] : [{ rotate }] }]}
          >
            <LinearGradient
              colors={accent as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
            />
          </Animated.View>
          <View style={[styles.avatarInner, { backgroundColor: theme.colors.background }]}>
            <Avatar uri={avatarUrl} label={displayName || username} size={54} />
          </View>
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
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F1330",
  },
  banner: {
    height: 84,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    padding: 3,
  },
  avatarInner: {
    borderRadius: radius.pill,
    padding: 2,
  },
  name: {
    fontSize: typography.h3,
    fontWeight: "900",
    marginTop: 10,
  },
  handle: {
    fontSize: typography.small,
    fontWeight: "700",
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/LivePreviewHeader.tsx
git commit -m "LivePreviewHeader: animated gradient banner + spinning avatar ring"
```

---

## Task 7: AccentPicker — pop on select

**Files:**
- Modify: `src/features/profile/components/AccentPicker.tsx`

- [ ] **Step 1: Add a press scale to preset swatches**

In `src/features/profile/components/AccentPicker.tsx`, the preset swatch is a `<Pressable>` wrapping a `<LinearGradient>`. Change the preset `Pressable` so its `style` applies a press scale. Find:

```tsx
            <Pressable
              key={pair[0]}
              accessibilityRole="button"
              accessibilityLabel={`Color de acento ${pair[0]}`}
              onPress={() => {
                setCustomOpen(false);
                onChange(pair[0]);
              }}
            >
```

Replace with:

```tsx
            <Pressable
              key={pair[0]}
              accessibilityRole="button"
              accessibilityLabel={`Color de acento ${pair[0]}`}
              onPress={() => {
                setCustomOpen(false);
                onChange(pair[0]);
              }}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.88 : selected ? 1.08 : 1 }],
              })}
            >
```

(`selected` is already computed just above in the same `.map` callback.)

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/AccentPicker.tsx
git commit -m "AccentPicker: pop/scale on swatch select"
```

---

## Task 8: LinksEditor — brand icon preview per row

**Files:**
- Modify: `src/features/profile/components/LinksEditor.tsx`

- [ ] **Step 1: Show the detected BrandIcon next to the row title**

In `src/features/profile/components/LinksEditor.tsx`, add imports after the existing imports:

```tsx
import { BrandIcon } from "./BrandIcon";
import { linkPresentation } from "../utils/link-presentation";
```

Then, inside the `.map`, just after the line:

```tsx
        const urlInvalid =
          link.url.trim().length > 0 && !link.url.trim().startsWith("https://");
```

add:

```tsx
        const platform = link.url.trim() ? linkPresentation(link.url).platform : "generic";
```

Then replace the row header block:

```tsx
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: theme.colors.textMuted }]}>
                Enlace {index + 1}
              </Text>
```

with:

```tsx
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <BrandIcon platform={platform} size={16} />
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                  Enlace {index + 1}
                </Text>
              </View>
```

- [ ] **Step 2: Add the `itemTitleRow` style**

In the `StyleSheet.create`, immediately before the `itemTitle` style, add:

```tsx
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add src/features/profile/components/LinksEditor.tsx
git commit -m "LinksEditor: live BrandIcon preview per row"
```

---

## Task 9: ProfileScreen — stars, spinning ring, sticker badge, contrast, stagger

**Files:**
- Modify: `src/features/profile/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add imports**

After the existing import block (the `resolveAccent`/`ProfileLinks` imports added earlier, around line 72), add:

```ts
import { CosmicBackground } from "../../../components/ui/CosmicBackground";
import { useStaggerIn } from "../../../hooks/useStaggerIn";
```

- [ ] **Step 2: Twinkling stars behind the card**

In `ProfileShell`, replace this block:

```tsx
      {backgroundUri ? (
        <NebulaBackdrop source={{ uri: backgroundUri }} dim="rgba(6,7,22,0.72)" />
      ) : null}
```

with:

```tsx
      {backgroundUri ? (
        <NebulaBackdrop source={{ uri: backgroundUri }} dim="rgba(6,7,22,0.72)" />
      ) : (
        <CosmicBackground dim="rgba(6,7,22,0.62)" />
      )}
```

- [ ] **Step 3: Stagger the main blocks**

In the `ProfileScreen` component body, add three stagger styles immediately after the existing `const accent = resolveAccent({ ... });` line:

```tsx
  const enterHeader = useStaggerIn(0);
  const enterNav = useStaggerIn(1);
  const enterContent = useStaggerIn(2);
```

(These hooks run before the loading/error early returns, which is required — they sit right after `accent`, which is already above those returns.)

Then in the three layout branches of the returned JSX, wrap the rendered `header`, `nav`, `content`. Replace the desktop branch:

```tsx
            <View style={styles.leftCol}>{header}</View>
              <View style={styles.rightCol}>
                {nav}
                {content}
              </View>
```

with:

```tsx
            <View style={styles.leftCol}>
                <Animated.View style={enterHeader}>{header}</Animated.View>
              </View>
              <View style={styles.rightCol}>
                <Animated.View style={enterNav}>{nav}</Animated.View>
                <Animated.View style={enterContent}>{content}</Animated.View>
              </View>
```

Replace the compact branch:

```tsx
          <>
            {header}
            {nav ? <View style={styles.navMobileWrap}>{nav}</View> : null}
            {content}
          </>
```

with:

```tsx
          <>
            <Animated.View style={enterHeader}>{header}</Animated.View>
            {nav ? <Animated.View style={[styles.navMobileWrap, enterNav]}>{nav}</Animated.View> : null}
            <Animated.View style={enterContent}>{content}</Animated.View>
          </>
```

Replace the wide branch:

```tsx
            <View style={[styles.wideColumn, { maxWidth: columnMaxWidth }]}>
              {header}
              {nav ? <View style={styles.navWideWrap}>{nav}</View> : null}
              {content}
            </View>
```

with:

```tsx
            <View style={[styles.wideColumn, { maxWidth: columnMaxWidth }]}>
              <Animated.View style={enterHeader}>{header}</Animated.View>
              {nav ? <Animated.View style={[styles.navWideWrap, enterNav]}>{nav}</Animated.View> : null}
              <Animated.View style={enterContent}>{content}</Animated.View>
            </View>
```

- [ ] **Step 4: Sticker badge for "Perfil público"**

In the `Identity` component, find:

```tsx
            <HeaderBadge label="Perfil público" color={theme.colors.textMuted} />
```

Replace with (use the accent so it reads as a colored sticker, not gray):

```tsx
            <HeaderBadge label="Perfil público" color={accent[0]} />
```

- [ ] **Step 5: Spinning avatar ring**

Replace the `AvatarRing` function's outer `LinearGradient` ring with an animated rotating wrapper. Find the start of `AvatarRing` and its ring `LinearGradient`:

```tsx
  return (
    <View style={styles.avatarRingWrap}>
      <LinearGradient
        colors={accent as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatarRing,
          { borderRadius: radius.pill, shadowColor: accent[0] },
        ]}
      >
        <View
          style={[
            styles.avatarInner,
            { backgroundColor: theme.colors.background, borderRadius: radius.pill },
          ]}
        >
```

Replace it with:

```tsx
  return (
    <View style={styles.avatarRingWrap}>
      <View
        style={[
          styles.avatarRing,
          { borderRadius: radius.pill, shadowColor: accent[0] },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.pill, overflow: "hidden", transform: reducedMotion ? [] : [{ rotate: ringSpin }] },
          ]}
        >
          <LinearGradient
            colors={accent as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View
          style={[
            styles.avatarInner,
            { backgroundColor: theme.colors.background, borderRadius: radius.pill },
          ]}
        >
```

Then close the extra wrapper: the original ring closed with `</LinearGradient>`. Find the matching closing for this ring (the `</LinearGradient>` that closes the outer ring, right before the `{online ? (` block) and replace that single `</LinearGradient>` with `</View>`.

Add the spin animation at the top of `AvatarRing` (it already receives `accent`, `size`, etc. and uses `useTheme`). Add `useReducedMotion` usage — `AvatarRing` must compute the spin. Insert at the very top of the `AvatarRing` function body (before `const theme = useTheme();`):

```tsx
  const reducedMotion = useReducedMotion();
  const ringSpinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ringSpinValue, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ringSpinValue, reducedMotion]);
  const ringSpin = ringSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
```

This needs `useEffect`, `useRef` (already imported at top of file from "react"), `Easing` (already imported from "react-native"), and `useReducedMotion` (already imported). Verify these imports exist; `Easing` and `Animated` are imported, `useEffect`/`useRef`/`useState` are imported from react.

- [ ] **Step 6: Brighter bio**

In the `CollapsibleBio` component, change the bio text color from `theme.colors.textMuted` to `theme.colors.text` so the long bio reads bright. Find inside `CollapsibleBio`:

```tsx
        style={[
          styles.bio,
          { color: theme.colors.textMuted },
          centered ? styles.bioCentered : null,
        ]}
```

Replace `theme.colors.textMuted` with `theme.colors.text`.

- [ ] **Step 7: Typecheck + tests + commit**

Run: `npm run typecheck` → PASS.
Run: `npm test` → PASS.
```bash
git add src/features/profile/screens/ProfileScreen.tsx
git commit -m "ProfileScreen: stars backdrop, spinning ring, sticker badge, brighter bio, staggered entrance"
```

---

## Task 10: EditProfileScreen — section headers + stagger

**Files:**
- Modify: `src/features/profile/screens/EditProfileScreen.tsx`

- [ ] **Step 1: Add imports**

After the existing imports, add:

```ts
import { Animated } from "react-native";
import { useStaggerIn } from "../../../hooks/useStaggerIn";
```

Note: `react-native` is already imported with named members (`Alert, ScrollView, StyleSheet, Text, View`). Instead of a second import line, ADD `Animated` to that existing destructured import so it becomes:

```ts
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
```

and only add the `useStaggerIn` import line:

```ts
import { useStaggerIn } from "../../../hooks/useStaggerIn";
```

- [ ] **Step 2: Compute stagger styles**

In the component body, after `const links = form.watch("links") ?? [];` add:

```tsx
  const enterPreview = useStaggerIn(0);
  const enterAppearance = useStaggerIn(1);
  const enterIdentity = useStaggerIn(2);
  const enterAccent = useStaggerIn(3);
  const enterLinks = useStaggerIn(4);
```

- [ ] **Step 3: Wrap the preview and give section headers a colored accent bar**

Wrap the `<LivePreviewHeader .../>` element in an `Animated.View`:

```tsx
        <Animated.View style={enterPreview}>
          <LivePreviewHeader
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl ?? null}
            bannerUrl={bannerUrl ?? null}
            accent={accent}
          />
        </Animated.View>
```

Add a small reusable section-header that shows a colored bar + the title. Add this component ABOVE `export function EditProfileScreen` (top-level in the file):

```tsx
function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBar, { backgroundColor: color }]} />
      <Text style={[styles.sectionHeaderText, { color: "#FFFFFF" }]}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Replace the four plain section labels and wrap each section**

Replace `<Text style={[styles.sectionLabel, ...]}>Apariencia</Text>` and the block that follows down to (but not including) the next section label, wrapping each section in its stagger `Animated.View` and using `SectionHeader`. Concretely:

Replace:
```tsx
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Apariencia</Text>
```
with:
```tsx
        <Animated.View style={enterAppearance}>
        <SectionHeader label="Apariencia" color={accent[0]} />
```
and add a closing `</Animated.View>` immediately BEFORE the `Identidad` label.

Replace:
```tsx
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Identidad</Text>
```
with:
```tsx
        <Animated.View style={enterIdentity}>
        <SectionHeader label="Identidad" color={accent[1]} />
```
and add a closing `</Animated.View>` immediately BEFORE the `Color de acento` label.

Replace:
```tsx
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Color de acento</Text>
        <AccentPicker
          value={accentColor ?? null}
          onChange={(hex) => form.setValue("accentColor", hex, { shouldValidate: true })}
        />
```
with:
```tsx
        <Animated.View style={enterAccent}>
        <SectionHeader label="Color de acento" color={accent[0]} />
        <AccentPicker
          value={accentColor ?? null}
          onChange={(hex) => form.setValue("accentColor", hex, { shouldValidate: true })}
        />
        </Animated.View>
```

Replace:
```tsx
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Enlaces</Text>
        <LinksEditor
          value={links as ProfileLink[]}
          onChange={(next) => form.setValue("links", next, { shouldValidate: true })}
        />
```
with:
```tsx
        <Animated.View style={enterLinks}>
        <SectionHeader label="Enlaces" color={accent[1]} />
        <LinksEditor
          value={links as ProfileLink[]}
          onChange={(next) => form.setValue("links", next, { shouldValidate: true })}
        />
        </Animated.View>
```

> Important: ensure every opened `<Animated.View>` is closed exactly once. The Apariencia wrapper closes before Identidad; the Identidad wrapper closes before Color de acento; Color and Enlaces wrappers are self-contained above. After editing, the JSX must balance — `npm run typecheck` will fail on any mismatch.

- [ ] **Step 5: Add styles**

In the `StyleSheet.create`, replace the `sectionLabel` style with these (keep the rest):

```tsx
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: typography.h3,
    fontWeight: "800",
  },
```

(Remove the now-unused `sectionLabel` style only if nothing else references it; otherwise leave it.)

- [ ] **Step 6: Typecheck + tests + commit**

Run: `npm run typecheck` → PASS.
Run: `npm test` → PASS.
```bash
git add src/features/profile/screens/EditProfileScreen.tsx
git commit -m "EditProfileScreen: colored section headers + staggered entrance"
```

---

## Task 11: Final validation

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck` → PASS.

- [ ] **Step 2: Tests**

Run: `npm test` → PASS (existing + 2 new BRAND_COLORS tests).

- [ ] **Step 3: Web export smoke check**

Run: `npx expo export --platform web`
Expected: completes without bundling errors (confirms `simple-icons` + `react-native-svg` glyphs and all new imports resolve on web).

- [ ] **Step 4: Spec coverage**

Re-read `docs/superpowers/specs/2026-06-06-edit-profile-vibrant-redesign-design.md` sections 3-5 and confirm each maps to a task: BrandIcon (T2), AnimatedGradient (T3), useStaggerIn (T4), BRAND_COLORS (T1), ProfileLinks brand+pop (T5), LivePreviewHeader banner+ring (T6), AccentPicker pop (T7), LinksEditor preview (T8), ProfileScreen stars/ring/badge/contrast/stagger (T9), EditProfileScreen headers/stagger (T10).

Expected: every requirement covered.

---

## Out of scope (do not implement)
Count-up stats animation, other screens, real favicons (we use simple-icons glyphs), and any data/validation/navigation change.
