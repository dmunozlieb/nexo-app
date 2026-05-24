import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type AvatarProps = {
  uri?: string | null | undefined;
  label?: string | null | undefined;
  size?: number;
};

export function Avatar({ uri, label, size = 44 }: AvatarProps) {
  const theme = useTheme();
  const initials = (label ?? "NX")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (uri) {
    return (
      <Image
        accessibilityLabel={label ? `Avatar de ${label}` : "Avatar"}
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={160}
      />
    );
  }

  return (
    <View
      accessibilityLabel={label ? `Avatar de ${label}` : "Avatar"}
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.elevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.initials, { color: theme.colors.text }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  fallback: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "800",
  },
});
