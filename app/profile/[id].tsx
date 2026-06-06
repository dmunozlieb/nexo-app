import { useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "../../src/features/profile/screens/ProfileScreen";

const DESKTOP_WIDTH = 980;

export default function ProfileByIdRoute() {
  const { id, communityId } = useLocalSearchParams<{
    id: string;
    communityId?: string;
  }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_WIDTH;

  return (
    <>
      {/* En movil/tablet basta el bottom-nav: ocultamos la flecha. En desktop la
          mostramos flotante (se superpone al banner inmersivo, sin banda oscura). */}
      <Stack.Screen
        options={{
          headerShown: isDesktop,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
        }}
      />
      <ProfileScreen profileId={id} communityId={communityId} />
    </>
  );
}
