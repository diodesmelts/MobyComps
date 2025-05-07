import { useQuery, useMutation } from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCart() {
  const { toast } = useToast();

  // Get cart
  const { 
    data: cart, 
    isLoading: isLoadingCart,
    error: cartError
  } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: () => cartApi.getCart(),
  });

  // Add to cart
  const addToCartMutation = useMutation({
    mutationFn: ({ competitionId, ticketNumbers }: { competitionId: string, ticketNumbers: number[] }) => 
      cartApi.addToCart(competitionId, ticketNumbers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Tickets have been added to your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from cart
  const removeFromCartMutation = useMutation({
    mutationFn: (cartItemId: string) => 
      cartApi.removeFromCart(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Removed from cart",
        description: "Item removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove from cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate total
  const totalItems = cart?.items?.length || 0;
  const totalAmount = cart?.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;

  return {
    cart,
    isLoadingCart,
    cartError,
    totalItems,
    totalAmount,
    addToCart: (competitionId: string, ticketNumbers: number[]) => 
      addToCartMutation.mutate({ competitionId, ticketNumbers }),
    removeFromCart: (cartItemId: string) => 
      removeFromCartMutation.mutate(cartItemId),
    clearCart: () => clearCartMutation.mutate(),
    isPendingAdd: addToCartMutation.isPending,
    isPendingRemove: removeFromCartMutation.isPending,
    isPendingClear: clearCartMutation.isPending,
  };
}
