import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useTicketStatus(competitionId: number) {
  const [purchasedTickets, setPurchasedTickets] = useState<number[]>([]);
  const [reservedTickets, setReservedTickets] = useState<string[]>([]);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/competitions/${competitionId}/tickets`],
    enabled: !!competitionId,
  });
  
  useEffect(() => {
    if (data) {
      const purchased = data.tickets
        .filter((ticket: Ticket) => ticket.status === "purchased")
        .map((ticket: Ticket) => ticket.number);
      
      // For reserved tickets, we need to track who reserved them
      // If it's the current user, we'll mark them as "self:reserved"
      const reserved = data.tickets
        .filter((ticket: Ticket) => ticket.status === "reserved")
        .map((ticket: Ticket) => {
          const isSelf = ticket.sessionId === data.sessionId;
          return `${ticket.number}:${isSelf ? 'self' : 'other'}`;
        });
      
      setPurchasedTickets(purchased);
      setReservedTickets(reserved);
    }
  }, [data]);
  
  const getPurchasedTickets = () => purchasedTickets;
  
  const getReservedTickets = () => reservedTickets;
  
  const isTicketAvailable = (ticketNumber: number) => {
    return !purchasedTickets.includes(ticketNumber) && 
           !reservedTickets.some(t => t.split(':')[0] === String(ticketNumber));
  };
  
  const isTicketReservedBySelf = (ticketNumber: number) => {
    return reservedTickets.some(t => 
      t.split(':')[0] === String(ticketNumber) && t.includes('self')
    );
  };
  
  const refreshStatus = async () => {
    await refetch();
  };
  
  return {
    purchasedTickets,
    reservedTickets,
    getPurchasedTickets,
    getReservedTickets,
    isTicketAvailable,
    isTicketReservedBySelf,
    refreshStatus,
    isLoading,
    error
  };
}
