import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TicketNumberSelectorProps {
  ticketPrice: number;
  maxTickets: number;
  onChange: (count: number) => void;
  defaultValue?: number;
}

export function TicketNumberSelector({
  ticketPrice,
  maxTickets,
  onChange,
  defaultValue = 1
}: TicketNumberSelectorProps) {
  const [count, setCount] = useState(defaultValue);
  
  // Update count on defaultValue change
  useEffect(() => {
    setCount(defaultValue);
  }, [defaultValue]);
  
  // Update parent component when count changes
  useEffect(() => {
    onChange(count);
  }, [count, onChange]);
  
  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };
  
  const incrementCount = () => {
    if (count < maxTickets) {
      setCount(count + 1);
    }
  };
  
  return (
    <div className="bg-[#002D5C]/5 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-center text-[#002D5C]">SELECT YOUR TICKETS</h3>
      
      {/* Current Selection Display */}
      <div className="flex justify-center">
        <div className="h-10 w-10 rounded-full bg-[#002D5C] text-white flex items-center justify-center font-bold text-lg">
          {count}
        </div>
      </div>
      
      {/* Number Control */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          onClick={decrementCount}
          disabled={count <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm text-gray-600">
          Number of tickets: {count} ({formatPrice(count * ticketPrice)})
        </span>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          onClick={incrementCount}
          disabled={count >= maxTickets}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
