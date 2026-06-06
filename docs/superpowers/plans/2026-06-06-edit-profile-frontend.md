# Edit Perfil — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the edit-profile UI (live-preview header + sectioned form with accent picker, links editor, long bio, username cooldown lock) and consume `accent_color`/`links`/long-bio in the profile view.

**Architecture:** Pure, testable utils first (`resolveAccent`, `linkPresentation`), then small focused components (`ProfileLinks`, `AccentPicker`, `LinksEditor`, `LivePreviewHeader`), then wire them into `EditProfileScreen` and `ProfileScreen`. Reuse existing shared UI (`Button`, `TextInput`, `Avatar`, `NebulaBackdrop`), tokens, and the already-implemented backend (`profileSchema`, `updateProfile`, `Profile.accent_color/links/username_changed_at`).

**Tech Stack:** Expo / React Native 0.85, expo-router, TypeScript strict, react-hook-form + Zod, expo-linear-gradient, expo-web-browser, lucide-react-native, Jest (jest-expo).

**Branch:** `redesign/edit-profile` · **Spec:** `docs/superpowers/specs/2026-06-06-edit-profile-frontend-design.md`

**Validation gate:** `npm run typecheck` + `npm test`. `npm run lint` is broken — do not use it. Commits omit the `Co-Authored-By` signature.

---

## File Structure

- **Modify:** `src/features/profile/utils/profile-accent.ts` — export `ACCENT_PAIRS` (shared source for picker + resolver).
- **Create:** `src/features/profile/utils/resolve-accent.ts` — `resolveAccent(profile)` + `shiftHue(hex, deg)`.
- **Create:** `src/features/profile/utils/link-presentation.ts` — `linkPresentation(url)` → `{ platform, domain }`.
- **Create:** `src/features/profile/components/ProfileLinks.tsx` — render links rows in the profile.
- **Create:** `src/features/profile/components/AccentPicker.tsx` — presets + custom hex.
- **Create:** `src/features/profile/components/LinksEditor.tsx` — editable list of links.
- **Create:** `src/features/profile/components/LivePreviewHeader.tsx` — live preview in edit screen.
- **Modify:** `src/features/profile/screens/EditProfileScreen.tsx` — new sectioned layout + preview + pickers + cooldown + bio 2000.
- **Modify:** `src/features/profile/screens/ProfileScreen.tsx` — `resolveAccent`, `ProfileLinks`, collapsible bio.
- **Create tests:** `tests/resolve-accent.test.ts`, `tests/link-presentation.test.ts`.

---

## Task 1: Accent resolver util (TDD)

**Files:**
- Modify: `src/features/profile/utils/profile-accent.ts:8`
- Create: `src/features/profile/utils/resolve-accent.ts`
- Test: `tests/resolve-accent.test.ts`

- [ ] **Step 1: Export ACCENT_PAIRS**

In `src/features/profile/utils/profile-accent.ts`, change line 8 from:

```ts
const ACCENT_PAIRS: AccentPair[] = [
```

to:

```ts
export const ACCENT_PAIRS: AccentPair[] = [
```

- [ ] **Step 2: Write the failing test**

Create `tests/resolve-accent.test.ts`:

```ts
/// <reference types="jest" />

import { resolveAccent, shiftHue } from "../src/features/profile/utils/resolve-accent";
import { ACCENT_PAIRS, getProfileAccent } from "../src/features/profile/utils/profile-accent";

describe("resolveAccent", () => {
  it("usa el par derivado del id cuando no hay accent_color", () => {
    const result = resolveAccent({ id: "user-1", accent_color: null });
    expect(result).toEqual(getProfileAccent("user-1"));
  });

  it("devuelve el par de marca exacto cuando accent_color es un preset", () => {
    const preset = ACCENT_PAIRS[1]!; // ["#18D7FF", "#4DF0B0"]
    const result = resolveAccent({ id: "user-1", accent_color: preset[0] });
    expect(result).toEqual(preset);
  });

  it("hace match de preset sin importar mayusculas/minusculas", () => {
    const preset = ACCENT_PAIRS[0]!; // ["#8B5CF6", "#FF4FD8"]
    const result = resolveAccent({ id: "user-1", accent_color: preset[0].toLowerCase() });
    expect(result).toEqual(preset);
  });

  it("genera un par desde un hex custom (primer color = el elegido)", () => {
    const result = resolveAccent({ id: "user-1", accent_color: "#123456" });
    expect(result[0]).toBe("#123456");
    expect(result[1]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result[1]).not.toBe("#123456");
  });
});

describe("shiftHue", () => {
  it("devuelve un hex de 6 digitos distinto al de entrada", () => {
    const out = shiftHue("#7B5CFF", 40);
    expect(out).toMatch(/^#[0-9a-f]{6}$/i);
    expect(out).not.toBe("#7B5CFF");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- resolve-accent`
Expected: FAIL — `resolve-accent` module does not exist yet.

- [ ] **Step 4: Implement the util**

Create `src/features/profile/utils/resolve-accent.ts`:

```ts
import type { Profile } from "../../../types/domain";
import { ACCENT_PAIRS, getProfileAccent, type AccentPair } from "./profile-accent";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Genera un segundo tono cosmico rotando el matiz y subiendo un poco luz/saturacion. */
export function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h + deg, clamp(s + 0.05, 0, 1), clamp(l + 0.08, 0, 1));
  return rgbToHex(nr, ng, nb);
}

/**
 * Par de acento para un perfil:
 * - accent_color preset de marca -> ese par exacto.
 * - accent_color custom -> [elegido, segundo tono generado].
 * - sin accent_color -> par determinista por id (comportamiento previo).
 */
export function resolveAccent(
  profile: Pick<Profile, "id" | "accent_color">,
): AccentPair {
  const hex = profile.accent_color?.trim();
  if (!hex) {
    return getProfileAccent(profile.id);
  }
  const preset = ACCENT_PAIRS.find(
    (pair) => pair[0].toLowerCase() === hex.toLowerCase(),
  );
  if (preset) {
    return preset;
  }
  return [hex, shiftHue(hex, 40)] as const;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- resolve-accent`
Expected: PASS (5 tests).

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/utils/profile-accent.ts src/features/profile/utils/resolve-accent.ts tests/resolve-accent.test.ts
git commit -m "Add resolveAccent util to map accent_color to a gradient pair"
```

---

## Task 2: Link presentation util (TDD)

**Files:**
- Create: `src/features/profile/utils/link-presentation.ts`
- Test: `tests/link-presentation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/link-presentation.test.ts`:

```ts
/// <reference types="jest" />

import { linkPresentation } from "../src/features/profile/utils/link-presentation";

describe("linkPresentation", () => {
  it("detecta youtube y limpia el dominio", () => {
    expect(linkPresentation("https://www.youtube.com/@luna")).toEqual({
      platform: "youtube",
      domain: "youtube.com",
    });
  });

  it("detecta x.com como twitter", () => {
    expect(linkPresentation("https://x.com/luna").platform).toBe("twitter");
  });

  it("detecta github", () => {
    expect(linkPresentation("https://github.com/luna").platform).toBe("github");
  });

  it("usa generic para dominios desconocidos", () => {
    expect(linkPresentation("https://luna.art/portfolio")).toEqual({
      platform: "generic",
      domain: "luna.art",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- link-presentation`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the util**

Create `src/features/profile/utils/link-presentation.ts`:

```ts
export type LinkPlatform =
  | "youtube"
  | "twitch"
  | "twitter"
  | "instagram"
  | "github"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "generic";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .split("/")[0]!
      .replace(/^www\./, "");
  }
}

/** Devuelve la plataforma conocida (para el icono) y el dominio limpio. */
export function linkPresentation(url: string): {
  platform: LinkPlatform;
  domain: string;
} {
  const domain = extractDomain(url);
  const d = domain.toLowerCase();
  const platform: LinkPlatform =
    d.includes("youtube.") || d === "youtu.be"
      ? "youtube"
      : d.includes("twitch.")
        ? "twitch"
        : d.includes("twitter.") || d === "x.com" || d.endsWith(".x.com")
          ? "twitter"
          : d.includes("instagram.")
            ? "instagram"
            : d.includes("github.")
              ? "github"
              : d.includes("linkedin.")
                ? "linkedin"
                : d.includes("facebook.") || d === "fb.com"
                  ? "facebook"
                  : d.includes("tiktok.")
                    ? "tiktok"
                    : "generic";
  return { platform, domain };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- link-presentation`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/utils/link-presentation.ts tests/link-presentation.test.ts
git commit -m "Add linkPresentation util for platform icon + domain"
```

---

## Task 3: ProfileLinks component

**Files:**
- Create: `src/features/profile/components/ProfileLinks.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/profile/components/ProfileLinks.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  ChevronRight,
  Facebook,
  Github,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Music,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import type { AccentPair } from "../utils/profile-accent";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { linkPresentation, type LinkPlatform } from "../utils/link-presentation";

function platformIcon(platform: LinkPlatform, color: string) {
  const size = 16;
  switch (platform) {
    case "youtube":
      return <Youtube size={size} color={color} />;
    case "twitch":
      return <Twitch size={size} color={color} />;
    case "twitter":
      return <Twitter size={size} color={color} />;
    case "instagram":
      return <Instagram size={size} color={color} />;
    case "github":
      return <Github size={size} color={color} />;
    case "linkedin":
      return <Linkedin size={size} color={color} />;
    case "facebook":
      return <Facebook size={size} color={color} />;
    case "tiktok":
      return <Music size={size} color={color} />;
    default:
      return <LinkIcon size={size} color={color} />;
  }
}

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
      <Text style={[styles.eyebrow, { color: theme.colors.textFaint }]}>ENLACES</Text>
      <View style={styles.rows}>
        {links.map((link, index) => {
          const { platform, domain } = linkPresentation(link.url);
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
                  borderColor: hovered ? `${accent[0]}70` : "rgba(255,255,255,0.10)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${accent[0]}1A` }]}>
                {platformIcon(platform, accent[0])}
              </View>
              <View style={styles.texts}>
                <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
                  {link.label}
                </Text>
                <Text style={[styles.domain, { color: theme.colors.textFaint }]} numberOfLines={1}>
                  {domain}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textFaint} />
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
    backgroundColor: "#0A0F24",
  },
  iconBox: {
    width: 26,
    height: 26,
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

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/components/ProfileLinks.tsx
git commit -m "Add ProfileLinks component (rows with platform icon + domain)"
```

---

## Task 4: AccentPicker component

**Files:**
- Create: `src/features/profile/components/AccentPicker.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/profile/components/AccentPicker.tsx`:

```tsx
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Pipette } from "lucide-react-native";
import { TextInput } from "../../../components/ui/TextInput";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { ACCENT_PAIRS } from "../utils/profile-accent";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function AccentPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const theme = useTheme();
  const isPreset =
    value != null &&
    ACCENT_PAIRS.some((pair) => pair[0].toLowerCase() === value.toLowerCase());
  const [customOpen, setCustomOpen] = useState(value != null && !isPreset);
  const [customText, setCustomText] = useState(value && !isPreset ? value : "");

  function handleCustomChange(text: string) {
    setCustomText(text);
    if (HEX_RE.test(text.trim())) {
      onChange(text.trim());
    }
  }

  const customInvalid = customText.length > 0 && !HEX_RE.test(customText.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {ACCENT_PAIRS.map((pair) => {
          const selected =
            !customOpen && value?.toLowerCase() === pair[0].toLowerCase();
          return (
            <Pressable
              key={pair[0]}
              accessibilityRole="button"
              accessibilityLabel={`Color de acento ${pair[0]}`}
              onPress={() => {
                setCustomOpen(false);
                onChange(pair[0]);
              }}
            >
              <LinearGradient
                colors={pair as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.swatch, selected ? styles.swatchSelected : null]}
              >
                {selected ? <Check size={16} color="#0A0A16" /> : null}
              </LinearGradient>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Color personalizado"
          onPress={() => setCustomOpen(true)}
        >
          <View
            style={[
              styles.swatch,
              styles.customSwatch,
              { borderColor: theme.colors.border },
              customOpen ? styles.swatchSelected : null,
            ]}
          >
            <Pipette size={16} color={theme.colors.text} />
          </View>
        </Pressable>
      </View>
      {customOpen ? (
        <TextInput
          label="Color personalizado (#RRGGBB)"
          autoCapitalize="none"
          placeholder="#7B5CFF"
          value={customText}
          onChangeText={handleCustomChange}
          error={customInvalid ? "Usa un color hex valido (#RRGGBB)." : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: "#FFFFFF",
  },
  customSwatch: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/components/AccentPicker.tsx
git commit -m "Add AccentPicker (brand presets + custom hex)"
```

---

## Task 5: LinksEditor component

**Files:**
- Create: `src/features/profile/components/LinksEditor.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/profile/components/LinksEditor.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";

const MAX_LINKS = 5;

export function LinksEditor({
  value,
  onChange,
}: {
  value: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
}) {
  const theme = useTheme();

  function patch(index: number, next: Partial<ProfileLink>) {
    onChange(value.map((link, i) => (i === index ? { ...link, ...next } : link)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    if (value.length < MAX_LINKS) {
      onChange([...value, { label: "", url: "" }]);
    }
  }

  return (
    <View style={styles.wrap}>
      {value.map((link, index) => {
        const urlInvalid =
          link.url.trim().length > 0 && !link.url.trim().startsWith("https://");
        return (
          <View key={index} style={[styles.item, { borderColor: theme.colors.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: theme.colors.textMuted }]}>
                Enlace {index + 1}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar enlace ${index + 1}`}
                onPress={() => remove(index)}
                style={({ hovered, pressed }) => [
                  styles.removeBtn,
                  hoverTransition,
                  pointerStyle,
                  { opacity: pressed ? 0.6 : hovered ? 0.85 : 1 },
                ]}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </Pressable>
            </View>
            <TextInput
              label="Etiqueta"
              placeholder="Mi portfolio"
              maxLength={40}
              value={link.label}
              onChangeText={(text) => patch(index, { label: text })}
            />
            <TextInput
              label="Enlace (https)"
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://..."
              value={link.url}
              onChangeText={(text) => patch(index, { url: text })}
              error={urlInvalid ? "Solo se permiten enlaces https seguros." : undefined}
            />
          </View>
        );
      })}
      {value.length < MAX_LINKS ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Anadir enlace"
          onPress={add}
          style={({ hovered, pressed }) => [
            styles.addBtn,
            hoverTransition,
            pointerStyle,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
              backgroundColor: hovered ? "rgba(255,255,255,0.05)" : "transparent",
            },
          ]}
        >
          <Plus size={18} color={theme.colors.text} />
          <Text style={[styles.addText, { color: theme.colors.text }]}>
            Anadir enlace
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.maxNote, { color: theme.colors.textFaint }]}>
          Maximo {MAX_LINKS} enlaces.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  item: {
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  maxNote: {
    fontSize: typography.small,
    fontWeight: "600",
    textAlign: "center",
  },
});
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/components/LinksEditor.tsx
git commit -m "Add LinksEditor (editable list, https check, max 5)"
```

---

## Task 6: LivePreviewHeader component

**Files:**
- Create: `src/features/profile/components/LivePreviewHeader.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/profile/components/LivePreviewHeader.tsx`:

```tsx
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
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
  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.banner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[`${accent[0]}66`, `${accent[1]}33`, "rgba(7,11,26,0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View style={styles.body}>
        <LinearGradient
          colors={accent as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.avatarRing, { borderColor: theme.colors.background }]}
        >
          <View style={[styles.avatarInner, { backgroundColor: theme.colors.background }]}>
            <Avatar uri={avatarUrl} label={displayName || username} size={54} />
          </View>
        </LinearGradient>
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
    borderWidth: 3,
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

Run: `npm run typecheck` (expected: PASS).

```bash
git add src/features/profile/components/LivePreviewHeader.tsx
git commit -m "Add LivePreviewHeader for edit-profile preview"
```

---

## Task 7: Wire EditProfileScreen

**Files:**
- Modify: `src/features/profile/screens/EditProfileScreen.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the screen**

Replace the ENTIRE contents of `src/features/profile/screens/EditProfileScreen.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Camera, Image as ImageIcon, Save, Trash2 } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import { profileSchema, type ProfileInput } from "../../../utils/validation";
import type { ProfileLink } from "../../../types/domain";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUpdateProfileMutation } from "../hooks/useProfile";
import { AccentPicker } from "../components/AccentPicker";
import { LinksEditor } from "../components/LinksEditor";
import { LivePreviewHeader } from "../components/LivePreviewHeader";
import { resolveAccent } from "../utils/resolve-accent";

const USERNAME_COOLDOWN_DAYS = 90;

export function EditProfileScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const updateProfile = useUpdateProfileMutation(auth.session?.user.id);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bio: "",
      avatarUrl: null,
      bannerUrl: null,
      accentColor: null,
      links: [],
    },
  });

  const avatarUrl = form.watch("avatarUrl");
  const bannerUrl = form.watch("bannerUrl");
  const displayName = form.watch("displayName");
  const username = form.watch("username");
  const accentColor = form.watch("accentColor");
  const links = form.watch("links") ?? [];

  const accent = resolveAccent({
    id: auth.session?.user.id ?? "",
    accent_color: accentColor ?? null,
  });

  const cooldownUntil = useMemo(() => {
    const changed = auth.profile?.username_changed_at;
    if (!changed) {
      return null;
    }
    const until = new Date(
      new Date(changed).getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
    );
    return until.getTime() > Date.now() ? until : null;
  }, [auth.profile?.username_changed_at]);

  useEffect(() => {
    if (auth.profile) {
      form.reset({
        username: auth.profile.username,
        displayName: auth.profile.display_name ?? "",
        bio: auth.profile.bio ?? "",
        avatarUrl: auth.profile.avatar_url,
        bannerUrl: auth.profile.banner_url,
        accentColor: auth.profile.accent_color ?? null,
        links: auth.profile.links ?? [],
      });
    }
  }, [auth.profile, form]);

  async function handlePickAvatar() {
    try {
      if (!auth.session?.user.id) {
        return;
      }
      setUploading(true);
      const asset = await pickImage();
      if (!asset?.base64) {
        return;
      }
      const url = await uploadBase64Image({
        bucket: "avatars",
        path: `${auth.session.user.id}/avatar.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      form.setValue("avatarUrl", url, { shouldValidate: true });
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handlePickBackground() {
    try {
      if (!auth.session?.user.id) {
        return;
      }
      setUploadingBg(true);
      const asset = await pickImage({ aspect: [9, 16] });
      if (!asset?.base64) {
        return;
      }
      const url = await uploadBase64Image({
        bucket: "banners",
        path: `${auth.session.user.id}/background.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      form.setValue("bannerUrl", url, { shouldValidate: true });
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploadingBg(false);
    }
  }

  async function handleSubmit(input: ProfileInput) {
    try {
      await updateProfile.mutateAsync(input);
      await auth.refreshProfile();
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar", getErrorMessage(error));
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Editar perfil</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Asi te veran en tu perfil. Los cambios se aplican al guardar.
          </Text>
        </View>

        <LivePreviewHeader
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl ?? null}
          bannerUrl={bannerUrl ?? null}
          accent={accent}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Apariencia</Text>
        <View style={styles.avatarRow}>
          <Avatar uri={avatarUrl} label={displayName} size={64} />
          <Button
            title="Cambiar avatar"
            variant="secondary"
            icon={<Camera size={18} color={theme.colors.text} />}
            loading={uploading}
            onPress={handlePickAvatar}
          />
        </View>
        <View
          style={[
            styles.bgPreview,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.bgEmpty}>
              <ImageIcon size={24} color={theme.colors.textFaint} />
              <Text style={[styles.bgEmptyText, { color: theme.colors.textFaint }]}>
                Sin fondo · se usa el cosmico
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bgActions}>
          <Button
            title={bannerUrl ? "Cambiar fondo" : "Elegir fondo"}
            variant="secondary"
            icon={<ImageIcon size={18} color={theme.colors.text} />}
            loading={uploadingBg}
            onPress={handlePickBackground}
          />
          {bannerUrl ? (
            <Button
              title="Quitar"
              variant="ghost"
              icon={<Trash2 size={18} color={theme.colors.text} />}
              onPress={() => form.setValue("bannerUrl", null, { shouldValidate: true })}
            />
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Identidad</Text>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextInput
              label="Nombre visible"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <TextInput
              label="Username"
              autoCapitalize="none"
              editable={!cooldownUntil}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {cooldownUntil ? (
          <Text style={[styles.hint, { color: theme.colors.warning }]}>
            Podras cambiar tu username el {cooldownUntil.toLocaleDateString()}.
          </Text>
        ) : null}
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <TextInput
              label="Bio"
              multiline
              maxLength={2000}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              style={styles.bioInput}
            />
          )}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Color de acento</Text>
        <AccentPicker
          value={accentColor ?? null}
          onChange={(hex) => form.setValue("accentColor", hex, { shouldValidate: true })}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Enlaces</Text>
        <LinksEditor
          value={links as ProfileLink[]}
          onChange={(next) => form.setValue("links", next, { shouldValidate: true })}
        />

        <Button
          title="Guardar cambios"
          size="lg"
          loading={updateProfile.isPending}
          icon={<Save size={18} color="#FFFFFF" />}
          onPress={form.handleSubmit(handleSubmit)}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: typography.h3,
    fontWeight: "800",
    marginTop: 4,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bgPreview: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  bgEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bgEmptyText: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  bgActions: {
    flexDirection: "row",
    gap: 10,
  },
  hint: {
    fontSize: typography.small,
    fontWeight: "600",
    marginTop: -8,
  },
  bioInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (`auth.profile.accent_color`/`links`/`username_changed_at` exist on `Profile`; `ProfileInput` has `accentColor`/`links`.)

- [ ] **Step 3: Run tests (no regressions)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/screens/EditProfileScreen.tsx
git commit -m "Rebuild EditProfileScreen: live preview, accent picker, links, long bio, username cooldown"
```

---

## Task 8: Wire ProfileScreen (resolveAccent + ProfileLinks + collapsible bio)

**Files:**
- Modify: `src/features/profile/screens/ProfileScreen.tsx`

- [ ] **Step 1: Update imports**

In `src/features/profile/screens/ProfileScreen.tsx`, replace the import line (line 70):

```ts
import { getProfileAccent, type AccentPair } from "../utils/profile-accent";
```

with:

```ts
import { getProfileAccent, type AccentPair } from "../utils/profile-accent";
import { resolveAccent } from "../utils/resolve-accent";
import { ProfileLinks } from "../components/ProfileLinks";
```

(`getProfileAccent` is still used by `OrbitCard`, so keep it.)

- [ ] **Step 2: Use the resolved accent**

Replace line 159:

```ts
  const accent = getProfileAccent(profile.data?.id ?? viewedId);
```

with:

```ts
  const accent = resolveAccent({
    id: profile.data?.id ?? viewedId ?? "",
    accent_color: profile.data?.accent_color ?? null,
  });
```

- [ ] **Step 3: Render links + make the bio collapsible in the Identity card**

In the `Identity` component, replace the bio block (lines 488-499):

```tsx
          {data.bio ? (
            <Text
              style={[
                styles.bio,
                { color: theme.colors.textMuted },
                centered ? styles.bioCentered : null,
              ]}
              numberOfLines={3}
            >
              {data.bio}
            </Text>
          ) : null}
        </View>
```

with:

```tsx
          {data.bio ? (
            <CollapsibleBio bio={data.bio} accent={accent} centered={centered} />
          ) : null}
          <ProfileLinks links={data.links ?? []} accent={accent} />
        </View>
```

- [ ] **Step 4: Add the CollapsibleBio component**

Immediately AFTER the `Identity` function closes (after its final `}` — i.e. before the `function AvatarRing` declaration at line 537), add:

```tsx
function CollapsibleBio({
  bio,
  accent,
  centered,
}: {
  bio: string;
  accent: AccentPair;
  centered: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  // Solo ofrecemos "ver mas" cuando la bio es larga (heuristica por longitud).
  const isLong = bio.length > 220;

  return (
    <View>
      <Text
        style={[
          styles.bio,
          { color: theme.colors.textMuted },
          centered ? styles.bioCentered : null,
        ]}
        numberOfLines={expanded ? undefined : 5}
      >
        {bio}
      </Text>
      {isLong ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((value) => !value)}
          style={[hoverTransition, pointerStyle]}
        >
          <Text style={[styles.bioToggle, { color: accent[0] }]}>
            {expanded ? "ver menos" : "ver mas"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 5: Add the toggle style**

In the `StyleSheet.create` block, immediately after the `bioCentered` style (lines 1373-1376), add:

```tsx
  bioToggle: {
    fontSize: typography.small,
    fontWeight: "800",
    marginTop: 6,
  },
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (`useState`, `Pressable`, `hoverTransition`, `pointerStyle`, `typography` are already imported in this file.)

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/profile/screens/ProfileScreen.tsx
git commit -m "Consume accent_color and links + collapsible bio in ProfileScreen"
```

---

## Task 9: Final validation

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: PASS (existing 13 + `resolve-accent` 5 + `link-presentation` 4 = 22 tests).

- [ ] **Step 3: Build web bundle (smoke check)**

Run: `npx expo export --platform web`
Expected: completes without bundling errors. (Confirms the new components/imports resolve on the RN-web target.)

- [ ] **Step 4: Spec coverage check**

Re-read `docs/superpowers/specs/2026-06-06-edit-profile-frontend-design.md` sections 3-7 and confirm each maps to a task: live preview (T6/T7), sectioned edit form (T7), accent picker presets+custom (T4/T7), links editor (T5/T7), username cooldown lock (T7), bio 2000 input (T7), resolveAccent (T1/T8), ProfileLinks rows+icons (T2/T3/T8), collapsible bio (T8), tests (T1/T2).

Expected: every requirement covered.

---

## Out of scope (do not implement)

Drag&drop reordering of links, real favicons, avatar/background cropping, and the deferred backend improvements (pronouns, headline, etc.). UI render-tests are not added (no established RN render-test infra); coverage is the pure-util tests + typecheck + web export smoke check + manual visual review.
