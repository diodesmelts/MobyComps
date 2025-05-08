import { Link } from "wouter";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/ui/competition-card";
import { useCompetitions } from "@/hooks/use-competitions";
import { Loader2, ArrowRight, Filter } from "lucide-react";
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
          className="relative w-full h-[550px] md:h-[600px] bg-[#002D5C] flex items-center" 
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
              <Button asChild size="lg" className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C] font-semibold">
                <Link href="/competitions">
                  Enter now
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium text-sm">Bank-Grade Encryption</span>
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
        <section className="py-20 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#002D5C]">
                How It Works
              </h2>
              <p className="text-xl text-gray-700 mt-4 max-w-2xl mx-auto">
                Winning with Moby Comps is quick and easy
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-8 shadow-sm text-center relative">
                <div className="w-12 h-12 bg-[#002D5C] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 absolute -top-6 left-1/2 transform -translate-x-1/2">1</div>
                <h3 className="text-xl font-bold text-[#002D5C] mb-3 mt-4">Buy Tickets</h3>
                <p className="text-gray-600">Choose a competition, select your tickets, and make a secure payment.</p>
              </div>
              
              <div className="bg-white rounded-lg p-8 shadow-sm text-center relative">
                <div className="w-12 h-12 bg-[#002D5C] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 absolute -top-6 left-1/2 transform -translate-x-1/2">2</div>
                <h3 className="text-xl font-bold text-[#002D5C] mb-3 mt-4">Reveal Result</h3>
                <p className="text-gray-600">Winners are automatically selected on the draw date and notified immediately.</p>
              </div>
              
              <div className="bg-white rounded-lg p-8 shadow-sm text-center relative">
                <div className="w-12 h-12 bg-[#002D5C] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 absolute -top-6 left-1/2 transform -translate-x-1/2">3</div>
                <h3 className="text-xl font-bold text-[#002D5C] mb-3 mt-4">Claim Prize</h3>
                <p className="text-gray-600">If you win, we'll contact you to arrange delivery of your prize!</p>
              </div>
            </div>
            
            <div className="text-center mt-14">
              <Button asChild variant="outline" className="border-[#002D5C] text-[#002D5C] hover:bg-[#002D5C] hover:text-white transition-colors px-6 py-5 text-base">
                <Link href="/how-to-play" className="flex items-center">
                  Learn More About How To Play
                  <ArrowRight className="ml-2 h-4 w-4" />
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
