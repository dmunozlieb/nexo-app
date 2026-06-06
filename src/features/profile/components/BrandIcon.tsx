import Svg, { Path } from "react-native-svg";
import {
  siFacebook,
  siGithub,
  siInstagram,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";
import { Link as LinkIcon } from "lucide-react-native";
import { BRAND_COLORS, type LinkPlatform } from "../utils/link-presentation";

// simple-icons exporta { path, hex, ... }; usamos solo la geometria (24x24).
// Nota: siLinkedin no existe en simple-icons v16 — linkedin cae al icono generico.
const GLYPHS: Partial<Record<LinkPlatform, string>> = {
  youtube: siYoutube.path,
  instagram: siInstagram.path,
  twitch: siTwitch.path,
  twitter: siX.path,
  tiktok: siTiktok.path,
  github: siGithub.path,
  facebook: siFacebook.path,
};

export function BrandIcon({
  platform,
  size = 16,
  color,
}: {
  platform: LinkPlatform;
  size?: number;
  color?: string;
}) {
  const fill = color ?? BRAND_COLORS[platform];
  const glyph = GLYPHS[platform];
  if (!glyph) {
    // generic u otras: icono de enlace de lucide.
    return <LinkIcon size={size} color={fill} />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={glyph} fill={fill} />
    </Svg>
  );
}
