import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useUsage() {
  return useQuery({
    queryKey: ["/api/usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/usage");
      return await res.json();
    },
  });
}
