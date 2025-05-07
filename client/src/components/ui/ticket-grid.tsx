import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shuffle, Trash2 } from "lucide-react";
import { useTicketStatus } from "@/hooks/use-ticket-status";

interface TicketGridProps {
  competitionId: number;
  maxTickets: number;
  selectedTickets: number[];
  onSelectTicket: (ticketNumber: number) => void;
  onDeselectTicket: (ticketNumber: number) => void;
  onClearSelection: () => void;
  onConfirmSelection: () => void;
  onLuckyDip: (count: number[]) => void;
  maxSelectable: number;
  loading?: boolean;
}

// Define ticket type
interface AvailableTicket {
  number: number;
  status?: string;
}

export function TicketGrid({
  competitionId,
  maxTickets,
  selectedTickets,
  onSelectTicket,
  onDeselectTicket,
  onClearSelection,
  onConfirmSelection,
  onLuckyDip,
  maxSelectable,
  loading = false
}: TicketGridProps) {
  const { toast } = useToast();
  const [ticketsPerPage, setTicketsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const { availableTickets, isLoadingTickets } = useTicketStatus(competitionId.toString());
  const [luckyDipCount, setLuckyDipCount] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(maxTickets / ticketsPerPage);
  
  // Generate the range of tickets for the current page
  const startTicket = (currentPage - 1) * ticketsPerPage + 1;
  const endTicket = Math.min(currentPage * ticketsPerPage, maxTickets);
  const ticketsRange = Array.from({ length: endTicket - startTicket + 1 }, (_, i) => startTicket + i);
  
  // Handle window resize to adjust tickets per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setTicketsPerPage(50);
      } else if (window.innerWidth < 1024) {
        setTicketsPerPage(100);
      } else {
        setTicketsPerPage(150);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle Lucky Dip
  const handleLuckyDip = () => {
    if (selectedTickets.length + luckyDipCount > maxSelectable) {
      toast({
        title: "Selection limit reached",
        description: `You can only select ${maxSelectable} tickets in total.`,
        variant: "destructive"
      });
      return;
    }
    
    // Generate all numbers from 1 to maxTickets
    const allTickets = Array.from({ length: maxTickets }, (_, i) => i + 1);
    
    // Filter out unavailable tickets (ones that aren't in the availableTickets array)
    const availableTicketNumbers = availableTickets.map((ticket: AvailableTicket) => ticket.number);
    const availableForSelection = allTickets.filter(
      num => availableTicketNumbers.includes(num) && !selectedTickets.includes(num)
    );
    
    // Pick random available tickets
    const randomTickets: number[] = [];
    const tempAvailable = [...availableForSelection];
    
    // Select random tickets
    for (let i = 0; i < Math.min(luckyDipCount, tempAvailable.length); i++) {
      const randomIndex = Math.floor(Math.random() * tempAvailable.length);
      const selectedTicket = tempAvailable.splice(randomIndex, 1)[0];
      randomTickets.push(selectedTicket);
    }
    
    if (randomTickets.length === 0) {
      toast({
        title: "No available tickets",
        description: "There are no available tickets for Lucky Dip.",
        variant: "destructive"
      });
      return;
    }
    
    if (randomTickets.length < luckyDipCount) {
      toast({
        title: "Limited availability",
        description: `Only ${randomTickets.length} tickets available for Lucky Dip.`,
        variant: "destructive"
      });
    }
    
    onLuckyDip(randomTickets);
  };
  
  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-[#002147] hover:bg-[#002147]/90 text-white"
            onClick={handleLuckyDip}
            disabled={loading || isLoadingTickets}
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Lucky Dip
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedTickets.length === 0 || loading || isLoadingTickets}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>
        
        <div className="ml-auto flex items-center text-sm text-gray-600">
          <span className="font-medium">Selected:</span>
          <span className="ml-1 px-2 py-0.5 bg-[#002147] text-white rounded-md">{selectedTickets.length}</span>
          <span className="mx-1">/</span>
          <span className="font-medium">Total:</span>
          <span className="ml-1">{maxSelectable}</span>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mb-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              &lt;
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "h-8 w-8",
                    currentPage === pageNum && "bg-[#002147]"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}
      
      {/* Ticket Grid */}
      {isLoadingTickets || loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#002147]" />
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 ticket-grid max-h-[50vh] overflow-y-auto p-1">
          {ticketsRange.map(number => {
            const isSelected = selectedTickets.includes(number);
            // Check if ticket is available based on availableTickets array from the hook
            const isAvailableTicket = availableTickets.some((ticket: AvailableTicket) => ticket.number === number);
            
            // Determine button state
            let buttonState: 'available' | 'selected' | 'purchased' = 'available';
            if (!isAvailableTicket) {
              buttonState = 'purchased'; // simplification - any unavailable ticket is treated as purchased
            } else if (isSelected) {
              buttonState = 'selected';
            }
            
            return (
              <button
                key={number}
                className={cn(
                  "h-10 w-full rounded flex items-center justify-center text-sm font-medium transition-all",
                  {
                    'border-2 border-[#8EE000] bg-[#8EE000]/10 text-[#002147]': buttonState === 'selected',
                    'border border-gray-300 hover:bg-[#8EE000]/10 hover:border-[#8EE000] text-gray-700': buttonState === 'available',
                    'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': buttonState === 'purchased',
                  }
                )}
                onClick={() => {
                  if (buttonState === 'available') {
                    if (selectedTickets.length >= maxSelectable) {
                      toast({
                        title: "Selection limit reached",
                        description: `You can only select ${maxSelectable} tickets.`,
                        variant: "destructive"
                      });
                      return;
                    }
                    onSelectTicket(number);
                  } else if (buttonState === 'selected') {
                    onDeselectTicket(number);
                  }
                }}
                disabled={buttonState === 'purchased'}
              >
                {number}
              </button>
            );
          })}
        </div>
      )}
      
      {/* Confirm Button */}
      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <Button 
          className="px-6 py-2.5 bg-[#8EE000] text-[#002147] font-medium rounded-md hover:bg-[#8EE000]/90"
          disabled={selectedTickets.length === 0 || loading || isLoadingTickets}
          onClick={onConfirmSelection}
        >
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
