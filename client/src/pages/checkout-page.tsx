import { useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import CartPayment from "@/components/cart/CartPayment";
import { useCart } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cartItems } = useCart();
  
  useEffect(() => {
    // Redirect to cart if cart is empty
    if (cartItems.length === 0) {
      setLocation("/cart");
    }
  }, [cartItems, setLocation]);

  if (cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <Layout title="Checkout | Moby Competitions" description="Complete your purchase securely">
      <div className="bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center text-[#002D5C]">Checkout</h1>
          <CartPayment />
        </div>
      </div>
    </Layout>
  );
}