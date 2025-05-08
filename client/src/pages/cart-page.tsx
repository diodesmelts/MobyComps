import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Loader2, ShoppingBag, ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react";
import { formatPrice, formatCountdown } from "@/lib/utils";
import { CartItemDisplay } from "@/components/cart/CartItemDisplay";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    clearCart, 
    isRemoving,
    cartTimeRemaining,
  } = useCart();
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // If cart is empty and not loading, redirect to competitions
  useEffect(() => {
    if (!isLoadingCart && cartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before checkout",
      });
      setLocation("/competitions");
    }
  }, [isLoadingCart, cartItems, setLocation, toast]);
  
  const handleCheckout = () => {
    if (!user) {
      setLocation("/auth?redirect=checkout");
      return;
    }
    
    setLocation("/checkout");
  };
  
  const calculateTotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    
    return cartItems.reduce((sum: number, item: any) => {
      const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
      const ticketPrice = item.competition?.ticketPrice || 0;
      return sum + (ticketPrice * ticketCount);
    }, 0);
  };
  
  // Format the time remaining
  const timeRemaining = cartTimeRemaining > 0
    ? formatCountdown(cartTimeRemaining)
    : "00:00";
  
  if (isLoadingCart) {
    return (
      <Layout title="Your Cart">
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#002D5C]" />
            <p className="text-lg text-[#002D5C]">Loading your cart...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!cartItems || cartItems.length === 0) {
    return (
      <Layout title="Your Cart">
        <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-6 max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
            <h1 className="text-2xl font-bold text-[#002D5C]">Your cart is empty</h1>
            <p className="text-gray-600">You haven't added any tickets to your cart yet.</p>
            <Button 
              className="mt-4 bg-[#002D5C] hover:bg-[#002D5C]/90"
              onClick={() => setLocation("/competitions")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Competitions
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Your Cart" description="Review your selected tickets and proceed to checkout">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="text-[#002D5C]"
            onClick={() => setLocation("/competitions")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#002D5C]">Your Cart</h1>
              <Button 
                variant="outline" 
                className="border-[#002D5C] text-[#002D5C]"
                onClick={() => clearCart()}
              >
                {false ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Clear Cart
              </Button>
            </div>
            
            {cartTimeRemaining > 0 && (
              <div className="bg-[#C3DC6F]/20 p-3 flex items-center space-x-2 rounded-md mb-6">
                <div className="h-4 w-4 bg-[#002D5C] rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-[#002D5C]">
                  Your tickets are reserved for {timeRemaining}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {cartItems.map((item: any) => (
                <CartItemDisplay 
                  key={item.id}
                  item={item}
                  competition={item.competition}
                  onRemove={() => removeFromCart(item.id)}
                  isRemoving={isRemoving === item.id}
                />
              ))}
            </div>
          </div>
          
          {/* Order Summary Section */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-[#002D5C] mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Tickets:
                </span>
                <span className="font-medium">
                  {cart.items.reduce((sum, item) => {
                    return sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0);
                  }, 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Competitions:
                </span>
                <span className="font-medium">
                  {cart.items.length}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span className="text-[#002D5C]">Total:</span>
                <span className="text-[#002D5C]">{formatPrice(calculateTotal())}</span>
              </div>
              
              <Button 
                className="w-full py-6 mt-4 bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C] font-medium rounded-md text-center"
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
              
              <p className="text-xs text-gray-500 text-center mt-2">
                By proceeding to checkout, you agree to our Terms and Conditions and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}