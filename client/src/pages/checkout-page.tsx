import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/use-cart";
import { cartApi } from "@/lib/api";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment form component
const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const [, setLocation] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred while processing your payment.");
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again or use a different payment method.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Clear cart on successful payment
        try {
          await cartApi.clearCart();
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        } catch (clearCartError) {
          console.error("Failed to clear cart:", clearCartError);
        }
        
        // Handle successful payment here if not redirected
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // Redirect to success page
        setLocation('/payment-success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full py-6 bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147] font-medium rounded-md text-center"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay Now
          </>
        )}
      </Button>
      
      <Button 
        type="button"
        variant="outline" 
        className="w-full border-gray-300"
        onClick={() => setLocation('/cart')}
        disabled={isProcessing}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Return to Cart
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Get cart data
  const { data: cartData } = useQuery({
    queryKey: ["/api/cart"],
    select: (data: any) => data?.items || [],
  });
  
  const cartItems = cartData || [];
  
  // Create payment intent when page loads
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      setLocation("/auth?redirect=checkout");
      return;
    }
    
    // Redirect if cart is empty
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
      });
      setLocation("/cart");
      return;
    }
    
    async function createPaymentIntent() {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // Cart items are retrieved from session on server
        });
        
        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create payment intent",
          variant: "destructive",
        });
        // Redirect back to cart on error
        setLocation("/cart");
      } finally {
        setIsLoading(false);
      }
    }
    
    createPaymentIntent();
  }, [user, cartItems, setLocation, toast]);
  
  if (isLoading || !clientSecret) {
    return (
      <Layout title="Checkout" description="Complete your purchase">
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#002147]" />
            <p className="text-lg text-[#002147]">Preparing checkout...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Only show total tickets and total price in order summary
  const totalTickets = cartItems.reduce((sum: number, item: any) => {
    return sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0);
  }, 0);
  
  // Calculate total - note: this is just for display, actual amount calculated on server
  const calculateTotal = () => {
    return cartItems.reduce((sum: number, item: any) => {
      const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
      // Use the item's competition price (or 0 if not available)
      const ticketPrice = item.competitionPrice || 0;
      console.log(`Item: ${item.competitionTitle}, Count: ${ticketCount}, Price: ${ticketPrice}`);
      return sum + (ticketPrice * ticketCount);
    }, 0);
  };
  
  return (
    <Layout title="Checkout" description="Complete your purchase">
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="text-[#002147] mb-6"
          onClick={() => setLocation("/cart")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-[#002147] mb-6">Payment Details</h1>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>
                <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-[#002147]" />
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-[#002147] mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Tickets:
                </span>
                <span className="font-medium">
                  {totalTickets}
                </span>
              </div>
              
              <div className="flex justify-between font-bold text-lg">
                <span className="text-[#002147]">Total:</span>
                <span className="text-[#002147]">{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}