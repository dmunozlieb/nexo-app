import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type SectionTabsProps<T extends string> = {
  tabs: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
};

export function SectionTabs<T extends string>({
  tabs,
  value,
  onChange,
}: SectionTabsProps<T>) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderColor: selected ? theme.colors.secondary : theme.colors.border,
                opacity: pressed ? 0.76 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: selected ? "#FFFFFF" : theme.colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 10,
  },
  tab: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
  },
});
