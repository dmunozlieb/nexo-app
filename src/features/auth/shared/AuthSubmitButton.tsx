import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { fontFamilies, radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { AUTH_CTA_GRADIENT } from "./constants";

type AuthSubmitButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconRight?: ReactNode | null;
  style?: StyleProp<ViewStyle>;
};

export function AuthSubmitButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconRight,
  style,
}: AuthSubmitButtonProps) {
  const theme = useTheme();

  const resolvedIcon =
    iconRight === null
      ? undefined
      : iconRight ?? <ArrowRight size={18} color="#FFFFFF" />;

  return (
    <Button
      title={title}
      size="lg"
      loading={loading}
      disabled={disabled}
      gradient={AUTH_CTA_GRADIENT}
      iconRight={resolvedIcon}
      onPress={onPress}
      style={[
        styles.button,
        { borderColor: "transparent", shadowColor: theme.colors.primary },
        style,
      ]}
      textStyle={styles.text}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 3,
    minHeight: 48,
    borderRadius: radius.lg,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  text: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
});
