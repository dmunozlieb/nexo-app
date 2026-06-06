import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { AccentPair } from "../utils/profile-accent";

const TOP = { x: 0.5, y: 0 } as const;
const BOTTOM = { x: 0.5, y: 1 } as const;

// Fondo del perfil. Con banner: la imagen difuminada a pantalla completa que se
// funde de arriba (viva) hacia el fondo oscuro abajo (sin lineas de corte). Sin
// banner: el degradado del color de acento, igual de vivo arriba y oscuro abajo.
export const DerivedBackdrop = memo(function DerivedBackdrop({
  source,
  accent,
}: {
  source?: string | null | undefined;
  accent: AccentPair;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fill}
    >
      {source ? (
        <>
          <Image source={{ uri: source }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["transparent", "transparent", "#070B1A"]}
            locations={[0, 0.45, 1]}
            start={TOP}
            end={BOTTOM}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <>
          <LinearGradient
            colors={[accent[0], accent[1], "#070B1A"]}
            locations={[0, 0.4, 1]}
            start={TOP}
            end={BOTTOM}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,7,22,0.30)" }]} />
        </>
      )}
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
