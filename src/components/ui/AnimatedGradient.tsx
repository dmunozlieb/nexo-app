import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const DEFAULT_COLORS = ["#FF5FA2", "#FF3DF0", "#7B5CFF", "#22D3FF"] as const;

// Degradado multicolor que se desplaza horizontalmente en bucle. La banda interna
// mide el doble de ancho y se anima con translateX (native driver) para un loop
// continuo. Con reduce-motion queda estatico.
export function AnimatedGradient({
  colors = DEFAULT_COLORS,
  style,
}: {
  colors?: readonly string[];
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  // Colores duplicados para que el desplazamiento sea continuo (tile).
  const tiled = [...colors, ...colors] as unknown as readonly [string, string];

  useEffect(() => {
    if (reduced || width === 0) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [x, reduced, width]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });

  return (
    <View
      style={[styles.clip, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { width: width * 2, transform: reduced ? [] : [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={tiled}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
