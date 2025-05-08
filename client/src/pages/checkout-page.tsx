import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import CartPayment from "@/components/cart/CartPayment";
import { useCart } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { totalItems } = useCart();
  
  useEffect(() => {
    // Redirect to cart if cart is empty
    if (totalItems === 0) {
      setLocation("/cart");
    }
  }, [totalItems, setLocation]);

  if (totalItems === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
          <CartPayment />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}