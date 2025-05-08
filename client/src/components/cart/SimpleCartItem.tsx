import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Competition } from '@shared/schema';

interface SimpleCartItemProps {
  item: any;
  competition: Competition;
  onRemove: () => void;
  isRemoving: boolean;
}

export const SimpleCartItem: React.FC<SimpleCartItemProps> = ({
  item,
  competition,
  onRemove,
  isRemoving
}) => {
  // Calculate ticket quantities and price
  const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
  const ticketNumbers = item.ticketNumbers ? item.ticketNumbers.split(',').map(Number) : [];
  const ticketPrice = item.competitionPrice || competition.ticketPrice || 4.99;
  const totalPrice = ticketPrice * ticketCount;
  
  // Use the utility function to get the image URL
  const imageUrl = getImageUrl(item.competitionImageUrl || competition?.imageUrl);
  
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
        {imageUrl ? (
          <img 
            src={imageUrl}
            alt={competition.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, replace with our branded placeholder
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.classList.add('bg-[#002D5C]');
                parent.innerHTML = `
                  <div class="flex items-center justify-center h-full">
                    <div class="text-white text-center p-1">
                      <div class="text-xs font-bold">MOBY</div>
                      <div class="text-[8px]">COMPS</div>
                    </div>
                  </div>
                `;
              }
            }}
          />
        ) : (
          // Fallback to branded placeholder if no image
          <div className="w-full h-full bg-[#002D5C] flex items-center justify-center">
            <div className="text-white text-center p-1">
              <div className="text-xs font-bold">MOBY</div>
              <div className="text-[8px]">COMPS</div>
            </div>
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
            {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} at {formatPrice(ticketPrice)} each
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