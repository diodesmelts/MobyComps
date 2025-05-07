import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartItem, Competition } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { Trash2, Loader2, Tag, CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  
  // Format draw date to readable string
  const formatDrawDate = (dateValue: string | Date) => {
    if (!dateValue) return 'TBD';
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  // Get badge color based on competition status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-md p-4 mb-4 shadow-sm border border-gray-100">
      {/* Competition title row with remove button */}
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h4 className="font-medium text-[#002D5C]">{competition.title}</h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 h-8 px-2"
          onClick={onRemove}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Ticket numbers */}
      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-2">Your selected tickets:</div>
        <div className="flex flex-wrap gap-1.5">
          {ticketNumbers.map((number) => (
            <Badge key={number} className="bg-[#002D5C] hover:bg-[#002D5C]/90 text-white">
              #{number}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Price summary */}
      <div className="flex justify-between items-center text-sm pt-2 border-t">
        <div className="text-gray-600">
          {ticketNumbers.length} {ticketNumbers.length === 1 ? 'ticket' : 'tickets'} @ {formatPrice(competition.ticketPrice)}
        </div>
        <div className="font-semibold text-[#002D5C]">
          {formatPrice(totalCost)}
        </div>
      </div>
    </div>
  );
}
