import { useContext } from "react";
import { CartContext } from "../contexts/cart-provider";
import type { Competition } from "../../shared/schema";

export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    console.warn("useCart must be used within a CartProvider");
    // Return a fallback with empty values to prevent runtime errors
    return {
      cartItems: [],
      isCartOpen: false,
      isRemoving: null,
      cartTimeRemaining: 0,
      openCart: () => {},
      closeCart: () => {},
      addToCart: () => Promise.resolve(),
      removeFromCart: () => Promise.resolve(),
      clearCart: () => Promise.resolve(),
      calculateTotal: (competitions?: Competition[]) => 0,
      refreshCart: () => Promise.resolve(),
    };
  }
  
  return context;
}
