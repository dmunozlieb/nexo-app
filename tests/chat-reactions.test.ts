/// <reference types="jest" />

import { aggregateReactions } from "../src/features/chat/utils/reactions";
import type { MessageReaction } from "../src/types/domain";

const r = (
  message_id: string,
  user_id: string,
  emoji: string,
): MessageReaction => ({
  message_id,
  user_id,
  emoji,
  created_at: "2026-06-06T00:00:00.000Z",
});

describe("aggregateReactions", () => {
  it("agrupa por mensaje y emoji con conteo", () => {
    const map = aggregateReactions(
      [r("m1", "u1", "✨"), r("m1", "u2", "✨"), r("m1", "u1", "🚀")],
      "u3",
    );
    const m1 = map.get("m1")!;
    expect(m1).toEqual([
      { emoji: "✨", count: 2, reacted_by_me: false },
      { emoji: "🚀", count: 1, reacted_by_me: false },
    ]);
  });

  it("marca reacted_by_me cuando el usuario actual reaccionó", () => {
    const map = aggregateReactions([r("m1", "u1", "✨")], "u1");
    expect(map.get("m1")![0]!.reacted_by_me).toBe(true);
  });

  it("devuelve un map vacío sin reacciones", () => {
    expect(aggregateReactions([], "u1").size).toBe(0);
  });
});
