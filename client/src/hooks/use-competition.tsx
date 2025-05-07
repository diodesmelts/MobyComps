import { useQuery } from "@tanstack/react-query";
import { Competition } from "@shared/schema";

export function useCompetition(id: number) {
  const {
    data: competition,
    isLoading,
    error
  } = useQuery<Competition>({
    queryKey: [`/api/competitions/${id}`],
    enabled: !!id
  });
  
  return {
    competition,
    isLoading,
    error
  };
}
