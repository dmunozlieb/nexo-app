import type { ReactNode } from "react";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_CTA_GRADIENT = ["#8B5CF6", "#22D3EE"] as const;

export const AUTH_STORY = {
  badge: "Tu galaxia te espera",
  title: "Tus Orbitas siguen girando",
  copy: "Retoma conversaciones, descubre senales nuevas y reconecta con tus comunidades justo donde lo dejaste.",
} as const;

export type AuthSignalSpec = {
  label: string;
  hint: string;
  colorKey: "primary" | "secondary" | "accent";
  iconKey: "sparkles" | "orbit" | "radio";
};

export const AUTH_VISUAL_SIGNALS: ReadonlyArray<AuthSignalSpec> = [
  { label: "Ecos", hint: "esperandote", colorKey: "primary", iconKey: "sparkles" },
  { label: "Orbitas", hint: "vivas", colorKey: "secondary", iconKey: "orbit" },
  { label: "Senales", hint: "nuevas", colorKey: "accent", iconKey: "radio" },
];

export type AuthVisualSignalRenderInput = {
  label: string;
  hint: string;
  color: string;
  icon: ReactNode;
};
