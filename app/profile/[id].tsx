import { useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "../../src/features/profile/screens/ProfileScreen";

export default function ProfileByIdRoute() {
  const { id, communityId } = useLocalSearchParams<{
    id: string;
    communityId?: string;
  }>();
  return <ProfileScreen profileId={id} communityId={communityId} />;
}
