import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { cartApi } from "@/lib/api";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Parse the payment_intent from the URL
  const params = new URLSearchParams(search);
  const paymentIntentId = params.get('payment_intent');
  
  useEffect(() => {
    // Process the payment on the server
    async function processPayment() {
      if (!paymentIntentId) {
        setIsProcessing(false);
        return;
      }
      
      try {
        const response = await apiRequest("POST", "/api/process-payment", {
          paymentIntentId
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to process payment");
        }
        
        const data = await response.json();
        setOrderDetails(data);
        
        // Invalidate cart queries to refresh cart count
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        toast({
          title: "Payment Successful",
          description: "Your order has been processed successfully!",
        });
      } catch (error: any) {
        toast({
          title: "Error Processing Payment",
          description: error.message || "There was an issue finalizing your order",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
    
    processPayment();
  }, [paymentIntentId, queryClient, toast]);
  
  return (
    <Layout title="Payment Successful" description="Thank you for your purchase">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-[#C3DC6F]/20 p-4 rounded-full mb-4">
              <CheckCircle className="h-16 w-16 text-[#C3DC6F]" />
            </div>
            
            <h1 className="text-3xl font-bold text-[#002147] mb-2">
              Thank You For Your Purchase!
            </h1>
            
            <p className="text-gray-600 max-w-md">
              Your payment has been processed successfully. We've reserved your tickets and registered your entries.
            </p>
          </div>
          
          {isProcessing ? (
            <div className="flex justify-center my-8">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md p-4 mb-8">
              <h2 className="font-semibold text-lg text-[#002147] mb-4">Order Details</h2>
              
              {orderDetails ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className="text-green-600">Successful</span>
                  </p>
                  <p>
                    <span className="font-medium">Tickets Purchased:</span>{" "}
                    {orderDetails.purchasedTickets?.length || 0}
                  </p>
                  <p className="text-gray-600 mt-4">
                    You can view your tickets and competitions in your account dashboard.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">
                  Your order has been completed. Check your email for confirmation details.
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-[#002147] hover:bg-[#002147]/90"
              onClick={() => setLocation("/my-entries")}
            >
              <Trophy className="h-4 w-4 mr-2" />
              View My Tickets
            </Button>
            
            <Button 
              variant="outline"
              className="border-[#002147] text-[#002147]"
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}