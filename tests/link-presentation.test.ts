/// <reference types="jest" />

import { BRAND_COLORS, linkPresentation } from "../src/features/profile/utils/link-presentation";

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
});
