import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Radio } from "lucide-react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { formatCompactNumber } from "../../utils/format";

type OnlineIndicatorProps = {
  count?: number | null;
  compact?: boolean;
};

export function OnlineIndicator({ count = 1, compact = false }: OnlineIndicatorProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0],
  });

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  return (
    <View style={styles.root}>
      <View style={styles.dotWrap}>
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: theme.colors.success,
              opacity: reducedMotion ? 0 : opacity,
              transform: [{ scale }],
            },
          ]}
        />
        <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
      </View>
      {!compact ? <Radio size={13} color={theme.colors.success} /> : null}
      <Text style={[styles.text, { color: theme.colors.textFaint }]}>
        {formatCompactNumber(count ?? 1)} online
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dotWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
});
