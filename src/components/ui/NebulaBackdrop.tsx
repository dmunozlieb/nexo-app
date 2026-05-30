import { memo, type ComponentProps, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";

type NebulaBackdropProps = {
  /** Imagen de fondo cosmico (asset local via require o uri remota). */
  source: NonNullable<ComponentProps<typeof Image>["source"]>;
  /** Color del velo que se superpone para mantener legible el contenido. */
  dim?: string;
  /** Estilo del contenedor (posicion, overflow, etc.). */
  style?: StyleProp<ViewStyle>;
  /** Capas extra encima del velo, p.ej. estrellas animadas. */
  children?: ReactNode;
};

/**
 * Fondo cosmico reutilizable: imagen a pantalla completa con un velo oscuro
 * encima. Centraliza el look de marca para que home, detalle de Orbita y
 * futuras pantallas compartan el mismo tratamiento.
 */
export const NebulaBackdrop = memo(function NebulaBackdrop({
  source,
  dim,
  style,
  children,
}: NebulaBackdropProps) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.fill, style]}
    >
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      {dim ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dim }]} />
      ) : null}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});
