import {
  BookOpen,
  Cpu,
  Film,
  Gamepad2,
  GraduationCap,
  Hash,
  LayoutGrid,
  Music,
  Palette,
  type LucideIcon,
} from "lucide-react-native";

/** Icono por categoria, compartido entre los chips y el panel de pulso. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Todas: LayoutGrid,
  Arte: Palette,
  Gaming: Gamepad2,
  Lectura: BookOpen,
  Musica: Music,
  Cine: Film,
  Aprendizaje: GraduationCap,
  Tecnologia: Cpu,
};

export function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Hash;
}
