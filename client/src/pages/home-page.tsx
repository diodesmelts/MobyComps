import { Link } from "wouter";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/ui/competition-card";
import { WebSocketStatus } from "@/components/websocket-status";
import { useCompetitions } from "@/hooks/use-competitions";
import { Loader2, ArrowRight, Filter, Ticket, CalendarDays, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import paymentCardsImage from "../assets/payment-cards.png";

export default function HomePage() {
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Get featured competitions
  const { competitions, isLoading } = useCompetitions({
    featured: true,
    limit: 6,
    category: selectedCategory !== "all" ? selectedCategory : undefined
  });
  
  // Get hero banner from site config
  const { data: heroBanner } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/site-config/hero-banner"],
    onSuccess: (data) => {
      console.log("Hero banner data received:", data);
      if (data?.value) {
        console.log("Hero banner URL path:", data.value);
        console.log("Full URL would be:", window.location.origin + data.value);
      } else {
        console.log("No hero banner value found");
      }
    },
    onError: (error) => {
      console.error("Error fetching hero banner:", error);
    }
  });
  
  // Category options with color dots
  const categories = [
    { value: "all", label: "All Prizes", color: "#6366F1" },
    { value: "electronics", label: "Electronics", color: "#2563EB" },
    { value: "cash_prizes", label: "Cash Prizes", color: "#10B981" },
    { value: "family", label: "Family", color: "#EC4899" },
    { value: "household", label: "Household", color: "#8B5CF6" },
    { value: "kids", label: "Kids", color: "#F59E0B" },
    { value: "days_out", label: "Days Out", color: "#EF4444" },
    { value: "beauty", label: "Beauty", color: "#F97316" },
  ];
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };
  
  // Default hero banner background - no need to display if image is missing
  const defaultHeroBgColor = "#002D5C";
  
  // Helper function to get the full image URL from relative path
  const getFullImageUrl = (relativePath: string) => {
    // Return empty string for null/undefined/empty values
    if (!relativePath) return '';
    
    // Keep absolute URLs as is
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // Convert relative paths to absolute
    return `${window.location.origin}${relativePath}`;
  };
  
  // Helper function to check if the hero banner exists and has a valid value
  const hasValidHeroBanner = () => {
    return heroBanner && heroBanner.value && heroBanner.value.trim() !== '';
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Banner */}
        <section 
          className="relative w-full h-[450px] md:h-[500px] bg-[#002D5C] flex items-center" 
          style={hasValidHeroBanner() ? {
            backgroundImage: `url(${getFullImageUrl(heroBanner!.value)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {/* Fallback image if background style doesn't work */}
          {hasValidHeroBanner() && (
            <img 
              src={getFullImageUrl(heroBanner!.value)} 
              alt="Hero banner" 
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => console.log("Hero image loaded successfully")}
              onError={(e) => console.error("Hero image failed to load:", e)}
            />
          )}
          {/* Removed overlay to show full image */}
          
          <div className="container relative z-10 text-white">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 uppercase tracking-wide drop-shadow-lg text-white">
                WIN THIS<br/>
                BEAUTIFUL<br/>
                NINJA AIR FRYER
              </h1>
              <p className="text-xl md:text-3xl font-bold mb-8 text-[#C3DC6F] drop-shadow-lg tracking-wider">DRAW 10TH MAY 9PM</p>
              <Button asChild size="lg" className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C] font-bold rounded-2xl px-10 py-7 text-lg">
                <Link href="/competitions" className="flex items-center">
                  Enter now
                  <Ticket className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Secure Payments Banner */}
        <section className="py-4 bg-[#f8fafc] border-y border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium text-sm">Secure Payments</span>
              </div>
              
              <div className="flex items-center">
                <img src={paymentCardsImage} alt="Payment cards - Visa, Mastercard, American Express" className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Live Competitions */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#002D5C]">
                Live Competitions
              </h2>
              <p className="text-xl text-gray-700 mt-4 max-w-2xl mx-auto">
                Don't miss your chance to win these <span className="text-[#C3DC6F] font-medium">amazing prizes</span>!
              </p>
            </div>
            
            {/* Category Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    selectedCategory === category.value
                      ? "bg-[#002D5C] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span 
                    className="inline-block w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.label}
                </button>
              ))}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-[#002D5C]" />
              </div>
            ) : competitions?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <div className="mb-4">
                  <Filter className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No competitions found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any competitions matching your criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCategory("all")}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {competitions?.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            )}
            
            <div className="text-center mt-10">
              <Button asChild className="bg-[#002D5C] hover:bg-[#002D5C]/90">
                <Link href="/competitions" className="inline-flex items-center">
                  View All Competitions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        {/* WebSocket Status */}
        <section className="py-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <WebSocketStatus />
          </div>
        </section>
        
        <section className="py-24 bg-gradient-to-br from-[#002147]/5 to-[#002147]/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-[#C3DC6F]/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#C3DC6F]/30 rounded-full translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="bg-[#C3DC6F]/30 text-[#002147] text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full">Simple Steps</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#002147] mb-4">
                How It Works
              </h2>
              <div className="h-1 w-20 bg-[#C3DC6F] mx-auto my-6"></div>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Winning with Moby Comps is quick and easy
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-24 left-0 w-full h-1 bg-gray-200 z-0"></div>
              
              {/* Step 1 */}
              <div className="bg-white rounded-xl p-8 shadow-md text-center relative z-10 border-b-4 border-[#C3DC6F] transition-transform hover:-translate-y-2 duration-300">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 absolute -top-8 left-1/2 transform -translate-x-1/2 shadow-lg">1</div>
                <div className="mt-8 mb-4">
                  <Ticket className="w-12 h-12 mx-auto text-[#C3DC6F]" />
                </div>
                <h3 className="text-xl font-bold text-[#002147] mb-3">Choose & Buy</h3>
                <p className="text-gray-600">Browse competitions, select your tickets, and make a secure payment.</p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white rounded-xl p-8 shadow-md text-center relative z-10 border-b-4 border-[#C3DC6F] transition-transform hover:-translate-y-2 duration-300">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 absolute -top-8 left-1/2 transform -translate-x-1/2 shadow-lg">2</div>
                <div className="mt-8 mb-4">
                  <CalendarDays className="w-12 h-12 mx-auto text-[#C3DC6F]" />
                </div>
                <h3 className="text-xl font-bold text-[#002147] mb-3">Draw Date</h3>
                <p className="text-gray-600">Winners are selected on the draw date with instant notifications.</p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white rounded-xl p-8 shadow-md text-center relative z-10 border-b-4 border-[#C3DC6F] transition-transform hover:-translate-y-2 duration-300">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 absolute -top-8 left-1/2 transform -translate-x-1/2 shadow-lg">3</div>
                <div className="mt-8 mb-4">
                  <Gift className="w-12 h-12 mx-auto text-[#C3DC6F]" />
                </div>
                <h3 className="text-xl font-bold text-[#002147] mb-3">Get Your Prize</h3>
                <p className="text-gray-600">If you win, we'll contact you to arrange delivery of your prize!</p>
              </div>
            </div>
            
            <div className="text-center mt-16">
              <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147] font-semibold px-8 py-4 text-base rounded-full shadow-md transition-all hover:shadow-lg">
                <Link href="/how-to-play" className="flex items-center">
                  Learn More About How To Play
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
