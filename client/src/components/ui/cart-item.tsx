import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartItem, Competition } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface CartItemProps {
  item: CartItem;
  competition: Competition;
  onRemove: () => void;
  isRemoving: boolean;
}

export function CartItemComponent({
  item,
  competition,
  onRemove,
  isRemoving
}: CartItemProps) {
  const ticketNumbers = item.ticketNumbers.split(',').map(Number);
  const totalCost = ticketNumbers.length * competition.ticketPrice;
  
  return (
    <div className="flex items-start space-x-3 pb-4 border-b border-gray-200">
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
        <img 
          src={competition.imageUrl} 
          alt={competition.title} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-[#002147]">{competition.title}</h4>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span>Ticket numbers: {ticketNumbers.join(', ')}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm">
            <span className="font-medium">{formatPrice(competition.ticketPrice)}</span> × {ticketNumbers.length}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 text-sm h-8 px-2"
            onClick={onRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
