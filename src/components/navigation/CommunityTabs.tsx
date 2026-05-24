import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

export type CommunityTabItem<T extends string> = {
  label: string;
  value: T;
  icon?: ReactNode;
};

type CommunityTabsProps<T extends string> = {
  tabs: Array<CommunityTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
};

export function CommunityTabs<T extends string>({
  tabs,
  value,
  onChange,
}: CommunityTabsProps<T>) {
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
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => [
              styles.tab,
              {
                borderColor: selected
                  ? `${theme.colors.secondary}99`
                  : `${theme.colors.border}CC`,
                backgroundColor: selected
                  ? "transparent"
                  : "rgba(18,20,39,0.72)",
                shadowColor: selected ? theme.colors.secondary : "transparent",
                shadowOpacity: selected ? 0.24 : 0,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            {selected ? (
              <LinearGradient
                colors={[`${theme.colors.primary}D4`, `${theme.colors.secondary}45`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                  style={styles.activeFill}
              />
            ) : null}
            {selected ? (
              <View
                style={[
                  styles.orbitMark,
                  { borderColor: "rgba(255,255,255,0.72)" },
                ]}
              />
            ) : null}
            {tab.icon}
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
    paddingVertical: 2,
  },
  tab: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    overflow: "hidden",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  activeFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  orbitMark: {
    width: 16,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    transform: [{ rotate: "-22deg" }],
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
  },
});
