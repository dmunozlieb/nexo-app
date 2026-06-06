import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { BrandIcon } from "./BrandIcon";
import { linkPresentation } from "../utils/link-presentation";

const MAX_LINKS = 5;

export function LinksEditor({
  value,
  onChange,
}: {
  value: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
}) {
  const theme = useTheme();

  function patch(index: number, next: Partial<ProfileLink>) {
    onChange(value.map((link, i) => (i === index ? { ...link, ...next } : link)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    if (value.length < MAX_LINKS) {
      onChange([...value, { label: "", url: "" }]);
    }
  }

  return (
    <View style={styles.wrap}>
      {value.map((link, index) => {
        const urlInvalid =
          link.url.trim().length > 0 && !link.url.trim().startsWith("https://");
        const platform = link.url.trim() ? linkPresentation(link.url).platform : "generic";
        return (
          <View key={`${link.url}-${index}`} style={[styles.item, { borderColor: theme.colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <BrandIcon platform={platform} size={16} />
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                  Enlace {index + 1}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar enlace ${index + 1}`}
                onPress={() => remove(index)}
                style={({ hovered, pressed }) => [
                  styles.removeBtn,
                  hoverTransition,
                  pointerStyle,
                  { opacity: pressed ? 0.6 : hovered ? 0.85 : 1 },
                ]}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </Pressable>
            </View>
            <TextInput
              label="Etiqueta"
              placeholder="Mi portfolio"
              maxLength={40}
              value={link.label}
              onChangeText={(text) => patch(index, { label: text })}
            />
            <TextInput
              label="Enlace (https)"
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://..."
              value={link.url}
              onChangeText={(text) => patch(index, { url: text })}
              error={urlInvalid ? "Solo se permiten enlaces https seguros." : undefined}
            />
          </View>
        );
      })}
      {value.length < MAX_LINKS ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Anadir enlace"
          onPress={add}
          style={({ hovered, pressed }) => [
            styles.addBtn,
            hoverTransition,
            pointerStyle,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.7 : 1,
              backgroundColor: hovered ? "rgba(255,255,255,0.05)" : "transparent",
            },
          ]}
        >
          <Plus size={18} color={theme.colors.text} />
          <Text style={[styles.addText, { color: theme.colors.text }]}>
            Anadir enlace
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.maxNote, { color: theme.colors.textFaint }]}>
          Maximo {MAX_LINKS} enlaces.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  item: {
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  maxNote: {
    fontSize: typography.small,
    fontWeight: "600",
    textAlign: "center",
  },
});
