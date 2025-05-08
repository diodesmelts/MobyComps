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
  
  // Process competitions to ensure ID is numeric for proper comparison in cart
  const processedCompetitions = data?.competitions?.map(comp => ({
    ...comp,
    id: typeof comp.id === 'string' ? parseInt(comp.id) : comp.id
  })) || [];
  
  // Log what competitions we have
  console.log("Available competitions for cart:", processedCompetitions);
  
  return {
    competitions: processedCompetitions,
    isLoading,
    error
  };
}