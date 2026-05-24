import type { PropsWithChildren } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { maxContentWidth, radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>;

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Cerrar"
          style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
});
