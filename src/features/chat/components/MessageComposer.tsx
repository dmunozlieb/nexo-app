import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Send, Timer } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

type MessageComposerProps = {
  onSend: (body: string) => Promise<void> | void;
  disabled?: boolean;
  sending?: boolean;
  slowModeSeconds?: number;
  placeholder?: string;
};

export function MessageComposer({
  onSend,
  disabled,
  sending,
  slowModeSeconds = 0,
  placeholder = "Escribe un mensaje...",
}: MessageComposerProps) {
  const theme = useTheme();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const remaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;
  const inCooldown = remaining > 0;
  const trimmed = value.trim();
  const canSend = !disabled && !sending && !inCooldown && trimmed.length > 0;

  async function handleSend() {
    if (!canSend) return;
    const body = trimmed;
    setValue("");
    try {
      await onSend(body);
      if (slowModeSeconds > 0) {
        setCooldownUntil(Date.now() + slowModeSeconds * 1000);
      }
    } catch {
      setValue(body);
    }
  }

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: focused ? theme.colors.secondary : theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {inCooldown ? (
        <View style={styles.cooldownRow}>
          <Timer size={13} color={theme.colors.warning} />
          <Text
            style={[styles.cooldownText, { color: theme.colors.warning }]}
          >
            Modo lento: espera {remaining}s
          </Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textFaint}
          multiline
          maxLength={1000}
          editable={!disabled}
          style={[styles.input, { color: theme.colors.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend
                ? theme.colors.primary
                : "rgba(255,255,255,0.06)",
              opacity: pressed ? 0.84 : 1,
            },
          ]}
        >
          <Send size={17} color={canSend ? "#FFFFFF" : theme.colors.textFaint} />
        </Pressable>
      </View>

      {value.length > 800 ? (
        <Text style={[styles.counter, { color: theme.colors.textFaint }]}>
          {value.length}/1000
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 8,
    gap: 6,
  },
  cooldownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  cooldownText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 128,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: typography.body,
    fontWeight: "500",
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: typography.tiny,
    fontWeight: "700",
    paddingRight: 6,
  },
});
