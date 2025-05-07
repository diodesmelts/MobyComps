import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Trash2, 
  Timer,
  Calendar
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface CartItemProps {
  item: {
    id: string;
    competitionId: string;
    competitionTitle: string;
    imageUrl: string;
    ticketPrice: number;
    ticketNumbers: number[];
    ticketCount: number;
    totalPrice: number;
    drawDate: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeFromCart, isPendingRemove } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeFromCart(item.id);
    setIsRemoving(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Competition Image */}
          <div className="relative w-full sm:w-40 h-40">
            <img 
              src={item.imageUrl} 
              alt={item.competitionTitle} 
              className="w-full h-full object-cover"
            />
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2"
            >
              {formatCurrency(item.ticketPrice)}
            </Badge>
          </div>
          
          {/* Item Details */}
          <div className="flex-1 p-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">{item.competitionTitle}</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={handleRemove}
                    disabled={isRemoving || isPendingRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove from cart</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="text-sm text-muted-foreground flex items-center mb-2">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Draw date: {new Date(item.drawDate).toLocaleDateString()}
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {item.ticketNumbers.map(number => (
                <Badge 
                  key={number} 
                  variant="outline" 
                  className="text-xs"
                >
                  #{number}
                </Badge>
              ))}
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex items-center text-xs text-amber-600">
                <Timer className="h-3 w-3 mr-1" />
                Items reserved until checkout
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {item.ticketCount} ticket{item.ticketCount !== 1 ? 's' : ''} × {formatCurrency(item.ticketPrice)}
                </div>
                <div className="font-bold">
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
