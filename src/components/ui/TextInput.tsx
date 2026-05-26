import { forwardRef, useState, type ReactNode } from "react";
import {
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type TargetedEvent,
  type TextStyle,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import { Check } from "lucide-react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type InputState = "default" | "focus" | "error" | "success";

type TextInputProps = RNTextInputProps & {
  label?: string | undefined;
  error?: string | undefined;
  success?: boolean | undefined;
  icon?: ReactNode | undefined;
  rightElement?: ReactNode | undefined;
  compact?: boolean | undefined;
  showErrorMessage?: boolean | undefined;
  required?: boolean | undefined;
};

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      success,
      icon,
      rightElement,
      compact = false,
      showErrorMessage = true,
      required = false,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();
    const isMultiline = Boolean(props.multiline);
    const [focused, setFocused] = useState(false);

    const inputState: InputState = error
      ? "error"
      : success
        ? "success"
        : focused
          ? "focus"
          : "default";

    function setRefs(instance: RNTextInput | null) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }

    function handleFocus(event: NativeSyntheticEvent<TargetedEvent>) {
      setFocused(true);
      onFocus?.(event);
    }

    function handleBlur(event: NativeSyntheticEvent<TargetedEvent>) {
      setFocused(false);
      onBlur?.(event);
    }

    const stateStyles = getStateStyles(inputState, theme.colors);

    return (
      <View style={[styles.wrapper, compact ? styles.wrapperCompact : null]}>
        {label ? (
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                compact ? styles.labelCompact : null,
                { color: theme.colors.textSecondary ?? theme.colors.textMuted },
              ]}
            >
              {label}
              {required ? (
                <Text style={{ color: theme.colors.accent }}> *</Text>
              ) : null}
            </Text>
          </View>
        ) : null}
        <View
          accessibilityLabel={props.accessibilityLabel ?? label}
          style={[
            styles.inputRow,
            isMultiline ? styles.inputRowMultiline : styles.inputRowSingleLine,
            compact && !isMultiline ? styles.inputRowSingleLineCompact : null,
            {
              backgroundColor: stateStyles.backgroundColor,
              borderColor: stateStyles.borderColor,
              shadowColor: stateStyles.shadowColor,
              shadowOpacity: stateStyles.shadowOpacity,
            },
          ]}
        >
          {icon ? (
            <View
              style={[
                styles.iconWrap,
                compact ? styles.iconWrapCompact : null,
                {
                  backgroundColor: stateStyles.iconBackground,
                  borderColor: stateStyles.iconBorder,
                },
              ]}
            >
              {icon}
            </View>
          ) : null}
          <RNTextInput
            ref={setRefs}
            placeholderTextColor={theme.colors.textFaint}
            selectionColor={theme.colors.secondary}
            cursorColor={theme.colors.secondary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              webInputReset,
              Platform.OS === "web"
                ? ({
                    caretColor: theme.colors.secondary,
                  } as unknown as TextStyle)
                : undefined,
              isMultiline ? styles.inputMultiline : styles.inputSingleLine,
              compact && !isMultiline ? styles.inputSingleLineCompact : null,
              { color: theme.colors.text },
              style,
            ]}
            {...props}
          />
          {success && !rightElement ? (
            <View style={styles.rightWrap}>
              <View
                style={[
                  styles.successCheck,
                  { backgroundColor: `${theme.colors.success}20` },
                ]}
              >
                <Check size={14} color={theme.colors.success} strokeWidth={3} />
              </View>
            </View>
          ) : null}
          {rightElement ? (
            <View style={styles.rightWrap}>{rightElement}</View>
          ) : null}
        </View>
        {error && showErrorMessage ? (
          <Text
            numberOfLines={compact ? 1 : 2}
            style={[
              styles.error,
              compact ? styles.errorCompact : null,
              { color: theme.colors.error },
            ]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextInput.displayName = "TextInput";

function getStateStyles(
  state: InputState,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  switch (state) {
    case "error":
      return {
        borderColor: colors.error,
        backgroundColor: `${colors.error}08`,
        shadowColor: colors.error,
        shadowOpacity: 0.2,
        iconBackground: `${colors.error}15`,
        iconBorder: `${colors.error}40`,
      };
    case "success":
      return {
        borderColor: colors.success,
        backgroundColor: `${colors.success}08`,
        shadowColor: colors.success,
        shadowOpacity: 0.15,
        iconBackground: `${colors.success}15`,
        iconBorder: `${colors.success}40`,
      };
    case "focus":
      return {
        borderColor: colors.secondary,
        backgroundColor: "rgba(27,30,53,0.92)",
        shadowColor: colors.secondary,
        shadowOpacity: 0.24,
        iconBackground: `${colors.secondary}18`,
        iconBorder: `${colors.secondary}55`,
      };
    default:
      return {
        borderColor: colors.border ?? "rgba(255,255,255,0.1)",
        backgroundColor: colors.elevated,
        shadowColor: "transparent",
        shadowOpacity: 0,
        iconBackground: colors.surface,
        iconBorder: "transparent",
      };
  }
}

const webInputReset =
  Platform.OS === "web"
    ? ({
        outline: "none",
        outlineWidth: 0,
        outlineStyle: "none",
        outlineColor: "transparent",
        boxShadow: "none",
        borderWidth: 0,
        backgroundColor: "transparent",
      } as unknown as TextStyle)
    : undefined;

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  wrapperCompact: {
    gap: 5,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: typography.small,
    fontWeight: "700",
    letterSpacing: 0,
  },
  labelCompact: {
    fontSize: 12,
  },
  inputRow: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: "row",
    gap: 10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  inputRowSingleLine: {
    height: 56,
    alignItems: "center",
  },
  inputRowSingleLineCompact: {
    height: 48,
    paddingLeft: 8,
    paddingRight: 8,
    gap: 8,
  },
  inputRowMultiline: {
    minHeight: 112,
    alignItems: "flex-start",
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconWrapCompact: {
    width: 30,
    height: 30,
  },
  input: {
    flex: 1,
    paddingHorizontal: 0,
    fontSize: typography.body,
    fontWeight: "600",
    includeFontPadding: false,
  },
  inputSingleLine: {
    height: 56,
    minHeight: 56,
    paddingTop: 0,
    paddingBottom: 0,
    alignSelf: "center",
    textAlignVertical: "center",
  },
  inputSingleLineCompact: {
    height: 48,
    minHeight: 48,
    fontSize: typography.small,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 0,
    paddingBottom: 0,
    alignSelf: "stretch",
    textAlignVertical: "top",
  },
  rightWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  successCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: typography.small,
    lineHeight: 17,
    fontWeight: "600",
  },
  errorCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
