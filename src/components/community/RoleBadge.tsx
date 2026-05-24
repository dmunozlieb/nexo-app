import { Badge } from "../ui/Badge";
import type { CommunityRole } from "../../types/domain";
import { getRoleLabel } from "../../utils/community-permissions";

type RoleBadgeProps = {
  role?: CommunityRole | null;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const tone =
    role === "owner" || role === "admin"
      ? "primary"
      : role === "mod"
        ? "secondary"
        : role === "helper"
          ? "success"
          : "neutral";

  return <Badge label={getRoleLabel(role)} tone={tone} />;
}
