import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Compass, Plus, Radio, Search, Sparkles, Users } from "lucide-react-native";
import { CommunityCard } from "../../../components/content/CommunityCard";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TagPill } from "../../../components/ui/TagPill";
import { TextInput } from "../../../components/ui/TextInput";
import { Button } from "../../../components/ui/Button";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { useCommunities } from "../../communities/hooks/useCommunities";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const debouncedQuery = useDebouncedValue(query, 280);
  const communities = useCommunities(debouncedQuery, category);
  const communityCount = communities.data?.length ?? 0;
  const memberCount = useMemo(
    () =>
      (communities.data ?? []).reduce(
        (sum, community) => sum + community.member_count,
        0,
      ),
    [communities.data],
  );

  return (
    <ScreenContainer>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Compass size={24} color="#FFFFFF" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>Explorar orbitas</Text>
            <Text style={styles.heroTitle}>Encuentra tu proximo circulo</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Comunidades con normas, moderacion y energia propia para cada tema.
        </Text>
        <View style={styles.heroAction}>
          <Button
            title="Crear Orbita"
            size="sm"
            variant="secondary"
            icon={<Plus size={16} color={theme.colors.text} />}
            style={styles.heroButton}
            onPress={() => router.push("/community/create")}
          />
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Radio size={15} color="#FFFFFF" />
            <Text style={styles.heroStatValue}>{communityCount}</Text>
            <Text style={styles.heroStatLabel}>activas</Text>
          </View>
          <View style={styles.heroStat}>
            <Users size={15} color="#FFFFFF" />
            <Text style={styles.heroStatValue}>{memberCount}</Text>
            <Text style={styles.heroStatLabel}>miembros</Text>
          </View>
          <View style={styles.heroStat}>
            <Sparkles size={15} color="#FFFFFF" />
            <Text style={styles.heroStatValue}>{category ?? "Todas"}</Text>
            <Text style={styles.heroStatLabel}>categoria</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBlock}>
        <TextInput
          accessibilityLabel="Buscar Orbitas"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, categoria o descripcion"
          icon={<Search size={18} color={theme.colors.textFaint} />}
        />
      </View>

      <View style={styles.categories}>
        <TagPill
          label="Todas"
          selected={!category}
          onPress={() => setCategory(undefined)}
        />
        {CATEGORIES.map((item) => (
          <TagPill
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Orbitas recomendadas
        </Text>
        <Text style={[styles.sectionMeta, { color: theme.colors.textFaint }]}>
          {communityCount} resultados
        </Text>
      </View>

      {communities.isLoading ? (
        <LoadingState label="Buscando Orbitas..." />
      ) : communities.isError ? (
        <ErrorState onRetry={() => void communities.refetch()} />
      ) : (
        <FlatList
          data={communities.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No encontramos Orbitas"
              message="Prueba otra busqueda o crea la primera comunidad de ese tema."
            />
          }
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              onPress={() =>
                router.push({ pathname: "/community/[id]", params: { id: item.id } })
              }
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.72,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 10,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,10,18,0.28)",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroKicker: {
    color: "rgba(255,255,255,0.76)",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: typography.h1,
    fontWeight: "900",
    lineHeight: 29,
  },
  heroText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: typography.body,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  heroAction: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  heroStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(9,10,18,0.28)",
  },
  heroStat: {
    flex: 1,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: typography.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  searchBlock: {
    paddingBottom: 12,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  sectionMeta: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  list: {
    gap: 12,
    paddingBottom: 28,
  },
});
