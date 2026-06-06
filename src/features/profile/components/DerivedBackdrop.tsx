import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { AccentPair } from "../utils/profile-accent";

// Fondo del perfil derivado del banner difuminado (glow superior que se disuelve
// hacia el fondo oscuro). Sin banner, el fondo es el degradado del color de acento
// del usuario (atenuado para mantener legible el contenido).
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
        <View style={styles.glow}>
          <Image source={{ uri: source }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["transparent", "#070B1A"]} style={StyleSheet.absoluteFill} />
        </View>
      ) : (
        <>
          <LinearGradient
            colors={accent as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,7,22,0.55)" }]} />
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
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    overflow: "hidden",
  },
});
