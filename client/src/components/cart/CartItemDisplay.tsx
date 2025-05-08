import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Competition } from "@shared/schema";

interface CartItemDisplayProps {
  item: any;
  competition: Competition;
  onRemove: () => void;
  isRemoving: boolean;
}

export function CartItemDisplay({
  item,
  competition,
  onRemove,
  isRemoving
}: CartItemDisplayProps) {
  if (!competition) {
    return null;
  }
  
  const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
  const ticketPrice = competition.ticketPrice || 0;
  const total = ticketCount * ticketPrice;
  
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Competition Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
        {competition.imageUrl ? (
          <img 
            src={competition.imageUrl} 
            alt={competition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
      </div>
      
      {/* Competition and Ticket Details */}
      <div className="flex-grow space-y-2">
        <div className="flex justify-between items-start">
          <Link to={`/competition/${competition.id}`}>
            <span className="text-lg font-medium text-[#002D5C] hover:underline cursor-pointer">
              {competition.title}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onRemove}
            disabled={isRemoving}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} × {formatPrice(ticketPrice)}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm bg-[#002D5C]/10 text-[#002D5C] px-2 py-1 rounded">
            Tickets: {item.ticketNumbers}
          </div>
          <div className="font-medium text-[#002D5C]">
            {formatPrice(total)}
          </div>
        </div>
      </div>
    </div>
  );
}