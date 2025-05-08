import { Link } from "wouter";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/ui/competition-card";
import { useCompetitions } from "@/hooks/use-competitions";
import { Loader2, ArrowRight, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
          className="relative w-full h-[500px] bg-[#002D5C] flex items-center" 
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shadow-lg drop-shadow-2xl">
                WIN THIS<br/>
                BEAUTIFUL<br/>
                NINJA AIR FRYER
              </h1>
              <p className="text-xl md:text-2xl font-semibold mb-8 text-[#C3DC6F] text-shadow drop-shadow-lg">DRAW 10TH MAY 9PM</p>
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
        
        {/* Secure Payments Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-[#f8fafc] rounded-2xl shadow-lg p-8 md:p-12">
              <div className="md:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold text-[#002D5C] mb-4">
                  Shop with Confidence
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Your security is our priority. All transactions on Moby Comps are protected with bank-grade encryption and processed securely through Stripe, a trusted global payment provider.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-medium">Secure SSL Encryption</span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium">Protected Payments</span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Verified Competitions</span>
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-md">
                  <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="140" height="80" className="mb-2">
                    <path d="M59.442 14.058h-7.124c0-1.364.732-1.835 1.544-1.835.732 0 1.232.236 1.464.473l.67-1.417c-.65-.473-1.572-.732-2.455-.732-2.153 0-3.598 1.126-3.598 3.57 0 2.13 1.307 3.346 3.504 3.346 1.84 0 3.995-1.157 3.995-3.405zm-7.124 0h-.082 1.7c0-1.364-.732-1.835-1.544-1.835-.732 0-1.232.236-1.464.473l-.67-1.417c.65-.473 1.572-.732 2.455-.732 2.153 0 3.598 1.126 3.598 3.57 0 2.13-1.307 3.346-3.504 3.346-1.84 0-3.995-1.157-3.995-3.405h3.507zm-9.415-3.482c-1.05 0-1.78.496-2.155 1.008l-.14-84h-3.1l.026 10.97h3.1l-.016-7.085c.31-.425.815-.797 1.547-.797.967 0 1.502.57 1.502 1.738v6.143h3.1v-6.555c0-2.373-1.14-3.602-3.294-3.602h-.57v4.257zm-10.765 0c-2.22 0-3.67.5-3.67.5l.002-1.5h-2.74l-.01 10.89h3.1l.013-6.89s.875-.416 2.096-.416c.608 0 .99.098 1.274.245l.944-2.276c-.565-.323-1.425-.554-1.425-.554h.415v.001zm-11.387.026c-1.232 0-2.04.588-2.463 1.04l-.165-.87h-2.714v10.527h3.1v-7.85c.472-.398 1.07-.673 1.73-.673.39 0 .664.05.975.166l.85-2.166c-.464-.147-.913-.174-1.314-.174zm-9.623-.026c-2.215 0-3.632 1.097-3.632 2.87 0 2.107 1.922 2.585 3.27 2.937.674.174 1.266.327 1.266.75 0 .446-.496.685-1.192.685-1.02 0-2.01-.413-2.58-.752l-.77 1.977c.652.392 1.875.752 3.194.752 2.194 0 3.857-1.082 3.857-2.973 0-2.044-1.844-2.537-3.144-2.874-.7-.18-1.328-.342-1.328-.75 0-.368.368-.608 1.05-.608.85 0 1.785.31 2.232.548l.73-1.902c-.625-.31-1.524-.56-2.822-.56h-.132zm0 0c-2.215 0-3.632 1.097-3.632 2.87 0 2.107 1.922 2.585 3.27 2.937.674.174 1.266.327 1.266.75 0 .446-.496.685-1.192.685-1.02 0-2.01-.413-2.58-.752l-.77 1.977c.652.392 1.875.752 3.194.752 2.194 0 3.857-1.082 3.857-2.973 0-2.044-1.844-2.537-3.144-2.874-.7-.18-1.328-.342-1.328-.75 0-.368.368-.608 1.05-.608.85 0 1.785.31 2.232.548l.73-1.902c-.625-.31-1.524-.56-2.822-.56h-.132zm-9.614 4.276c0 2.266 1.607 3.363 3.483 3.363.94 0 1.562-.21 2.2-.598l.002 2.277c0 .8-.625 1.172-1.68 1.172-.946 0-1.86-.236-2.388-.473l-.644 1.776c.634.365 1.865.698 3.16.698 2.37 0 4.382-.948 4.382-3.61V10.74h-2.687l-.136.732c-.577-.576-1.28-.897-2.315-.897-1.785 0-3.377 1.484-3.377 3.875v.4zm5.68.006c0 .797-.566 1.56-1.654 1.56-.642 0-1.284-.38-1.284-1.6 0-.99.627-1.692 1.64-1.692.717 0 1.3.443 1.3 1.567v.165zm36.23-.006c0 2.266 1.606 3.363 3.48 3.363.943 0 1.564-.21 2.2-.598l.002 2.277c0 .8-.624 1.172-1.68 1.172-.945 0-1.86-.236-2.387-.473l-.644 1.776c.635.365 1.866.698 3.16.698 2.372 0 4.384-.948 4.384-3.61V10.74h-2.688l-.136.732c-.577-.576-1.28-.897-2.315-.897-1.785 0-3.377 1.484-3.377 3.875v.4zm5.678.006c0 .797-.565 1.56-1.652 1.56-.644 0-1.285-.38-1.285-1.6 0-.99.627-1.692 1.64-1.692.718 0 1.3.443 1.3 1.567l-.003.165zM3.277 10.01l-.1 10.252L0 3.658h3.363L8.02 10.01c-.196-1.946-.73-5.467-1.284-6.352h3.1c.496 1.417.852 2.902.852 5.865v10.738h-3.1l-4.31-10.01-2.213-6.352h1.212z" fill="#635BFF"/>
                  </svg>
                  <span className="text-sm text-gray-500 mb-4">Secure payments by</span>
                  <div className="flex gap-2">
                    <img src="https://cdn.sanity.io/images/ijr8p1fo/production/a4d1607ae68c4132ce95a8f96b754d113640ffb5-24x16.svg" alt="Visa" className="h-8 w-auto" />
                    <img src="https://cdn.sanity.io/images/ijr8p1fo/production/cd13a7cd3e72af87ff8faf51bf96e7ad9e8cfeeb-24x16.svg" alt="Mastercard" className="h-8 w-auto" />
                    <img src="https://cdn.sanity.io/images/ijr8p1fo/production/5bdfeec3324cce53175efb9fb91fdea3e63eff04-24x16.svg" alt="Amex" className="h-8 w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
