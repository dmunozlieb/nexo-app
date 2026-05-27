import { StyleSheet, Text, View } from "react-native";
import { fontFamilies, radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

type AuthErrorAlertProps = {
  message: string | null;
};

export function AuthErrorAlert({ message }: AuthErrorAlertProps) {
  const theme = useTheme();

  if (!message) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.block,
        {
          backgroundColor: `${theme.colors.error}18`,
          borderColor: `${theme.colors.error}70`,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "600",
  },
});
