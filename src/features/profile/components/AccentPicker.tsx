import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Pipette } from "lucide-react-native";
import { TextInput } from "../../../components/ui/TextInput";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { ACCENT_PAIRS } from "../utils/profile-accent";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function AccentPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const theme = useTheme();
  const isPreset =
    value != null &&
    ACCENT_PAIRS.some((pair) => pair[0].toLowerCase() === value.toLowerCase());
  const [customOpen, setCustomOpen] = useState(value != null && !isPreset);
  const [customText, setCustomText] = useState(value && !isPreset ? value : "");

  // El value llega async (form.reset tras cargar el perfil): si es un color
  // custom (no preset), abrimos el input y reflejamos el hex guardado.
  useEffect(() => {
    if (value != null && !isPreset) {
      setCustomOpen(true);
      setCustomText(value);
    }
  }, [value, isPreset]);

  function handleCustomChange(text: string) {
    setCustomText(text);
    if (HEX_RE.test(text.trim())) {
      onChange(text.trim());
    }
  }

  const customInvalid = customText.length > 0 && !HEX_RE.test(customText.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {ACCENT_PAIRS.map((pair) => {
          const selected =
            !customOpen && value?.toLowerCase() === pair[0].toLowerCase();
          return (
            <Pressable
              key={pair[0]}
              accessibilityRole="button"
              accessibilityLabel={`Color de acento ${pair[0]}`}
              onPress={() => {
                setCustomOpen(false);
                onChange(pair[0]);
              }}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.88 : selected ? 1.08 : 1 }],
              })}
            >
              <LinearGradient
                colors={pair as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.swatch, selected ? styles.swatchSelected : null]}
              >
                {selected ? <Check size={16} color="#0A0A16" /> : null}
              </LinearGradient>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Color personalizado"
          onPress={() => setCustomOpen(true)}
        >
          <View
            style={[
              styles.swatch,
              styles.customSwatch,
              { borderColor: theme.colors.border },
              customOpen ? styles.swatchSelected : null,
            ]}
          >
            <Pipette size={16} color={theme.colors.text} />
          </View>
        </Pressable>
      </View>
      {customOpen ? (
        <TextInput
          label="Color personalizado (#RRGGBB)"
          autoCapitalize="none"
          placeholder="#7B5CFF"
          value={customText}
          onChangeText={handleCustomChange}
          error={customInvalid ? "Usa un color hex valido (#RRGGBB)." : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: "#FFFFFF",
  },
  customSwatch: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
  },
});
