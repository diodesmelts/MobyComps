import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Loader2, ShoppingBag, ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react";
import { formatPrice, formatCountdown } from "@/lib/utils";
import { CartItemDisplay } from "../components/cart/CartItemDisplay";
import { SimpleCartItem } from "../components/cart/SimpleCartItem";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const queryClient = useQueryClient();
  
  // Get cart data directly from API using React Query for consistency with header
  const { data: cartData, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    select: (data: any) => data?.items || [],
  });
  
  const cartItems = cartData || [];
  
  // Calculate time remaining based on the earliest expiration time in the cart
  const [cartTimeRemaining, setCartTimeRemaining] = useState<number>(0);
  
  // Update the timer every second
  useEffect(() => {
    if (!cartItems.length) return;
    
    const calculateTimeRemaining = () => {
      // Find earliest expiration time from cart items
      const earliestExpiry = cartItems.reduce((earliest: Date | null, item: any) => {
        if (!item.expiresAt) return earliest;
        const expiryDate = new Date(item.expiresAt);
        return !earliest || expiryDate < earliest ? expiryDate : earliest;
      }, null);
      
      if (!earliestExpiry) return 0;
      
      // Calculate seconds between now and expiry
      const now = new Date();
      const diffMs = earliestExpiry.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    };
    
    // Initial calculation
    setCartTimeRemaining(calculateTimeRemaining());
    
    // Set up interval to update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setCartTimeRemaining(remaining);
      
      // Clear interval when time is up
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cartItems]);
  
  // Remove from cart mutation
  const { mutate: removeFromCart, isPending: isRemoving } = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await apiRequest("DELETE", `/api/cart/remove/${cartItemId}`);
      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
      return cartItemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  });
  
  // Clear cart mutation
  const { mutate: clearCart, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/cart/clear");
      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear cart",
        variant: "destructive",
      });
    }
  });
  
  // Get ALL competitions data using React Query (including non-live ones)
  const { data: competitionsData, isLoading: isLoadingCompetitions } = useQuery({
    queryKey: ["/api/competitions", "allStatuses"],
    queryFn: async () => {
      // Explicitly request all competitions without status filtering
      const response = await fetch('/api/competitions?status=');
      if (!response.ok) {
        throw new Error('Failed to fetch competitions');
      }
      const data = await response.json();
      console.log("Fetched competitions with all statuses:", data);
      return data.competitions;
    }
  });
  
  // Use effect to check cart loading status and debug data
  useEffect(() => {
    // Set a short delay to ensure cart has loaded
    const timer = setTimeout(() => {
      setIsLoadingCart(false);
      console.log("Cart items loaded:", cartItems);
      console.log("Competition data loaded:", competitionsData);
      
      // Check if we can match competition data with cart items
      if (cartItems.length > 0 && competitionsData && competitionsData.length > 0) {
        cartItems.forEach((item: any) => {
          const comp = competitionsData.find((c: any) => c.id === item.competitionId);
          console.log(`Cart item ${item.id} competition match:`, comp ? 'Found' : 'Not found', 
                     `(looking for ID ${item.competitionId})`);
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [cartItems, competitionsData]);
  
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
      
      // First check if the cart item has price information
      if (item.competitionPrice) {
        return sum + (item.competitionPrice * ticketCount);
      }
      
      // If not, try to get competition price from our competitions data
      const competition = competitionsData?.find((c: any) => c.id === item.competitionId);
      let ticketPrice = 0;
      
      if (competition) {
        // Use price from competition data if available
        ticketPrice = competition.ticketPrice || 0;
      } else {
        // Default price if competition not found in API but we have the item
        ticketPrice = 4.99;
      }
      
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
              {cartItems.map((item: any) => {
                // Try to find competition details from competitions data
                let competition = competitionsData?.find((comp: any) => comp.id === item.competitionId);
                
                // If we can't find the competition in the API results, create a competition object
                // using the embedded data from the cart item
                if (!competition && item.competitionTitle) {
                  competition = {
                    id: item.competitionId,
                    title: item.competitionTitle,
                    imageUrl: item.competitionImageUrl,
                    ticketPrice: item.competitionPrice || 4.99, // Use price from cart item if available
                    // Add minimum required fields
                    description: "",
                    maxTickets: item.competitionMaxTickets || 0,
                    ticketsSold: item.competitionTicketsSold || 0,
                    status: item.competitionStatus || "live",
                    category: item.competitionCategory || null
                  };
                  console.log("Created competition from cart data:", competition);
                  
                  // Log the image URL for debugging
                  if (item.competitionImageUrl) {
                    console.log("Original image URL:", item.competitionImageUrl);
                    // Fix relative URLs if needed
                    if (item.competitionImageUrl.startsWith('/')) {
                      const fixedUrl = `http://localhost:5000${item.competitionImageUrl}`;
                      console.log("Fixed upload URL:", fixedUrl);
                    }
                  }
                }
                
                // Still show loading placeholder if we don't have competition data
                if (!competition) {
                  return (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="flex-grow space-y-2">
                        <div className="h-6 bg-gray-200 w-3/4 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 w-1/4 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 w-1/2 rounded animate-pulse"></div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <SimpleCartItem 
                    key={item.id}
                    item={item}
                    competition={competition}
                    onRemove={() => removeFromCart(item.id)}
                    isRemoving={isRemoving === item.id}
                  />
                );
              })}
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
                  {cartItems.reduce((sum: number, item: any) => {
                    return sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0);
                  }, 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Competitions:
                </span>
                <span className="font-medium">
                  {cartItems.length}
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