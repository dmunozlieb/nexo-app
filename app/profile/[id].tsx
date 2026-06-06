import { Stack, useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "../../src/features/profile/screens/ProfileScreen";

export default function ProfileByIdRoute() {
  const { id, communityId } = useLocalSearchParams<{
    id: string;
    communityId?: string;
  }>();
  return (
    <>
      {/* Header flotante: la flecha atras se superpone al banner inmersivo en
          vez de una banda oscura propia. Solo en el perfil. */}
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
        }}
      />
      <ProfileScreen profileId={id} communityId={communityId} />
    </>
  );
}
