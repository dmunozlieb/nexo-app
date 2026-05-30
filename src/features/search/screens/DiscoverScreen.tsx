import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Radio, Star, TrendingUp } from "lucide-react-native";
import { CommunityCard } from "../../../components/content/CommunityCard";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { CosmicBackground } from "../../../components/ui/CosmicBackground";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { useCommunities } from "../../communities/hooks/useCommunities";
import { CategoryChips } from "../components/CategoryChips";
import {
  LiveCard,
  NewCard,
  Rail,
  TrendCard,
} from "../components/DiscoveryRails";
import { ExploreHero } from "../components/ExploreHero";
import { FeaturedHero } from "../components/FeaturedHero";
import { PulsePanel } from "../components/PulsePanel";
import { SectionHeader } from "../components/SectionHeader";
import { SkeletonCommunityCard } from "../components/SkeletonCommunityCard";
import { buildSignals } from "../../../components/content/SignalChips";
import { daysSince, onlineOf } from "../helpers";

const CATEGORIES = [
  "Arte",
  "Gaming",
  "Lectura",
  "Musica",
  "Cine",
  "Aprendizaje",
  "Tecnologia",
];

export function DiscoverScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const debouncedQuery = useDebouncedValue(query, 280);
  const communities = useCommunities(debouncedQuery, category);
  const data = communities.data ?? [];
  const twoColumns = width >= 720;
  const showPanel = width >= 1180;
  const hasFilters = Boolean(debouncedQuery.trim() || category);
  const browseMode = !hasFilters;
  const communityCount = data.length;

  const memberCount = useMemo(
    () => data.reduce((sum, community) => sum + community.member_count, 0),
    [data],
  );
  const onlineCount = useMemo(
    () => data.reduce((sum, community) => sum + onlineOf(community), 0),
    [data],
  );
  const popular = useMemo(
    () => [...data].sort((a, b) => b.member_count - a.member_count),
    [data],
  );
  const mostOnline = useMemo(
    () => [...data].sort((a, b) => onlineOf(b) - onlineOf(a)),
    [data],
  );
  const newest = useMemo(
    () =>
      [...data]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .filter((community) => daysSince(community.created_at) <= 30),
    [data],
  );
  const featured = useMemo(() => {
    if (data.length === 0) {
      return null;
    }
    return [...data].sort(
      (a, b) =>
        onlineOf(b) + buildSignals(b).length * 120 -
        (onlineOf(a) + buildSignals(a).length * 120),
    )[0];
  }, [data]);

  function openCommunity(community: CommunityWithMeta) {
    router.push({ pathname: "/community/[id]", params: { id: community.id } });
  }

  function renderGrid(items: CommunityWithMeta[]) {
    return (
      <View style={styles.grid}>
        {items.map((community) => (
          <View
            key={community.id}
            style={[styles.cardSlot, twoColumns ? styles.cardSlotTwo : null]}
          >
            <CommunityCard community={community} onPress={() => openCommunity(community)} />
          </View>
        ))}
      </View>
    );
  }

  function renderBody() {
    if (communities.isError) {
      return <ErrorState onRetry={() => void communities.refetch()} />;
    }

    if (communities.isLoading) {
      return (
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
      );
    }

    if (data.length === 0) {
      return (
        <AlienEmptyState
          eyebrow={hasFilters ? "Busqueda" : "Explorar"}
          mood={hasFilters ? "curious" : "calm"}
          accessory={hasFilters ? "magnifier" : undefined}
          title={hasFilters ? "Nada orbita por aqui" : "Todavia no hay orbitas activas"}
          message={
            hasFilters
              ? "No encontramos coincidencias. Prueba con otras palabras o crea una nueva comunidad."
              : "Esta zona del espacio esta tranquila por ahora. Lanza la primera senal."
          }
          cta={{ label: "Crear Orbita", onPress: () => router.push("/community/create") }}
        />
      );
    }

    if (!browseMode) {
      return (
        <>
          <SectionHeader
            title="Resultados encontrados"
            subtitle="Senales que coinciden con tu busqueda."
            meta={`${communityCount} resultados`}
          />
          {renderGrid(data)}
        </>
      );
    }

    const mainColumn = (
      <>
        {featured ? <FeaturedHero community={featured} onOpen={openCommunity} /> : null}
        <Rail
          title="Tendencia ahora"
          accent={theme.colors.secondary}
          icon={<TrendingUp size={15} color={theme.colors.secondary} />}
        >
          {popular.slice(0, 8).map((community, index) => (
            <TrendCard
              key={community.id}
              community={community}
              rank={index + 1}
              onOpen={openCommunity}
            />
          ))}
        </Rail>
        <Rail
          title="Vivas ahora mismo"
          accent={theme.colors.aurora}
          icon={<Radio size={15} color={theme.colors.aurora} />}
        >
          {mostOnline.slice(0, 8).map((community) => (
            <LiveCard key={community.id} community={community} onOpen={openCommunity} />
          ))}
        </Rail>
        {newest.length > 0 ? (
          <Rail
            title="Nuevas orbitas"
            accent={theme.colors.accent}
            icon={<Star size={15} color={theme.colors.accent} />}
          >
            {newest.slice(0, 8).map((community) => (
              <NewCard key={community.id} community={community} onOpen={openCommunity} />
            ))}
          </Rail>
        ) : null}
        <SectionHeader
          title="Todas las orbitas"
          subtitle="Comunidades con actividad, identidad clara y espacio para conectar."
          meta={`${communityCount} orbitas`}
        />
        {renderGrid(data)}
      </>
    );

    if (!showPanel) {
      return mainColumn;
    }

    return (
      <View style={styles.withPanel}>
        <View style={styles.colMain}>{mainColumn}</View>
        <PulsePanel
          data={data}
          liveList={mostOnline}
          categories={CATEGORIES}
          onOpenCommunity={openCommunity}
          onSelectCategory={setCategory}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScreenContainer contentStyle={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <ExploreHero
            query={query}
            onQuery={setQuery}
            communityCount={communityCount}
            memberCount={memberCount}
            onlineCount={onlineCount}
            onCreate={() => router.push("/community/create")}
          />
          <CategoryChips
            categories={CATEGORIES}
            selected={category}
            onSelect={setCategory}
          />
          {renderBody()}
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  screen: {
    maxWidth: 1360,
    paddingHorizontal: 18,
  },
  scroll: {
    gap: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  withPanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 22,
  },
  colMain: {
    flex: 1,
    minWidth: 0,
    gap: 20,
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
