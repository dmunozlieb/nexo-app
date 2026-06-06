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
