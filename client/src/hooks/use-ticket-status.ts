import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ticketApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useTicketStatus(competitionId: string) {
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [quizAnswer, setQuizAnswer] = useState<string>("");
  const [quizCorrect, setQuizCorrect] = useState<boolean>(false);
  const [reservationTimeout, setReservationTimeout] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { data: availableTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: [`/api/tickets/${competitionId}/available`],
    queryFn: () => ticketApi.getAvailableTickets(competitionId),
    staleTime: 10000, // 10 seconds
  });

  // Reserve tickets mutation
  const reserveMutation = useMutation({
    mutationFn: ({ ticketNumbers, quizAnswer }: { ticketNumbers: number[], quizAnswer: string }) => 
      ticketApi.reserveTickets(competitionId, ticketNumbers, quizAnswer),
    onSuccess: (data) => {
      setReservationTimeout(new Date(data.expiresAt));
      toast({
        title: "Tickets reserved",
        description: `You have ${Math.floor(data.timeLeftSeconds / 60)} minutes to complete your purchase.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${competitionId}/available`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reserve tickets",
        description: error.message,
        variant: "destructive",
      });
      setSelectedTickets([]);
    },
  });

  // Release tickets mutation
  const releaseMutation = useMutation({
    mutationFn: (ticketNumbers: number[]) => 
      ticketApi.releaseTickets(competitionId, ticketNumbers),
    onSuccess: () => {
      setSelectedTickets([]);
      setReservationTimeout(null);
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${competitionId}/available`] });
    },
  });

  // Handle ticket selection
  const toggleTicket = (ticketNumber: number) => {
    if (selectedTickets.includes(ticketNumber)) {
      setSelectedTickets(prev => prev.filter(t => t !== ticketNumber));
    } else {
      setSelectedTickets(prev => [...prev, ticketNumber]);
    }
  };

  // Handle ticket reservation
  const reserveTickets = () => {
    if (selectedTickets.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket number.",
        variant: "destructive",
      });
      return;
    }

    if (!quizCorrect) {
      toast({
        title: "Quiz not completed",
        description: "Please answer the quiz question correctly to proceed.",
        variant: "destructive",
      });
      return;
    }

    reserveMutation.mutate({ ticketNumbers: selectedTickets, quizAnswer });
  };

  // Handle ticket release
  const releaseTickets = () => {
    if (selectedTickets.length > 0) {
      releaseMutation.mutate(selectedTickets);
    }
  };

  // Random ticket selection (Lucky Dip)
  const selectRandomTickets = (count: number) => {
    if (availableTickets.length < count) {
      toast({
        title: "Not enough tickets",
        description: `Only ${availableTickets.length} tickets are available.`,
        variant: "destructive",
      });
      return;
    }

    const shuffled = [...availableTickets].sort(() => 0.5 - Math.random());
    setSelectedTickets(shuffled.slice(0, count).map(t => t.number));
  };

  // Clear selected tickets
  const clearSelection = () => {
    setSelectedTickets([]);
  };

  // Update quiz status
  const submitQuizAnswer = (answer: string) => {
    setQuizAnswer(answer);
    // This would normally validate against the backend
    // But for simplicity, we'll just simulate validation here
    setQuizCorrect(true);
  };

  // Timer for reservation expiration
  useEffect(() => {
    if (!reservationTimeout) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = reservationTimeout.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setReservationTimeout(null);
        releaseTickets();
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationTimeout]);

  return {
    availableTickets,
    selectedTickets,
    isLoadingTickets,
    quizCorrect,
    reservationTimeout,
    timeLeft,
    toggleTicket,
    reserveTickets,
    releaseTickets,
    selectRandomTickets,
    clearSelection,
    submitQuizAnswer,
    isPendingReservation: reserveMutation.isPending,
  };
}
