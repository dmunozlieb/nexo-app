import { Platform, type ViewStyle } from "react-native";

/**
 * Transicion CSS (solo web) para suavizar los cambios de hover/press.
 * En nativo no hay puntero, asi que se omite. Se castea porque las props
 * de transicion son exclusivas de react-native-web y no estan en ViewStyle.
 */
export const hoverTransition: ViewStyle | null =
  Platform.OS === "web"
    ? ({
        transitionProperty:
          "transform, border-color, box-shadow, opacity, background-color, color",
        transitionDuration: "220ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      } as unknown as ViewStyle)
    : null;
