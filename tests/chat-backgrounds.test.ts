/// <reference types="jest" />

import {
  CHAT_BACKGROUNDS,
  resolveBackground,
} from "../src/features/chat/utils/backgrounds";

describe("resolveBackground", () => {
  it("devuelve none con valor vacío o nulo", () => {
    expect(resolveBackground(null)).toEqual({ kind: "none" });
    expect(resolveBackground("")).toEqual({ kind: "none" });
  });

  it("resuelve un preset conocido a su gradiente", () => {
    const preset = CHAT_BACKGROUNDS[0]!;
    const result = resolveBackground(`preset:${preset.id}`);
    expect(result).toEqual({ kind: "preset", gradient: preset.gradient });
  });

  it("trata un preset desconocido como none", () => {
    expect(resolveBackground("preset:no-existe")).toEqual({ kind: "none" });
  });

  it("trata cualquier otra cosa como imagen", () => {
    expect(resolveBackground("https://x/y.jpg")).toEqual({
      kind: "image",
      uri: "https://x/y.jpg",
    });
  });
});
