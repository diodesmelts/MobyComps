import { useContext } from "react";
import { CartContext } from "../contexts/cart-provider";
import type { Competition } from "../../shared/schema";
import { create } from "zustand";

// Create a separate store for cart UI state since it's not in the context
interface CartUIState {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const useCartUIStore = create<CartUIState>((set) => ({
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
}));

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
      addToCart: () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      calculateTotal: () => 0,
      refreshCart: async () => {},
    };
  }
  
  return context;
}
