import React from 'react';
import Image from '../ui/image';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Competition } from '@shared/schema';

interface CartItemDisplayProps {
  item: any;
  competition: Competition;
  onRemove: () => void;
  isRemoving: boolean;
}

export const CartItemDisplay: React.FC<CartItemDisplayProps> = ({
  item,
  competition,
  onRemove,
  isRemoving
}) => {
  const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
  const ticketNumbers = item.ticketNumbers ? item.ticketNumbers.split(',').map(Number) : [];
  const totalPrice = competition.ticketPrice * ticketCount;
  
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
        {competition.imageUrl ? (
          <Image
            src={competition.imageUrl}
            alt={competition.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
      </div>
      
      <div className="flex-grow">
        <div className="flex justify-between mb-1">
          <h3 className="font-semibold text-[#002D5C] truncate">
            {competition.title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 -mt-1 -mr-1"
            onClick={onRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span className="sr-only">Remove</span>
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          <span>
            {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} at {formatPrice(competition.ticketPrice)} each
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {ticketNumbers.slice(0, 5).map((number: number, index: number) => (
            <span
              key={index}
              className="text-xs bg-[#C3DC6F]/20 text-[#002D5C] px-2 py-1 rounded font-medium"
            >
              #{number}
            </span>
          ))}
          {ticketNumbers.length > 5 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium">
              +{ticketNumbers.length - 5} more
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-[#002D5C]">Total:</span>
          <span className="font-bold text-[#002D5C]">{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
};