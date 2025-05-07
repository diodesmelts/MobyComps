import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TicketNumberGridProps {
  availableTickets: { number: number; status: "available" | "reserved" | "sold" }[];
  selectedTickets: number[];
  onToggleTicket: (ticketNumber: number) => void;
  onLuckyDip: (count: number) => void;
  onClearSelection: () => void;
  maxSelection?: number;
}

export default function TicketNumberGrid({
  availableTickets,
  selectedTickets,
  onToggleTicket,
  onLuckyDip,
  onClearSelection,
  maxSelection = 10
}: TicketNumberGridProps) {
  const handleLuckyDip = () => {
    const count = selectedTickets.length > 0 ? selectedTickets.length : 1;
    onLuckyDip(Math.min(count, maxSelection));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button
          variant="primary"
          size="sm"
          onClick={handleLuckyDip}
        >
          <span className="mr-1">🎲</span> Lucky Dip
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={selectedTickets.length === 0}
        >
          <span className="mr-1">🧹</span> Clear Selection
        </Button>
      </div>
      
      <div className="ticket-grid">
        {availableTickets.map((ticket) => {
          const isSelected = selectedTickets.includes(ticket.number);
          const isSold = ticket.status === "sold";
          const isReserved = ticket.status === "reserved" && !isSelected;
          
          return (
            <button
              key={ticket.number}
              disabled={isSold || isReserved}
              onClick={() => onToggleTicket(ticket.number)}
              className={cn(
                "w-full aspect-square rounded flex items-center justify-center text-lg font-medium transition",
                isSelected && "border-2 border-primary bg-primary/10 text-primary",
                isSold && "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed",
                isReserved && "border border-yellow-200 bg-yellow-50 text-yellow-500 cursor-not-allowed",
                !isSelected && !isSold && !isReserved && "border border-gray-300 hover:border-primary hover:bg-primary/5"
              )}
            >
              {ticket.number}
            </button>
          );
        })}
      </div>
      
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Selected:</span> {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}
        {selectedTickets.length > 0 && (
          <span className="ml-1">
            ({selectedTickets.sort((a, b) => a - b).join(', ')})
          </span>
        )}
      </div>
    </div>
  );
}
