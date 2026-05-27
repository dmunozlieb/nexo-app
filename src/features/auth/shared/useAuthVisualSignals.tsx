import { useMemo } from "react";
import { Orbit, Radio, Sparkles } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import {
  AUTH_VISUAL_SIGNALS,
  type AuthSignalSpec,
  type AuthVisualSignalRenderInput,
} from "./constants";

export function useAuthVisualSignals(): AuthVisualSignalRenderInput[] {
  const theme = useTheme();

  return useMemo(
    () =>
      AUTH_VISUAL_SIGNALS.map((signal) => {
        const color = theme.colors[signal.colorKey];
        return {
          label: signal.label,
          hint: signal.hint,
          color,
          icon: renderSignalIcon(signal, color),
        };
      }),
    [theme.colors.primary, theme.colors.secondary, theme.colors.accent],
  );
}

function renderSignalIcon(signal: AuthSignalSpec, color: string) {
  switch (signal.iconKey) {
    case "sparkles":
      return <Sparkles size={12} color={color} />;
    case "orbit":
      return <Orbit size={12} color={color} />;
    case "radio":
      return <Radio size={12} color={color} />;
  }
}
