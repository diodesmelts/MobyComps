import React from 'react';
import Image from '../ui/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Competition } from '@shared/schema';

interface MobileCartItemProps {
  item: any;
  competition: Competition;
  onRemove: () => void;
}

export const MobileCartItem: React.FC<MobileCartItemProps> = ({
  item,
  competition,
  onRemove
}) => {
  const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
  
  // Use competition price from cart item if available, or fall back to competition object
  const ticketPrice = item.competitionPrice || competition.ticketPrice || 4.99;
  const totalPrice = ticketPrice * ticketCount;
  
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
          {(competition.imageUrl || item.competitionImageUrl) ? (
            <img 
              src={(competition.imageUrl || item.competitionImageUrl).startsWith('/uploads') 
                ? `http://localhost:5000${competition.imageUrl || item.competitionImageUrl}` 
                : (competition.imageUrl || item.competitionImageUrl)}
              alt={competition.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to branded placeholder if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-[#002D5C]');
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="text-white text-center p-1">
                    <div class="text-xs font-bold">MOBY</div>
                    <div class="text-[8px]">COMPS</div>
                  </div>
                `;
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
        
        <div className="flex-1">
          <h3 className="font-medium text-sm text-[#002D5C] truncate max-w-[150px]">
            {competition.title}
          </h3>
          <div className="text-xs text-gray-500">
            {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <span className="font-medium text-[#002D5C] mr-4">{formatPrice(totalPrice)}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-red-500 p-0 h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
};