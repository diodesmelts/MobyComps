import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TicketGrid } from "@/components/ui/ticket-grid";
import { formatCountdown } from "@/lib/utils";
import { X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: number;
  maxTickets: number;
  ticketCount: number;
}

export function TicketModal({
  isOpen,
  onClose,
  competitionId,
  maxTickets,
  ticketCount
}: TicketModalProps) {
  const { toast } = useToast();
  const { addToCart, cartTimeRemaining } = useCart();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [reservationTime, setReservationTime] = useState<number | null>(null);
  
  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTickets([]);
    }
  }, [isOpen]);
  
  // Reserve tickets mutation
  const reserveTicketsMutation = useMutation({
    mutationFn: async (ticketNumbers: number[]) => {
      const response = await apiRequest("POST", `/api/competitions/${competitionId}/reserve-tickets`, {
        ticketNumbers
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.tickets && data.tickets.length > 0) {
        // Add tickets to cart
        addToCart(competitionId, selectedTickets);
        toast({
          title: "Tickets added to cart",
          description: `${selectedTickets.length} tickets have been added to your cart.`
        });
        onClose();
      } else {
        toast({
          title: "No tickets available",
          description: "The selected tickets are no longer available. Please try different ones.",
          variant: "destructive"
        });
        // Reset selection
        setSelectedTickets([]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reserve tickets",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle ticket selection
  const handleSelectTicket = (ticketNumber: number) => {
    if (selectedTickets.length < ticketCount) {
      setSelectedTickets([...selectedTickets, ticketNumber]);
    } else {
      toast({
        title: "Selection limit reached",
        description: `You can only select ${ticketCount} tickets.`,
        variant: "destructive"
      });
    }
  };
  
  // Handle ticket deselection
  const handleDeselectTicket = (ticketNumber: number) => {
    setSelectedTickets(selectedTickets.filter(t => t !== ticketNumber));
  };
  
  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedTickets([]);
  };
  
  // Handle lucky dip
  const handleLuckyDip = (tickets: number[]) => {
    setSelectedTickets(tickets);
  };
  
  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (selectedTickets.length !== ticketCount) {
      toast({
        title: "Selection incomplete",
        description: `Please select exactly ${ticketCount} tickets.`,
        variant: "destructive"
      });
      return;
    }
    
    // Reserve tickets
    reserveTicketsMutation.mutate(selectedTickets);
  };
  
  // Format remaining time
  const timeRemaining = cartTimeRemaining > 0
    ? formatCountdown(cartTimeRemaining)
    : "00:00";
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-bold">Select Your Ticket Numbers</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Timer display - only show if there are already items in cart */}
        {cartTimeRemaining > 0 && (
          <div className="bg-[#8EE000]/20 p-2 flex items-center justify-center space-x-2 rounded">
            <Clock className="h-5 w-5 text-[#002147]" />
            <span className="text-sm font-medium text-[#002147] countdown-pulse">
              Your selected tickets are reserved for {timeRemaining} minutes
            </span>
          </div>
        )}
        
        {/* Ticket Grid */}
        <TicketGrid
          competitionId={competitionId}
          maxTickets={maxTickets}
          selectedTickets={selectedTickets}
          onSelectTicket={handleSelectTicket}
          onDeselectTicket={handleDeselectTicket}
          onClearSelection={handleClearSelection}
          onConfirmSelection={handleConfirmSelection}
          onLuckyDip={handleLuckyDip}
          maxSelectable={ticketCount}
          loading={reserveTicketsMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
