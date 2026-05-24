import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
