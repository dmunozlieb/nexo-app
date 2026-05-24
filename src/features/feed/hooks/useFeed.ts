import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedMode } from "../services/feed-service";
import { listFeed } from "../services/feed-service";

export function useFeed(mode: FeedMode, userId?: string | null) {
  return useInfiniteQuery({
    queryKey: ["feed", mode, userId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listFeed({
        mode,
        userId,
        pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}
