import { AlertCircle, CheckCircle2 } from "lucide-react-native";
import { forwardRef, useState, type ReactNode } from "react";
import {
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type StyleProp,
  type TargetedEvent,
  type TextStyle,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from "react-native";
import { fontFamilies, radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type TextInputProps = RNTextInputProps & {
  label?: string | undefined;
  error?: string | undefined;
  icon?: ReactNode | undefined;
  rightElement?: ReactNode | undefined;
  compact?: boolean | undefined;
  showErrorMessage?: boolean | undefined;
  success?: boolean | undefined;
  surface?: "default" | "auth" | undefined;
  inputContainerStyle?: StyleProp<ViewStyle>;
};

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      icon,
      rightElement,
      compact = false,
      showErrorMessage = true,
      success = false,
      surface = "default",
      inputContainerStyle,
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

    const isAuthSurface = surface === "auth";
    const borderColor = error
      ? theme.colors.error
      : focused
        ? theme.colors.secondary
        : success
          ? `${theme.colors.secondary}88`
          : "rgba(255,255,255,0.1)";

    return (
      <View style={[styles.wrapper, compact ? styles.wrapperCompact : null]}>
        {label ? (
          <Text
            style={[
              styles.label,
              compact ? styles.labelCompact : null,
              {
                color: theme.colors.textMuted,
                fontFamily: isAuthSurface
                  ? fontFamilies.interSemiBold
                  : undefined,
                fontWeight: isAuthSurface ? "600" : "700",
              },
            ]}
          >
            {label}
          </Text>
        ) : null}
        <View
          accessibilityLabel={props.accessibilityLabel ?? label}
          style={[
            styles.inputRow,
            isMultiline ? styles.inputRowMultiline : styles.inputRowSingleLine,
            compact && !isMultiline ? styles.inputRowSingleLineCompact : null,
            {
              backgroundColor: focused
                ? isAuthSurface
                  ? "rgba(255,255,255,0.055)"
                  : "rgba(27,30,53,0.92)"
                : isAuthSurface
                  ? "rgba(255,255,255,0.035)"
                  : theme.colors.elevated,
              borderColor,
              shadowColor: focused ? theme.colors.secondary : "transparent",
              shadowOpacity: focused ? 0.24 : 0,
            },
            inputContainerStyle,
          ]}
        >
          {icon ? (
            <View
              style={[
                styles.iconWrap,
                compact ? styles.iconWrapCompact : null,
                {
                  backgroundColor: isAuthSurface
                    ? "transparent"
                    : focused
                      ? `${theme.colors.secondary}18`
                      : theme.colors.surface,
                  borderColor:
                    !isAuthSurface && focused
                      ? `${theme.colors.secondary}55`
                      : "transparent",
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
              {
                color: theme.colors.text,
                fontFamily: isAuthSurface
                  ? fontFamilies.interMedium
                  : undefined,
                fontWeight: isAuthSurface ? "500" : "600",
              },
              style,
            ]}
            {...props}
          />
          {success && !error ? (
            <View style={styles.successWrap}>
              <CheckCircle2 size={16} color={theme.colors.secondary} />
            </View>
          ) : null}
          {error && rightElement ? (
            <View style={styles.successWrap}>
              <AlertCircle size={16} color={theme.colors.error} />
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
              {
                color: theme.colors.error,
                fontFamily: isAuthSurface
                  ? fontFamilies.interMedium
                  : undefined,
                fontWeight: isAuthSurface ? "500" : undefined,
              },
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
  label: {
    fontSize: typography.small,
    fontWeight: "700",
    letterSpacing: 0,
  },
  labelCompact: {
    fontSize: 12,
  },
  inputRow: {
    borderWidth: 1,
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
  successWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: typography.small,
    lineHeight: 17,
  },
  errorCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
