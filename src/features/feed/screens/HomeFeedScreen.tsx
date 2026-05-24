import { useMemo } from "react";
import { Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import { GalaxyOrbitMap } from "../../../components/community/GalaxyOrbitMap";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import type { CommunityWithMeta } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCommunityConversationMutation } from "../../chat/hooks/useChat";
import {
  useCommunities,
  useJoinedCommunities,
} from "../../communities/hooks/useCommunities";

export function HomeFeedScreen() {
  const auth = useAuth();
  const communities = useCommunities();
  const joinedCommunities = useJoinedCommunities(auth.session?.user.id);
  const chat = useCommunityConversationMutation();
  const galaxyCommunities = useMemo(
    () => buildHomeGalaxy(communities.data ?? [], joinedCommunities.data ?? []),
    [communities.data, joinedCommunities.data],
  );

  async function handleOpenChat(community: CommunityWithMeta) {
    try {
      if (!community.user_role) {
        return;
      }

      const conversationId = await chat.mutateAsync(community.id);
      router.push({ pathname: "/chat/[id]", params: { id: conversationId } });
    } catch (error) {
      Alert.alert("No se pudo abrir el chat", getErrorMessage(error));
    }
  }

  if (communities.isError) {
    return (
      <ErrorState
        title="La galaxia no respondio"
        message="Puede que falte configurar Supabase o que no tengas conexion."
        onRetry={() => void communities.refetch()}
      />
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <GalaxyOrbitMap
        fullScreen
        communities={galaxyCommunities}
        loading={communities.isLoading || joinedCommunities.isLoading}
        onCreateCommunity={() => router.push("/community/create")}
        onOpenChat={handleOpenChat}
        onOpenCommunity={(community) =>
          router.push({
            pathname: "/community/[id]",
            params: { id: community.id },
          })
        }
      />
    </ScreenContainer>
  );
}

function buildHomeGalaxy(
  allCommunities: CommunityWithMeta[],
  joinedCommunities: CommunityWithMeta[],
) {
  const allById = new Map(
    allCommunities.map((community) => [community.id, community]),
  );
  const used = new Set<string>();
  const curated: CommunityWithMeta[] = [];

  for (const joined of joinedCommunities) {
    const full = allById.get(joined.id);
    const community: CommunityWithMeta = {
      ...(full ?? joined),
      user_role: joined.user_role ?? full?.user_role ?? "member",
      member_count:
        joined.member_count > 0
          ? joined.member_count
          : (full?.member_count ?? joined.member_count),
    };
    const onlineCount = joined.online_count ?? full?.online_count;

    if (onlineCount !== undefined) {
      community.online_count = onlineCount;
    }

    curated.push(community);
    used.add(joined.id);
  }

  const recommended = allCommunities
    .filter((community) => !used.has(community.id))
    .sort((a, b) => {
      const scoreA = (a.online_count ?? 0) * 3 + a.member_count;
      const scoreB = (b.online_count ?? 0) * 3 + b.member_count;
      return scoreB - scoreA;
    });

  return [...curated, ...recommended];
}

const styles = StyleSheet.create({
  screen: {
    maxWidth: "100%",
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
});
