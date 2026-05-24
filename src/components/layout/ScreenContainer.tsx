import type { PropsWithChildren, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { maxContentWidth } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  children,
  scroll = false,
  header,
  footer,
  contentStyle,
}: ScreenContainerProps) {
  const theme = useTheme();

  const body = (
    <View style={[styles.content, contentStyle]}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
