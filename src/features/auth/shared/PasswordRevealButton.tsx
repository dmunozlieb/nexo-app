import { Pressable, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";

type PasswordRevealButtonProps = {
  visible: boolean;
  onPress: () => void;
};

export function PasswordRevealButton({
  visible,
  onPress,
}: PasswordRevealButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.68 : 1 }]}
    >
      {visible ? (
        <Eye size={19} color={theme.colors.textMuted} />
      ) : (
        <EyeOff size={19} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
