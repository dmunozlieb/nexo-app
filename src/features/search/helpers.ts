import type { CommunityWithMeta } from "../../types/domain";

/** Presencia aproximada: usa online_count real o estima desde miembros. */
export function onlineOf(community: CommunityWithMeta): number {
  return community.online_count ?? Math.max(1, Math.ceil(community.member_count * 0.35));
}

/** Dias transcurridos desde una fecha ISO. */
export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}
