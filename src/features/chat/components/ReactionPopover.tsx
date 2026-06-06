import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { QUICK_REACTIONS } from "../constants/reactions";

type ReactionPopoverProps = {
  onPick: (emoji: string) => void;
  align?: "flex-start" | "flex-end";
};

export function ReactionPopover({ onPick, align = "flex-start" }: ReactionPopoverProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.popover,
        {
          alignSelf: align,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          accessibilityRole="button"
          accessibilityLabel={`Reaccionar ${emoji}`}
          onPress={() => onPick(emoji)}
          style={({ pressed, hovered }) => [
            styles.item,
            {
              backgroundColor: hovered ? "rgba(255,255,255,0.08)" : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  popover: {
    flexDirection: "row",
    gap: 2,
    padding: 5,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 8 },
  emoji: { fontSize: 20 },
});
