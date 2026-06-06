import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CosmicBackground } from "../../../components/ui/CosmicBackground";

// Fondo derivado del banner: estrellas cosmicas de base + el banner difuminado
// como "glow" en la franja superior, disuelto hacia el fondo oscuro. El blur
// oculta el recorte, asi que funciona en movil y desktop por igual.
export const DerivedBackdrop = memo(function DerivedBackdrop({ source }: { source: string }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fill}
    >
      <CosmicBackground dim="rgba(6,7,22,0.62)" />
      <View style={styles.glow}>
        <Image source={{ uri: source }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["transparent", "#070B1A"]} style={StyleSheet.absoluteFill} />
      </View>
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
