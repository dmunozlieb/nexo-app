/// <reference types="jest" />

import { resolveAccent, shiftHue } from "../src/features/profile/utils/resolve-accent";
import { ACCENT_PAIRS, getProfileAccent } from "../src/features/profile/utils/profile-accent";

describe("resolveAccent", () => {
  it("usa el par derivado del id cuando no hay accent_color", () => {
    const result = resolveAccent({ id: "user-1", accent_color: null });
    expect(result).toEqual(getProfileAccent("user-1"));
  });

  it("devuelve el par de marca exacto cuando accent_color es un preset", () => {
    const preset = ACCENT_PAIRS[1]!;
    const result = resolveAccent({ id: "user-1", accent_color: preset[0] });
    expect(result).toEqual(preset);
  });

  it("hace match de preset sin importar mayusculas/minusculas", () => {
    const preset = ACCENT_PAIRS[0]!;
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
