import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Competition, InsertCompetition } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAdminUsers(page = 1, limit = 10) {
  const { data, isLoading, error } = useQuery<{ users: User[], total: number }>({
    queryKey: [`/api/admin/users?page=${page}&limit=${limit}`],
  });
  
  return {
    users: data?.users || [],
    totalUsers: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    isLoading,
    error
  };
}

export function useAdminCompetitions(page = 1, limit = 10, status?: string) {
  let queryString = `/api/admin/competitions?page=${page}&limit=${limit}`;
  if (status) {
    queryString += `&status=${status}`;
  }
  
  const { data, isLoading, error } = useQuery<{ 
    competitions: Competition[], 
    total: number 
  }>({
    queryKey: [queryString],
  });
  
  return {
    competitions: data?.competitions || [],
    totalCompetitions: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    isLoading,
    error
  };
}

export function useAdminCompetitionMutations() {
  const { toast } = useToast();
  
  const createCompetition = useMutation({
    mutationFn: async (competition: InsertCompetition) => {
      const res = await apiRequest("POST", "/api/admin/competitions", competition);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Competition created",
        description: "The competition has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating competition",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateCompetition = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Competition> }) => {
      const res = await apiRequest("PATCH", `/api/admin/competitions/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${variables.id}`] });
      toast({
        title: "Competition updated",
        description: "The competition has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating competition",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const deleteCompetition = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/competitions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Competition deleted",
        description: "The competition has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting competition",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  return {
    createCompetition,
    updateCompetition,
    deleteCompetition
  };
}

export function useAdminSiteConfig() {
  const { toast } = useToast();
  
  const getConfig = (key: string) => {
    return useQuery<{ key: string, value: string }>({
      queryKey: [`/api/admin/site-config/${key}`],
    });
  };
  
  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const res = await apiRequest("POST", `/api/admin/site-config/${key}`, { value });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/site-config/${variables.key}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/site-config/${variables.key}`] });
      toast({
        title: "Configuration updated",
        description: "The site configuration has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  return {
    getConfig,
    updateConfig
  };
}

export function useAdminStats() {
  return useQuery<{
    totalUsers: number;
    totalCompetitions: number;
    activeCompetitions: number;
    completedCompetitions: number;
    totalTicketsSold: number;
    recentUsers: User[];
    recentCompetitions: Competition[];
    salesData: { date: string; amount: number }[];
  }>({
    queryKey: ["/api/admin/stats"],
  });
}
