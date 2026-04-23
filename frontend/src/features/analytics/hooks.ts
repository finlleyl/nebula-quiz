import { useQuery } from "@tanstack/react-query";

import { getAnalyticsOverview, type AnalyticsReport } from "./api";

export function useAnalyticsReport() {
  return useQuery<AnalyticsReport>({
    queryKey: ["analytics", "overview"],
    queryFn: getAnalyticsOverview,
    refetchInterval: 15000,
  });
}
