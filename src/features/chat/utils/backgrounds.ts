export type ChatBackgroundPreset = {
  id: string;
  label: string;
  gradient: readonly [string, string];
};

// Presets cósmicos (gradientes, sin assets externos).
export const CHAT_BACKGROUNDS: ChatBackgroundPreset[] = [
  { id: "nebula-violet", label: "Nebulosa violeta", gradient: ["#241355", "#08243a"] },
  { id: "magenta-void", label: "Vacío magenta", gradient: ["#3a0f3a", "#0c1430"] },
  { id: "deep-cyan", label: "Cian profundo", gradient: ["#06263a", "#04121f"] },
  { id: "pulsar", label: "Púlsar", gradient: ["#5b3fe0", "#0a0f22"] },
  { id: "emerald-drift", label: "Deriva esmeralda", gradient: ["#1a3a1a", "#06121a"] },
];

export type ResolvedBackground =
  | { kind: "none" }
  | { kind: "preset"; gradient: readonly [string, string] }
  | { kind: "image"; uri: string };

export function presetValue(id: string): string {
  return `preset:${id}`;
}

export function resolveBackground(value: string | null): ResolvedBackground {
  if (!value || value.trim() === "") return { kind: "none" };
  if (value.startsWith("preset:")) {
    const id = value.slice("preset:".length);
    const preset = CHAT_BACKGROUNDS.find((p) => p.id === id);
    return preset ? { kind: "preset", gradient: preset.gradient } : { kind: "none" };
  }
  return { kind: "image", uri: value };
}
