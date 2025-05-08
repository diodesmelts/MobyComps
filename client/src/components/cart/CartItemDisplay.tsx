import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, Image } from "lucide-react";
import { Link } from "wouter";

interface CartItemDisplayProps {
  item: any;
  competition: any;
  onRemove: () => void;
  isRemoving: boolean;
}

export function CartItemDisplay({
  item,
  competition,
  onRemove,
  isRemoving
}: CartItemDisplayProps) {
  if (!competition) return null;
  
  const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
  const ticketPrice = competition?.ticketPrice || 0;
  const total = ticketPrice * ticketCount;
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-white">
      {/* Competition Image */}
      <div className="w-full md:w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
        {competition.imageUrl ? (
          <img
            src={competition.imageUrl}
            alt={competition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Image className="h-10 w-10 text-gray-400" />
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