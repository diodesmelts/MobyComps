import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatPrice, formatCountdown } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCompetitions } from "@/hooks/use-competitions";
import { CartItemComponent } from "@/components/ui/cart-item";
// Direct cart implementation in the header for better performance and reliability
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, Menu, LogOut, User, Settings, ShoppingCart, Clock, Loader2 } from "lucide-react";

const marketingMessages = [
  "Sign up before 20th May and get £10.00 site credit!",
  "New competitions added daily - don't miss out!",
  "Winners announced every week - will you be next?",
  "Free entry competitions every month for members!",
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const { competitions } = useCompetitions();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketingIndex, setMarketingIndex] = useState(0);
  
  // Get cart items directly
  const { data: cartData, refetch: refreshCart } = useQuery({
    queryKey: ["/api/cart"],
    select: (data: any) => data?.items || [],
  });
  
  const cartItems = cartData || [];
  
  // Rotate marketing messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketingIndex((prev) => (prev + 1) % marketingMessages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  // Get site config
  const { data: announcement } = useQuery<{value: string}>({
    queryKey: ["/api/site-config/marketing-banner"],
    enabled: false, // Disable until we implement site config
  });
  
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/competitions", label: "Competitions" },
    { href: "/how-to-play", label: "How to Play" },
    { href: "/about-us", label: "About Us" },
    { href: "/faqs", label: "FAQs" },
  ];
  
  const userNavItems = [
    { href: "/my-entries", label: "My Entries" },
    { href: "/my-wins", label: "My Wins" },
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Cart open/close handlers
  const openCart = () => {
    refreshCart();
    setIsCartOpen(true);
    document.body.style.overflow = 'hidden';
  };
  
  const closeCart = () => {
    setIsCartOpen(false);
    document.body.style.overflow = 'auto';
  };
  
  // Calculate total price for cart items
  const calculateTotal = () => {
    if (!competitions || !cartItems || cartItems.length === 0) return 0;
    
    return cartItems.reduce((total: number, item: any) => {
      const competition = competitions.find(c => c.id === item.competitionId);
      if (!competition) return total;
      
      const ticketCount = item.ticketNumbers.split(',').length;
      return total + (competition.ticketPrice * ticketCount);
    }, 0);
  };
  
  // Handle removing items from cart
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await apiRequest("DELETE", `/api/cart/remove/${cartItemId}`);
      if (!response.ok) {
        throw new Error("Failed to remove item from cart");
      }
      return cartItemId;
    },
    onSuccess: () => {
      refreshCart();
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });
  
  // Handle checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const res = await apiRequest("POST", "/api/checkout", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        closeCart();
        refreshCart();
        toast({
          title: "Checkout successful",
          description: "Your tickets have been purchased successfully."
        });
        setLocation("/my-entries");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });
  
  const handleCheckout = () => {
    if (!user) {
      closeCart();
      setLocation("/auth?redirect=cart");
      return;
    }
    
    checkoutMutation.mutate();
  };

  // Get the earliest expiry time for any cart item
  const getCartTimeRemaining = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    
    // Find the earliest expiry time
    const earliestExpiry = cartItems.reduce((earliest: number, item: any) => {
      const expiryTime = new Date(item.expiresAt).getTime();
      return expiryTime < earliest ? expiryTime : earliest;
    }, Infinity);
    
    // Calculate remaining time in seconds
    const now = new Date().getTime();
    return Math.max(0, Math.floor((earliestExpiry - now) / 1000));
  };
  
  const cartTimeRemaining = getCartTimeRemaining();
  const timeRemaining = cartTimeRemaining > 0 
    ? formatCountdown(cartTimeRemaining) 
    : "00:00";

  return (
    <header>
      {/* Marketing Banner */}
      <div className="bg-[#8EE000] py-2 px-4 text-[#002147] text-center text-sm font-medium flex justify-center items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{announcement?.value || marketingMessages[marketingIndex]}</span>
      </div>
      
      {/* Navigation */}
      <nav className="bg-[#002147] text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-2xl text-white flex items-center">
              <span className="text-white uppercase tracking-wider mr-1">MOBY</span>
              <span className="text-[#8EE000] text-sm uppercase">COMPS</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 text-sm">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded hover:bg-[#002147]/80", 
                  location === item.href && "bg-[#002147]/30 border-b-2 border-[#8EE000]"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {user && userNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded hover:bg-[#002147]/80", 
                  location === item.href && "bg-[#002147]/30 border-b-2 border-[#8EE000]"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* User Controls */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative p-2 rounded-full bg-[#002147]/50 hover:bg-[#002147]/70"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems && cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8EE000] text-[#002147] rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden md:flex items-center bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147] font-medium px-3 py-1.5 rounded-md text-sm">
                    <span className="bg-[#002147] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    {user.role === 'admin' ? 'Admin User' : user.username}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/my-entries">
                      <div className="w-full flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>My Entries</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-wins">
                      <div className="w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Wins</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <div className="w-full flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="hidden md:flex bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147]">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden p-2 rounded-md bg-[#002147]/50 hover:bg-[#002147]/70">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-[#002147] text-white">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center py-4">
                    <div className="font-bold text-xl flex items-center">
                      <span className="text-white uppercase tracking-wider mr-1">MOBY</span>
                      <span className="text-[#8EE000] text-sm uppercase">COMPS</span>
                    </div>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <div className="flex flex-col space-y-3 mt-4">
                    {navItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <Link href={item.href}>
                          <Button 
                            variant="ghost" 
                            className={cn(
                              "w-full justify-start text-lg", 
                              location === item.href && "bg-white/10 border-l-4 border-[#8EE000] pl-3"
                            )}
                          >
                            {item.label}
                          </Button>
                        </Link>
                      </SheetClose>
                    ))}
                    
                    {user && (
                      <>
                        <div className="border-t border-white/20 pt-3 mt-2" />
                        {userNavItems.map((item) => (
                          <SheetClose key={item.href} asChild>
                            <Link href={item.href}>
                              <Button 
                                variant="ghost" 
                                className={cn(
                                  "w-full justify-start text-lg", 
                                  location === item.href && "bg-white/10 border-l-4 border-[#8EE000] pl-3"
                                )}
                              >
                                {item.label}
                              </Button>
                            </Link>
                          </SheetClose>
                        ))}
                      </>
                    )}
                    
                    {user?.role === 'admin' && (
                      <>
                        <div className="border-t border-white/20 pt-3 mt-2" />
                        <SheetClose asChild>
                          <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start text-lg">
                              Admin Dashboard
                            </Button>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-auto pb-8">
                    {user ? (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          handleLogout();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/auth">
                          <Button className="w-full bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147]">
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      
      {/* Cart Sidebar - Directly in header to avoid issues */}
      {isCartOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />
          
          {/* Cart Modal */}
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-50 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeCart}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {/* Timer */}
              {cartItems && cartItems.length > 0 && (
                <div className="bg-[#8EE000]/20 p-3 flex items-center justify-center space-x-2 rounded-md mb-4 border border-[#8EE000]/30">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-1">
                      <Clock className="h-5 w-5 text-[#002147] mr-2" />
                      <span className="text-sm font-medium text-[#002147]">
                        Reservation time remaining:
                      </span>
                    </div>
                    <div className="text-xl font-bold text-[#002147] countdown-timer">
                      {timeRemaining}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Cart Items */}
              {!competitions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#002147]" />
                </div>
              ) : !cartItems || cartItems.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <Button 
                    variant="outline" 
                    className="border-[#002147] text-[#002147]"
                    onClick={closeCart}
                  >
                    Browse Competitions
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: any) => {
                    const competition = competitions?.find(c => c.id === item.competitionId);
                    if (!competition) return null;
                    
                    return (
                      <CartItemComponent
                        key={item.id}
                        item={item}
                        competition={competition}
                        onRemove={() => removeFromCartMutation.mutate(item.id)}
                        isRemoving={removeFromCartMutation.isPending}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer with checkout */}
            {cartItems && cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">
                    Subtotal ({cartItems.reduce((sum: number, item: any) => sum + (item.ticketNumbers ? item.ticketNumbers.split(',').length : 0), 0)} tickets):
                  </span>
                  <span className="font-medium text-[#002147]">{formatPrice(calculateTotal())}</span>
                </div>
                
                <Button 
                  className="w-full py-6 bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147] font-medium rounded-md text-center flex items-center justify-center"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
