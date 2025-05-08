import { createContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Competition } from "@shared/schema";

// Local storage key for cart
const CART_STORAGE_KEY = 'mobycomps-cart';

export interface CartItem {
  id: number;
  competitionId: number;
  competitionTitle?: string;
  competitionImageUrl?: string;
  ticketNumbers: string;
  expiresAt: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  isRemoving: number | null;
  cartTimeRemaining: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (competitionId: number, ticketNumbers: number[]) => void;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: (competitions?: Competition[]) => number;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType>({
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
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [cartTimeRemaining, setCartTimeRemaining] = useState(0);

  // Initial cart fetch
  useEffect(() => {
    fetchCart();
    
    // Refresh cart every minute to handle expiring items
    const interval = setInterval(() => {
      fetchCart();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Update timer for cart items
  useEffect(() => {
    if (cartItems.length === 0) {
      setCartTimeRemaining(0);
      return;
    }

    // Find earliest expiry time
    const earliestExpiry = cartItems.reduce((earliest, item) => {
      const expiryTime = new Date(item.expiresAt).getTime();
      return expiryTime < earliest ? expiryTime : earliest;
    }, Infinity);

    // Calculate time remaining
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((earliestExpiry - now) / 1000));
      setCartTimeRemaining(remaining);
      return remaining;
    };

    // Initial calculation
    const remaining = calculateTimeRemaining();
    
    // Only set up interval if there's time remaining
    if (remaining > 0) {
      const timer = setInterval(() => {
        const newRemaining = calculateTimeRemaining();
        if (newRemaining <= 0) {
          clearInterval(timer);
          fetchCart(); // Refresh cart when time expires
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [cartItems]);

  const fetchCart = async () => {
    try {
      const response = await apiRequest("GET", "/api/cart");
      const data = await response.json();
      // Initialize with empty array if items is undefined
      const items = data?.items || [];
      setCartItems(items);
      
      // Save cart to localStorage
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      
      // Try to load from localStorage if API fails
      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart.items || []);
        } else {
          setCartItems([]);
        }
      } catch (localStorageError) {
        console.error("Failed to load cart from localStorage:", localStorageError);
        setCartItems([]);
      }
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const addToCart = async (competitionId: number, ticketNumbers: number[]) => {
    try {
      const response = await apiRequest("POST", "/api/cart/add", {
        competitionId,
        ticketNumbers,
      });
      
      if (!response.ok) {
        throw new Error("Failed to add items to cart");
      }
      
      await fetchCart();
      openCart();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tickets to cart",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      setIsRemoving(cartItemId);
      const response = await apiRequest("DELETE", `/api/cart/remove/${cartItemId}`);
      
      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
      
      await fetchCart();
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const clearCart = async () => {
    try {
      const response = await apiRequest("DELETE", "/api/cart/clear");
      
      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }
      
      setCartItems([]);
      
      // Clear cart in localStorage too
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [] }));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = (competitions?: Competition[]) => {
    if (!competitions || competitions.length === 0) return 0;
    
    return cartItems.reduce((total, item) => {
      const competition = competitions.find(c => c.id === item.competitionId);
      if (!competition) return total;
      
      const ticketCount = item.ticketNumbers.split(',').length;
      return total + (competition.ticketPrice * ticketCount);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        isRemoving,
        cartTimeRemaining,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart,
        calculateTotal,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
