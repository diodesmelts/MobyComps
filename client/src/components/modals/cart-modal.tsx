import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useCompetitions } from "@/hooks/use-competitions";
import { useAuth } from "@/hooks/use-auth";
import { CartItemComponent } from "@/components/ui/cart-item";
import { formatPrice, formatCountdown, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, X, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function CartModal() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get cart data from our custom hook
  const { 
    cartItems, 
    isCartOpen, 
    openCart,
    closeCart, 
    removeFromCart, 
    clearCart, 
    calculateTotal,
    cartTimeRemaining,
    isRemoving
  } = useCart();
  
  const { competitions, isLoading: isLoadingCompetitions } = useCompetitions();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Set body overflow to hidden when cart is open to prevent scrolling
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [isCartOpen]);
  
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const res = await apiRequest("POST", "/api/checkout", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        closeCart();
        clearCart();
        toast({
          title: "Checkout successful",
          description: "Your tickets have been purchased successfully."
        });
        setLocation("/my-entries");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });
  
  const handleCheckout = () => {
    if (!user) {
      closeCart();
      setLocation("/auth?redirect=cart");
      return;
    }
    
    checkoutMutation.mutate();
  };
  
  // Safely calculate total, handling potential undefined/null
  const total = typeof calculateTotal === 'function' ? calculateTotal(competitions) : 0;
  
  // Get remaining time in minutes and seconds
  const timeRemaining = cartTimeRemaining > 0
    ? formatCountdown(cartTimeRemaining)
    : "00:00";
    
  // If cart is not open, don't render anything
  if (!isCartOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-50 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeCart}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Timer */}
          {cartItems && cartItems.length > 0 && (
            <div className="bg-[#8EE000]/20 p-2 flex items-center justify-center space-x-2 rounded mb-4">
              <Clock className="h-5 w-5 text-[#002147]" />
              <span className="text-sm font-medium text-[#002147] countdown-pulse">
                Your tickets are reserved for {timeRemaining}
              </span>
            </div>
          )}
          
          {/* Cart Items */}
          {isLoadingCompetitions ? (
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
                onClick={closeCart}
              >
                Browse Competitions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: any) => {
                const competition = competitions?.find(c => c.id === item.competitionId);
                if (!competition) return null;
                
                return (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    competition={competition}
                    onRemove={() => removeFromCart(item.id)}
                    isRemoving={isRemoving === item.id}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer with checkout */}
        {cartItems && cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">
                Subtotal ({cartItems.reduce((sum: number, item: any) => sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0), 0)} tickets):
              </span>
              <span className="font-medium text-[#002147]">{formatPrice(total)}</span>
            </div>
            
            <Button 
              className="w-full py-6 bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147] font-medium rounded-md text-center flex items-center justify-center"
              onClick={handleCheckout}
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
    </>
  );
}
