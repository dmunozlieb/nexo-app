import type { CommunityRole } from "../types/domain";

const adminRoles: CommunityRole[] = ["owner", "admin"];
const moderatorRoles: CommunityRole[] = ["owner", "admin", "mod"];
const helperRoles: CommunityRole[] = ["owner", "admin", "mod", "helper"];

export function isCommunityAdmin(role?: CommunityRole | null) {
  return Boolean(role && adminRoles.includes(role));
}

export function canEditCommunity(role?: CommunityRole | null) {
  return isCommunityAdmin(role);
}

export function canModeratePosts(role?: CommunityRole | null) {
  return Boolean(role && moderatorRoles.includes(role));
}

export function canManageRoles(role?: CommunityRole | null) {
  return isCommunityAdmin(role);
}

export function canViewModTools(role?: CommunityRole | null) {
  return Boolean(role && helperRoles.includes(role));
}

export function canRemoveMember(role?: CommunityRole | null) {
  return Boolean(role && moderatorRoles.includes(role));
}

export function getRoleLabel(role?: CommunityRole | null) {
  if (role === "owner" || role === "admin") {
    return "Admin";
  }

  if (role === "mod") {
    return "Moderador";
  }

  if (role === "helper") {
    return "Ayudante";
  }

  return "Miembro";
}
