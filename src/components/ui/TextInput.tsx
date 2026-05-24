import { forwardRef, type ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type TextStyle,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type TextInputProps = RNTextInputProps & {
  label?: string | undefined;
  error?: string | undefined;
  icon?: ReactNode | undefined;
  rightElement?: ReactNode | undefined;
};

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      icon,
      rightElement,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();
    const isMultiline = Boolean(props.multiline);

    function setRefs(instance: RNTextInput | null) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            {label}
          </Text>
        ) : null}
        <View
          accessibilityLabel={props.accessibilityLabel ?? label}
          style={[
            styles.inputRow,
            isMultiline ? styles.inputRowMultiline : styles.inputRowSingleLine,
            {
              backgroundColor: theme.colors.elevated,
              borderColor: error ? theme.colors.error : "transparent",
            },
          ]}
        >
          {icon ? (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.colors.surface,
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
            onFocus={onFocus}
            onBlur={onBlur}
            style={[
              styles.input,
              webInputReset,
              Platform.OS === "web"
                ? ({ caretColor: theme.colors.secondary } as unknown as TextStyle)
                : undefined,
              isMultiline ? styles.inputMultiline : styles.inputSingleLine,
              { color: theme.colors.text },
              style,
            ]}
            {...props}
          />
          {rightElement ? <View style={styles.rightWrap}>{rightElement}</View> : null}
        </View>
        {error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
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
  label: {
    fontSize: typography.small,
    fontWeight: "700",
    letterSpacing: 0,
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: "row",
    gap: 10,
  },
  inputRowSingleLine: {
    height: 56,
    alignItems: "center",
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
  error: {
    fontSize: typography.small,
  },
});
