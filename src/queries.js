// Shared reads of the two API lists. React Query keeps the result and
// refreshes it when we invalidate the key after a save.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson } from "./api.js";

export function useCigarettes() {
  return useQuery({
    queryKey: ["cigarettes"],
    queryFn: () => getJson("/api/cigarettes"),
  });
}

export function useDailyGoals() {
  return useQuery({
    queryKey: ["daily-goal"],
    queryFn: () => getJson("/api/settings/daily-goal"),
  });
}

export function usePacks() {
  return useQuery({
    queryKey: ["packs"],
    queryFn: () => getJson("/api/packs"),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => getJson("/api/brands"),
  });
}

export function useRefresh() {
  const client = useQueryClient();
  return {
    cigarettes() {
      return Promise.all([
        client.invalidateQueries({ queryKey: ["cigarettes"] }),
        client.invalidateQueries({ queryKey: ["packs"] }),
      ]);
    },
    packs() {
      return client.invalidateQueries({ queryKey: ["packs"] });
    },
    brands() {
      return client.invalidateQueries({ queryKey: ["brands"] });
    },
    // Show a row we just saved before the refetch comes back, so the
    // history page can open that row's day immediately.
    putCigarette(record) {
      client.setQueryData(["cigarettes"], (current = []) => {
        const index = current.findIndex((item) => item.id === record.id);
        if (index === -1) return [...current, record];
        const next = current.slice();
        next[index] = record;
        return next;
      });
    },
    goals() {
      return client.invalidateQueries({ queryKey: ["daily-goal"] });
    },
  };
}
