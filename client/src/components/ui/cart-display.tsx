import { formatPrice, formatCountdown } from "@/lib/utils";
import { useCartCompetitions } from "@/hooks/use-cart-competitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Competition } from "@shared/schema";
import { 
  Loader2, 
  ShoppingCart, 
  Clock, 
  X,
  Trash2 
} from "lucide-react";

interface CartDisplayProps {
  cartItems: any[];
  timeRemaining: string;
  onRemoveItem: (id: number) => void;
  isRemoving: boolean;
  onCheckout: () => void;
  isProcessing: boolean;
  onClose: () => void;
}

// Helper function to convert string dates to Date objects safely
function safeDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function CartDisplay({
  cartItems,
  timeRemaining,
  onRemoveItem,
  isRemoving,
  onCheckout,
  isProcessing,
  onClose
}: CartDisplayProps) {
  const { competitions, isLoading } = useCartCompetitions();

  // Calculate total price for cart items
  const calculateTotal = () => {
    if (!competitions || !cartItems || cartItems.length === 0) return 0;
    
    return cartItems.reduce((total: number, item: any) => {
      const competition = competitions.find(c => c.id === item.competitionId);
      if (!competition) return total;
      
      const ticketCount = item.ticketNumbers.split(',').length;
      return total + (competition.ticketPrice * ticketCount);
    }, 0);
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-50 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#002147]">Your Cart</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Timer */}
        {cartItems && cartItems.length > 0 && (
          <div className="bg-[#F6FFDD] p-4 flex flex-col items-center justify-center rounded-md mb-6">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-[#002147] mr-2" />
              <span className="text-sm font-medium text-[#002147]">
                Reservation time remaining:
              </span>
            </div>
            <div className="bg-[#002147] text-white font-bold text-2xl py-2 px-6 rounded-md mb-1">
              {timeRemaining}
            </div>
            <p className="text-xs text-[#002147]/70 mt-1">
              Tickets will be released if checkout is not completed in time
            </p>
          </div>
        )}
        
        {/* Cart Items */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#002147]" />
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
            <p className="text-gray-500">Your cart is empty</p>
            <Button 
              variant="outline" 
              className="border-[#002147] text-[#002147]"
              onClick={onClose}
            >
              Browse Competitions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item: any) => {
              // Find competition in the list
              let competition = competitions?.find(c => c.id === item.competitionId);
              
              // If competition isn't found, create a placeholder with proper ID/title
              if (!competition) {
                console.log(`Competition ID ${item.competitionId} not found in global list. Creating placeholder.`);
                
                // Create a safely typed placeholder
                const now = new Date();
                competition = {
                  id: item.competitionId,
                  title: `Competition #${item.competitionId}`,
                  imageUrl: "",
                  ticketPrice: 1.99,
                  description: "",
                  maxTickets: 100,
                  ticketsSold: 0,
                  drawDate: safeDate(now.toISOString()),
                  closeDate: null,
                  status: "live" as any,
                  category: "electronics" as any,
                  featured: false,
                  cashAlternative: null,
                  quizQuestion: "",
                  quizAnswer: "",
                  createdAt: safeDate(now.toISOString()),
                  updatedAt: safeDate(now.toISOString()),
                  createdBy: 1
                };
                
                // Fetch the competition data for next render
                fetch(`/api/competitions/${item.competitionId}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data && data.title) {
                      console.log(`Retrieved competition data for ID ${item.competitionId}:`, data);
                      // We would ideally update our component state here
                      // In a real app, we'd use React Query's cache
                    }
                  });
              }
              
              const ticketNumbers = item.ticketNumbers.split(',').map(Number);
              const totalCost = ticketNumbers.length * competition.ticketPrice;
              
              return (
                <div key={item.id} className="border-b pb-4 mb-4">
                  {/* Competition title row with remove button */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      {/* Competition image */}
                      <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {competition.imageUrl ? (
                          <img 
                            src={competition.imageUrl} 
                            alt={competition.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
                            <ShoppingCart className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Competition title */}
                      <h4 className="font-medium text-[#002147] line-clamp-2">
                        {competition.title}
                      </h4>
                    </div>
                    
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-8 px-2 ml-2 flex-shrink-0"
                      onClick={() => onRemoveItem(item.id)}
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
                      {ticketNumbers.map((number: number) => (
                        <Badge key={number} className="bg-[#002147] hover:bg-[#002147]/90 text-white rounded-full py-1 px-3">
                          #{number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price summary */}
                  <div className="flex justify-between items-center text-sm pt-2">
                    <div className="text-gray-600">
                      {ticketNumbers.length} {ticketNumbers.length === 1 ? 'ticket' : 'tickets'} @ {formatPrice(competition.ticketPrice)}
                    </div>
                    <div className="font-semibold text-[#002147]">
                      {formatPrice(totalCost)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with checkout */}
      {cartItems && cartItems.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#002147] font-medium">
              Subtotal ({cartItems.reduce((sum: number, item: any) => sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0), 0)} tickets):
            </span>
            <span className="font-bold text-[#002147] text-lg">{formatPrice(calculateTotal())}</span>
          </div>
          
          <Button 
            className="w-full py-3 bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147] font-medium rounded-md text-center flex items-center justify-center"
            onClick={onCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Proceed to Checkout
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}