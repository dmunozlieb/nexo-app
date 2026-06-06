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
