import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { paymentApi } from "@/lib/api";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
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
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

export default function CartSummary() {
  const { cart, totalItems, totalAmount, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (totalItems === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { clientSecret } = await paymentApi.createPaymentIntent(totalAmount);
      setClientSecret(clientSecret);
      setIsPaymentOpen(true);
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    clearCart();
  };

  if (totalItems === 0) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Cart Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
        <CardFooter>
          <Button disabled className="w-full">Checkout</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Cart Summary
        </CardTitle>
        <CardDescription>
          You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart?.items?.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.competitionTitle} - {item.ticketCount} ticket{item.ticketCount !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <Dialog open={isPaymentOpen && !!clientSecret} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCheckout} className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </DialogTrigger>
          {clientSecret && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Complete your purchase</DialogTitle>
                <DialogDescription>
                  Your payment is secured with Stripe
                </DialogDescription>
              </DialogHeader>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm onSuccess={handlePaymentSuccess} />
              </Elements>
            </DialogContent>
          )}
        </Dialog>
        
        <div className="text-center text-sm text-muted-foreground flex justify-center items-center">
          <CheckCircle className="h-4 w-4 mr-1" />
          Secure payment with Mastercard and Visa
        </div>
      </CardFooter>
    </Card>
  );
}
