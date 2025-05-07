import { useQuery } from "@tanstack/react-query";
import { Competition } from "@shared/schema";

/**
 * Special hook to load ALL competitions for the cart
 * This ensures we can match cart items with competition details
 */
export function useCartCompetitions() {
  const { data, isLoading, error } = useQuery<{
    competitions: Competition[],
    total: number,
    totalPages: number
  }>({
    queryKey: ["/api/competitions?limit=1000"], // Load all competitions
    refetchOnWindowFocus: false,
  });
  
  return {
    competitions: data?.competitions || [],
    isLoading,
    error
  };
}