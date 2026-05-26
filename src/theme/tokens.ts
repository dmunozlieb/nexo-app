export const palette = {
  dark: {
    background: "#050810",
    surface: "#0D1230",
    elevated: "#182044",
    border: "#1E2A5E",
    primary: "#7B5CFF",
    primaryMuted: "#5B3FCC",
    secondary: "#18D7FF",
    secondaryMuted: "#0EA5C7",
    accent: "#FF4FD8",
    accentMuted: "#CC3DAD",
    success: "#22E6B9",
    warning: "#FFB020",
    error: "#FF4757",
    text: "#F6F7FB",
    textSecondary: "#B4BCD0",
    textMuted: "#B9C1D9",
    textFaint: "#6B7394",
    overlay: "rgba(5, 8, 16, 0.88)",
  },
  light: {
    background: "#F5F7FE",
    surface: "#FFFFFF",
    elevated: "#EEF1FF",
    border: "#D8DEF2",
    primary: "#6548EE",
    secondary: "#008FB3",
    accent: "#C920A7",
    success: "#0B8F5E",
    warning: "#A86600",
    error: "#D1345B",
    text: "#171927",
    textMuted: "#596176",
    textFaint: "#80889C",
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

export const hitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

export const maxContentWidth = 860;
