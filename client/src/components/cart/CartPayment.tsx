import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { paymentApi } from "@/lib/api";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/my-entries",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment successful",
          description: "Thank you for your purchase!",
        });
        onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
      </div>
      
      <div className="text-center text-sm text-muted-foreground flex justify-center items-center mt-4">
        <ShieldCheck className="h-4 w-4 mr-1" />
        Secure payment with Stripe
      </div>
    </form>
  );
}

export default function CartPayment() {
  const { cart, totalItems, totalAmount, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initializePayment = async () => {
    if (totalItems === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Initializing payment...");
      const { clientSecret } = await paymentApi.createPaymentIntent();
      setClientSecret(clientSecret);
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setError(err?.message || "Failed to initialize payment. Please try again.");
      toast({
        title: "Checkout failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    window.location.href = "/my-entries";
  };

  const handleCancel = () => {
    setClientSecret(null);
  };

  // If payment not yet initialized, show initialization UI
  if (!clientSecret) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Checkout
          </CardTitle>
          <CardDescription>
            Complete your purchase securely with Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-medium mb-2">Order Summary</h3>
              
              {cart?.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.competitionTitle} - {item.ticketCount} ticket{item.ticketCount !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
              
              <Separator className="my-3" />
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row w-full">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Button>
            
            <Button 
              onClick={initializePayment} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Initializing..." : "Proceed to Payment"}
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground flex justify-center items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Secure payment with Mastercard and Visa
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Once clientSecret is available, show the payment form
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Enter your card details to complete your purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            onSuccess={handlePaymentSuccess} 
            onCancel={handleCancel}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}