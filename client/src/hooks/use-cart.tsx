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
  const { isCartOpen, openCart, closeCart } = useCartUIStore();
  
  if (!context) {
    console.warn("useCart must be used within a CartProvider");
    // Return a fallback with empty values to prevent runtime errors
    return {
      cartItems: [],
      isCartOpen,
      isRemoving: null,
      cartTimeRemaining: 0,
      openCart,
      closeCart,
      addToCart: () => Promise.resolve(),
      removeFromCart: () => Promise.resolve(),
      clearCart: () => Promise.resolve(),
      calculateTotal: (competitions?: Competition[]) => 0,
      refreshCart: () => Promise.resolve(),
    };
  }
  
  // Extract cart items from the structure we see in console logs
  const cartItems = context.cart?.items || [];
  
  // Calculate cart time remaining (dummy implementation for now)
  const cartTimeRemaining = 600; // 10 minutes in seconds
  
  // Function to calculate total price
  const calculateTotal = (competitions?: Competition[]) => {
    if (!competitions || competitions.length === 0) return 0;
    
    return cartItems.reduce((total, item) => {
      const competition = competitions.find(c => c.id === item.competitionId);
      if (!competition) return total;
      
      const ticketCount = item.ticketNumbers.split(',').length;
      return total + (competition.ticketPrice * ticketCount);
    }, 0);
  };
  
  return {
    cartItems,
    isCartOpen,
    isRemoving: context.isPendingRemove ? true : null,
    cartTimeRemaining,
    openCart,
    closeCart,
    addToCart: context.addToCart || (() => Promise.resolve()),
    removeFromCart: context.removeFromCart || (() => Promise.resolve()),
    clearCart: context.clearCart || (() => Promise.resolve()),
    calculateTotal,
    refreshCart: () => Promise.resolve(),
  };
}
