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
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
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
    <div className="flex flex-col pb-4 border-b border-gray-200">
      {/* Competition title and image row */}
      <div className="flex items-start space-x-3 mb-2">
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden">
          <img 
            src={competition.imageUrl} 
            alt={competition.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-[#002147] text-sm md:text-base">{competition.title}</h4>
            <Badge 
              variant="outline" 
              className={`uppercase text-xs ${getStatusColor(competition.status)}`}
            >
              {competition.status}
            </Badge>
          </div>
          
          {/* Competition details */}
          <div className="flex flex-col space-y-1 mt-1">
            <div className="flex items-center text-xs text-gray-500">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>Draw: {formatDrawDate(competition.drawDate)}</span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Tag className="h-3 w-3 mr-1" />
              <span>{competition.ticketsSold} / {competition.maxTickets} tickets sold</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ticket numbers section */}
      <div className="bg-gray-50 p-2 rounded-md my-2">
        <div className="text-xs text-gray-600 mb-1">Your Tickets:</div>
        <div className="flex flex-wrap gap-1">
          {ticketNumbers.map((number) => (
            <Badge key={number} variant="outline" className="bg-[#002147] text-white">
              #{number}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Price and remove row */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center">
          <div className="text-sm">
            <span className="font-medium">{formatPrice(competition.ticketPrice)}</span> × {ticketNumbers.length}
            <span className="font-bold ml-2">{formatPrice(totalCost)}</span>
          </div>
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
  );
}
