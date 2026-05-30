import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { CommunityBanner } from "../../../components/content/CommunityBanner";
import { OnlineIndicator } from "../../../components/content/OnlineIndicator";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { formatCompactNumber } from "../../../utils/format";
import { hoverTransition } from "../../../utils/web-style";
import { buildSignals, SignalChips } from "../../../components/content/SignalChips";
import { onlineOf } from "../helpers";

const pointerStyle = { cursor: "pointer" } as unknown as ViewStyle;

type RailProps = {
  title: string;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
};

/**
 * Arrastrar con el raton para desplazar el carrusel (solo web). Accede al nodo
 * DOM del ScrollView y mueve scrollLeft. Si hubo arrastre, cancela el click
 * siguiente para no abrir una orbita sin querer al soltar.
 */
function useDragToScroll(scrollRef: { current: ScrollView | null }) {
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const node: any = (scrollRef.current as any)?.getScrollableNode?.();
    if (!node) {
      return;
    }

    const win: any = globalThis;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (event: any) => {
      down = true;
      moved = false;
      startX = event.pageX;
      startScroll = node.scrollLeft;
      node.style.cursor = "grabbing";
    };
    const onMove = (event: any) => {
      if (!down) {
        return;
      }
      const dx = event.pageX - startX;
      if (Math.abs(dx) > 4) {
        moved = true;
      }
      node.scrollLeft = startScroll - dx;
      event.preventDefault();
    };
    const onUp = () => {
      down = false;
      node.style.cursor = "grab";
    };
    const onClick = (event: any) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    };

    node.style.cursor = "grab";
    node.style.userSelect = "none";
    node.addEventListener("mousedown", onDown);
    win.addEventListener("mousemove", onMove);
    win.addEventListener("mouseup", onUp);
    node.addEventListener("click", onClick, true);

    return () => {
      node.removeEventListener("mousedown", onDown);
      win.removeEventListener("mousemove", onMove);
      win.removeEventListener("mouseup", onUp);
      node.removeEventListener("click", onClick, true);
    };
  }, [scrollRef]);
}

export function Rail({ title, icon, accent, children }: RailProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  // Flechas solo en desktop; en mobile/tablet basta el swipe/arrastre.
  const showArrows = Platform.OS === "web" && width >= 1180;

  useDragToScroll(scrollRef);

  function scrollBy(delta: number) {
    const next = Math.max(0, offsetRef.current + delta);
    scrollRef.current?.scrollTo({ x: next, animated: true });
  }

  return (
    <View style={styles.rail}>
      <View style={styles.railHead}>
        <View style={[styles.railIcon, { backgroundColor: `${accent}24` }]}>{icon}</View>
        <Text style={[styles.railTitle, { color: theme.colors.text }]}>{title}</Text>
        {showArrows ? (
          <View style={styles.railArrows}>
            <RailArrow direction="left" onPress={() => scrollBy(-340)} />
            <RailArrow direction="right" onPress={() => scrollBy(340)} />
          </View>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          offsetRef.current = event.nativeEvent.contentOffset.x;
        }}
        contentContainerStyle={styles.track}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function RailArrow({
  direction,
  onPress,
}: {
  direction: "left" | "right";
  onPress: () => void;
}) {
  const theme = useTheme();
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === "left" ? "Anterior" : "Siguiente"}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.arrow,
        hoverTransition,
        Platform.OS === "web" ? pointerStyle : null,
        {
          backgroundColor: hovered ? theme.colors.elevated : theme.colors.surface,
          borderColor: hovered ? theme.colors.secondary : theme.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon size={16} color={theme.colors.text} />
    </Pressable>
  );
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    },
  };
}

type CardProps = {
  community: CommunityWithMeta;
  onOpen: (community: CommunityWithMeta) => void;
};

export function TrendCard({ community, rank, onOpen }: CardProps & { rank: number }) {
  const theme = useTheme();
  const { hovered, handlers } = useHover();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${community.name}`}
      onPress={() => onOpen(community)}
      {...handlers}
      style={[
        styles.tcard,
        hoverTransition,
        Platform.OS === "web" ? pointerStyle : null,
        {
          backgroundColor: theme.colors.surface,
          borderColor: hovered ? theme.colors.secondary : theme.colors.border,
          transform: [{ translateY: hovered ? -3 : 0 }],
        },
      ]}
    >
      <View style={styles.tban}>
        <CommunityBanner uri={community.banner_url} name={community.name} category={community.category} />
        <View style={[styles.rank, { backgroundColor: theme.colors.featured }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={[styles.tav, { borderColor: theme.colors.surface }]}>
          <Avatar uri={community.avatar_url} label={community.name} size={40} />
        </View>
      </View>
      <View style={styles.tbody}>
        <Text style={[styles.tname, { color: theme.colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={styles.trow}>
          <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
            {formatCompactNumber(community.member_count)}
          </Text>
          <OnlineIndicator count={onlineOf(community)} compact />
        </View>
      </View>
    </Pressable>
  );
}

export function LiveCard({ community, onOpen }: CardProps) {
  const theme = useTheme();
  const { hovered, handlers } = useHover();
  const signal = buildSignals(community)[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${community.name}`}
      onPress={() => onOpen(community)}
      {...handlers}
      style={[
        styles.lcard,
        hoverTransition,
        Platform.OS === "web" ? pointerStyle : null,
        {
          backgroundColor: theme.colors.surface,
          borderColor: hovered ? theme.colors.aurora : theme.colors.border,
          transform: [{ translateY: hovered ? -3 : 0 }],
        },
      ]}
    >
      <View style={[styles.lav, { borderColor: `${theme.colors.aurora}80` }]}>
        <Avatar uri={community.avatar_url} label={community.name} size={44} />
      </View>
      <View style={styles.lbody}>
        <Text style={[styles.lname, { color: theme.colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <OnlineIndicator count={onlineOf(community)} solid />
        {signal ? <SignalChips community={community} limit={1} /> : null}
      </View>
    </Pressable>
  );
}

export function NewCard({ community, onOpen }: CardProps) {
  const theme = useTheme();
  const { hovered, handlers } = useHover();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${community.name}`}
      onPress={() => onOpen(community)}
      {...handlers}
      style={[
        styles.ncard,
        hoverTransition,
        Platform.OS === "web" ? pointerStyle : null,
        {
          backgroundColor: theme.colors.surface,
          borderColor: hovered ? theme.colors.accent : theme.colors.border,
          transform: [{ translateY: hovered ? -3 : 0 }],
        },
      ]}
    >
      <View style={styles.nban}>
        <CommunityBanner uri={community.banner_url} name={community.name} category={community.category} />
        <View style={[styles.ntag, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.ntagText}>Nueva</Text>
        </View>
      </View>
      <View style={styles.nbody}>
        <View style={styles.nrow}>
          <Avatar uri={community.avatar_url} label={community.name} size={34} />
          <View style={styles.ncopy}>
            <Text style={[styles.nname, { color: theme.colors.text }]} numberOfLines={1}>
              {community.name}
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.textFaint }]} numberOfLines={1}>
              {community.category ?? "General"}
            </Text>
          </View>
        </View>
        <OnlineIndicator count={onlineOf(community)} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: 11,
  },
  railHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  railIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  railTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  railArrows: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    gap: 12,
    // Holgura vertical para que el lift del hover no recorte el borde superior.
    paddingVertical: 8,
    paddingRight: 4,
  },
  metaText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },

  // Trend card
  tcard: {
    width: 186,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  tban: {
    height: 96,
  },
  rank: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    color: "#0a0a14",
  },
  tav: {
    position: "absolute",
    left: 12,
    bottom: -18,
    borderRadius: radius.pill,
    borderWidth: 2,
    overflow: "hidden",
  },
  tbody: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 13,
    gap: 7,
  },
  tname: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  trow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Live card
  lcard: {
    width: 232,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  lav: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  lbody: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  lname: {
    fontSize: typography.small,
    fontWeight: "900",
  },

  // New card
  ncard: {
    width: 200,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  nban: {
    height: 78,
  },
  ntag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ntagText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#0a0a14",
  },
  nbody: {
    padding: 12,
    gap: 6,
  },
  nrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ncopy: {
    flex: 1,
    minWidth: 0,
  },
  nname: {
    fontSize: typography.small,
    fontWeight: "900",
  },
});
