import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: string;
};

export function SectionHeader({ title, subtitle, meta }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textFaint }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text style={[styles.meta, { color: theme.colors.textFaint }]}>{meta}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  meta: {
    fontSize: typography.small,
    fontWeight: "900",
  },
});
