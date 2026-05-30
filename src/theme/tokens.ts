export const palette = {
  dark: {
    background: "#070B1A",
    surface: "#0D1230",
    elevated: "#182044",
    border: "#303A66",
    primary: "#7B5CFF",
    secondary: "#18D7FF",
    accent: "#FF4FD8",
    // Acentos semanticos de descubrimiento: destacados/eventos (ambar) y
    // presencia/vivo ahora (verde aurora).
    featured: "#FFC24D",
    aurora: "#4DF0B0",
    success: "#22E6B9",
    warning: "#FF7AA8",
    error: "#FF5C8A",
    text: "#F6F7FB",
    textMuted: "#B9C1D9",
    textFaint: "#8490B4",
    // Empty states (escena cosmica): glow/void/estrellas + acento calido de Ecos.
    emptyVoid: "#0A0F24",
    emptyNebulaEdge: "#120A33",
    emptyStarlight: "#DCE6FF",
    emptyAuroraGold: "#FFC861",
    overlay: "rgba(7, 11, 26, 0.84)",
  },
  light: {
    background: "#F5F7FE",
    surface: "#FFFFFF",
    elevated: "#EEF1FF",
    border: "#D8DEF2",
    primary: "#6548EE",
    secondary: "#008FB3",
    accent: "#C920A7",
    featured: "#FFC24D",
    aurora: "#4DF0B0",
    success: "#0B8F5E",
    warning: "#A86600",
    error: "#D1345B",
    text: "#171927",
    textMuted: "#596176",
    textFaint: "#80889C",
    // Empty states: misma escena cosmica (se renderiza sobre superficie oscura).
    emptyVoid: "#0A0F24",
    emptyNebulaEdge: "#120A33",
    emptyStarlight: "#DCE6FF",
    emptyAuroraGold: "#FFC861",
    overlay: "rgba(9, 10, 18, 0.46)",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const fontFamilies = {
  interRegular: "Inter_400Regular",
  interMedium: "Inter_500Medium",
  interSemiBold: "Inter_600SemiBold",
  interBold: "Inter_700Bold",
} as const;

export const hitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

export const maxContentWidth = 860;
