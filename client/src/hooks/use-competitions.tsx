import { useQuery } from "@tanstack/react-query";
import { Competition } from "@shared/schema";
import { useState, useEffect } from "react";

interface UseCompetitionsProps {
  featured?: boolean;
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export function useCompetitions({
  featured,
  category,
  page = 1,
  limit = 10,
  search
}: UseCompetitionsProps = {}) {
  const [queryString, setQueryString] = useState<string>("");
  
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (featured !== undefined) {
      params.append("featured", featured.toString());
    }
    
    if (category) {
      params.append("category", category);
    }
    
    if (page) {
      params.append("page", page.toString());
    }
    
    if (limit) {
      params.append("limit", limit.toString());
    }
    
    if (search) {
      params.append("search", search);
    }
    
    const newQueryString = params.toString();
    setQueryString(newQueryString ? `?${newQueryString}` : "");
  }, [featured, category, page, limit, search]);
  
  const {
    data,
    isLoading,
    error
  } = useQuery<{
    competitions: Competition[],
    total: number,
    totalPages: number
  }>({
    queryKey: [`/api/competitions${queryString}`],
    enabled: !!queryString || queryString === "",
  });
  
  return {
    competitions: data?.competitions || [],
    totalCompetitions: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error
  };
}
