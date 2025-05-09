import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatPrice, formatCountdown } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCompetitions } from "@/hooks/use-competitions";
import { CartDisplay } from "@/components/ui/cart-display";
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
  const { competitions } = useCompetitions({
    limit: 100 // Get all competitions to ensure we can find matches for cart items
  });
  
  // Fetch site logo
  const { data: siteLogo } = useQuery<{key: string, value: string}>({
    queryKey: ['/api/admin/site-config/site-logo'],
    enabled: true,
  });
  
  // Create a site config object for template usage
  const siteConfig = {
    logo: siteLogo?.value || null
  };
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
      const res = await apiRequest("POST", "/api/create-payment-intent", {});
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
      <div className="bg-[#C3DC6F] py-2 text-black text-center text-xs font-semibold">
        <div className="container flex justify-center items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
          <span>{announcement?.value || marketingMessages[marketingIndex]}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="bg-[#002147] text-white shadow-md">
        <div className="container py-4 flex flex-wrap justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-2xl text-white flex items-center">
              {siteConfig?.logo ? (
                <img 
                  src={siteConfig.logo} 
                  alt="Moby Comps Logo" 
                  className="h-8 max-w-[160px] object-contain"
                />
              ) : (
                <>
                  <span className="text-white uppercase tracking-wider mr-1">MOBY</span>
                  <span className="text-[#C3DC6F] text-sm uppercase">COMPS</span>
                </>
              )}
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 text-sm">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-1 py-1 text-white/80 hover:text-[#C3DC6F] font-['Open_Sans'] font-semibold", 
                  location === item.href && "border-b-2 border-[#C3DC6F] text-white"
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
                  "px-1 py-1 text-white/80 hover:text-[#C3DC6F] font-['Open_Sans'] font-semibold", 
                  location === item.href && "border-b-2 border-[#C3DC6F] text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* User Controls */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            {cartItems && cartItems.length > 0 ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm"
                onClick={() => setLocation('/cart')}
              >
                <ShoppingCart className="h-4 w-4 text-[#002147]" />
                <span className="absolute -top-1 -right-1 bg-[#C3DC6F] text-[#002147] rounded-full w-4 h-4 text-[10px] font-semibold flex items-center justify-center shadow-sm">
                  {cartItems.length}
                </span>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm"
                onClick={openCart}
              >
                <ShoppingCart className="h-4 w-4 text-[#002147]" />
              </Button>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden md:flex items-center bg-white hover:bg-gray-100 text-[#002147] font-semibold text-xs px-2 py-1 rounded-full shadow-sm border border-gray-200">
                    <div className="bg-[#002147] text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 shadow-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="mr-1">{user.role === 'admin' ? 'Admin User' : user.username}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="hidden md:flex space-x-2">
                <Button asChild className="bg-white hover:bg-gray-100 text-[#002147] font-semibold px-4 py-1 text-xs rounded-full shadow-sm border border-gray-200">
                  <Link href="/auth">Login</Link>
                </Button>
                <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147] font-semibold px-4 py-1 text-xs rounded-full shadow-sm">
                  <Link href="/auth?register=true">Register</Link>
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm">
                  <Menu className="h-4 w-4 text-[#002147]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-[#002147] text-white">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center py-4">
                    <div className="font-bold text-xl flex items-center">
                      {siteConfig?.logo ? (
                        <img 
                          src={siteConfig.logo} 
                          alt="Moby Comps Logo" 
                          className="h-8 max-w-[120px] object-contain"
                        />
                      ) : (
                        <>
                          <span className="text-white uppercase tracking-wider mr-1">MOBY</span>
                          <span className="text-[#C3DC6F] text-sm uppercase">COMPS</span>
                        </>
                      )}
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
                              "w-full justify-start text-lg font-['Open_Sans'] font-semibold text-white/80", 
                              location === item.href && "bg-white/10 border-l-4 border-[#C3DC6F] pl-3 text-white"
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
                                  "w-full justify-start text-lg font-['Open_Sans'] font-semibold text-white/80", 
                                  location === item.href && "bg-white/10 border-l-4 border-[#C3DC6F] pl-3 text-white"
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
                            <Button variant="ghost" className="w-full justify-start text-lg font-['Open_Sans'] font-semibold text-white/80">
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
                          <Button className="w-full bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147] font-semibold rounded-full shadow-sm text-sm">
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
          <CartDisplay 
            cartItems={cartItems}
            timeRemaining={timeRemaining}
            onRemoveItem={(id) => removeFromCartMutation.mutate(id)}
            isRemoving={removeFromCartMutation.isPending}
            onCheckout={handleCheckout}
            isProcessing={isProcessing}
            onClose={closeCart}
          />
        </>
      )}
    </header>
  );
}
