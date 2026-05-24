import { useMemo } from "react";
import { palette, radius, spacing, typography } from "./tokens";
import { useUiStore } from "../stores/ui-store";

export function useTheme() {
  const themeMode = useUiStore((state) => state.themeMode);

  return useMemo(
    () => ({
      mode: themeMode,
      colors: palette[themeMode],
      spacing,
      radius,
      typography,
    }),
    [themeMode],
  );
}
