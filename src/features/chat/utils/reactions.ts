import type { MessageReaction } from "../../../types/domain";

export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
};

/**
 * Agrupa reacciones planas en, por mensaje, una lista de { emoji, count,
 * reacted_by_me }. Mantiene el orden de primera aparición de cada emoji.
 */
export function aggregateReactions(
  reactions: MessageReaction[],
  currentUserId: string,
): Map<string, ReactionSummary[]> {
  const byMessage = new Map<string, Map<string, ReactionSummary>>();

  for (const reaction of reactions) {
    let emojiMap = byMessage.get(reaction.message_id);
    if (!emojiMap) {
      emojiMap = new Map();
      byMessage.set(reaction.message_id, emojiMap);
    }
    const existing = emojiMap.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      if (reaction.user_id === currentUserId) existing.reacted_by_me = true;
    } else {
      emojiMap.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reacted_by_me: reaction.user_id === currentUserId,
      });
    }
  }

  const result = new Map<string, ReactionSummary[]>();
  for (const [messageId, emojiMap] of byMessage) {
    result.set(messageId, Array.from(emojiMap.values()));
  }
  return result;
}
