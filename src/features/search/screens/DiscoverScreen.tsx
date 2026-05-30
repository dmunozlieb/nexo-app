import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { CommunityCard } from "../../../components/content/CommunityCard";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { TextInput } from "../../../components/ui/TextInput";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { useCommunities } from "../../communities/hooks/useCommunities";
import { CategoryChips } from "../components/CategoryChips";
import { ExploreHero } from "../components/ExploreHero";
import { ExploreRightPanel } from "../components/ExploreRightPanel";
import { SectionHeader } from "../components/SectionHeader";
import { SkeletonCommunityCard } from "../components/SkeletonCommunityCard";

const CATEGORIES = [
  "Arte",
  "Gaming",
  "Lectura",
  "Musica",
  "Cine",
  "Aprendizaje",
  "Tecnologia",
];

const stars = [
  { top: 18, left: "8%", size: 2, opacity: 0.24 },
  { top: 104, left: "62%", size: 2, opacity: 0.18 },
  { top: 248, left: "28%", size: 3, opacity: 0.14 },
  { top: 422, left: "86%", size: 2, opacity: 0.20 },
  { top: 560, left: "12%", size: 2, opacity: 0.16 },
] as const;

export function DiscoverScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const debouncedQuery = useDebouncedValue(query, 280);
  const communities = useCommunities(debouncedQuery, category);
  const data = communities.data ?? [];
  const showRightPanel = width >= 1240;
  const twoColumns = width >= 1180;
  const hasFilters = Boolean(debouncedQuery.trim() || category);
  const communityCount = data.length;
  const memberCount = useMemo(
    () => data.reduce((sum, community) => sum + community.member_count, 0),
    [data],
  );
  const onlineCount = useMemo(
    () =>
      data.reduce(
        (sum, community) =>
          sum + (community.online_count ?? Math.max(1, Math.ceil(community.member_count * 0.35))),
        0,
      ),
    [data],
  );
  const popular = useMemo(
    () => [...data].sort((a, b) => b.member_count - a.member_count),
    [data],
  );
  const mostOnline = useMemo(
    () =>
      [...data].sort(
        (a, b) => (b.online_count ?? 1) - (a.online_count ?? 1),
      ),
    [data],
  );
  const newest = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [data],
  );

  function openCommunity(community: CommunityWithMeta) {
    router.push({ pathname: "/community/[id]", params: { id: community.id } });
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {stars.map((star) => (
          <View
            key={`${star.top}-${star.left}`}
            style={[
              styles.star,
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ExploreHero
          communityCount={communityCount}
          memberCount={memberCount}
          onlineCount={onlineCount}
          selectedCategory={category}
          onCreate={() => router.push("/community/create")}
        />

        <View style={styles.layout}>
          <View style={styles.mainColumn}>
            <View
              style={[
                styles.filters,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <TextInput
                accessibilityLabel="Buscar Orbitas"
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por nombre, categoria o descripcion"
                icon={<Search size={18} color={theme.colors.textFaint} />}
              />
              <CategoryChips
                categories={CATEGORIES}
                selected={category}
                onSelect={setCategory}
              />
            </View>

            <SectionHeader
              title={hasFilters ? "Resultados encontrados" : "Orbitas recomendadas"}
              subtitle={
                hasFilters
                  ? "Senales que coinciden con tu busqueda."
                  : "Comunidades con actividad, identidad clara y espacio para conectar."
              }
              meta={`${communityCount} resultados`}
            />

            {communities.isError ? (
              <ErrorState onRetry={() => void communities.refetch()} />
            ) : communities.isLoading ? (
              <View style={styles.grid}>
                {Array.from({ length: twoColumns ? 4 : 3 }).map((_, index) => (
                  <View
                    key={index}
                    style={[styles.cardSlot, twoColumns ? styles.cardSlotTwo : null]}
                  >
                    <SkeletonCommunityCard />
                  </View>
                ))}
              </View>
            ) : data.length === 0 ? (
              <AlienEmptyState
                eyebrow={hasFilters ? "Busqueda" : "Explorar"}
                mood={hasFilters ? "curious" : "calm"}
                accessory={hasFilters ? "magnifier" : undefined}
                title={
                  hasFilters
                    ? "Nada orbita por aqui"
                    : "Todavia no hay orbitas activas"
                }
                message={
                  hasFilters
                    ? "No encontramos coincidencias. Prueba con otras palabras o crea una nueva comunidad."
                    : "Esta zona del espacio esta tranquila por ahora. Lanza la primera senal."
                }
                cta={{
                  label: "Crear Orbita",
                  onPress: () => router.push("/community/create"),
                }}
              />
            ) : (
              <View style={styles.grid}>
                {data.map((community) => (
                  <View
                    key={community.id}
                    style={[styles.cardSlot, twoColumns ? styles.cardSlotTwo : null]}
                  >
                    <CommunityCard
                      community={community}
                      onPress={() => openCommunity(community)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {showRightPanel && data.length > 0 ? (
            <ExploreRightPanel
              popular={popular}
              online={mostOnline}
              newest={newest}
              onOpenCommunity={openCommunity}
            />
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    maxWidth: 1360,
    paddingHorizontal: 18,
  },
  scroll: {
    gap: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  filters: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  cardSlot: {
    width: "100%",
  },
  cardSlotTwo: {
    flexBasis: "48.6%",
    flexGrow: 1,
  },
});
