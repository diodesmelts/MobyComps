import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/ui/competition-card";
import { useCompetitions } from "@/hooks/use-competitions";
import { Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  // Get featured competitions
  const { competitions, isLoading } = useCompetitions({
    featured: true,
    limit: 3
  });
  
  // Get hero banner from site config
  const { data: heroBanner } = useQuery({
    queryKey: ["/api/site-config/hero-banner"],
    enabled: false,
  });
  
  // Default hero banner if none set in config
  const defaultHeroBanner = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2940&auto=format&fit=crop";
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Banner */}
        <section 
          className="relative w-full h-[500px] bg-cover bg-center flex items-center"
          style={{ backgroundImage: `url(${heroBanner?.value || defaultHeroBanner})` }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="container mx-auto px-4 relative z-10 text-white">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                WIN THIS<br/>
                BEAUTIFUL<br/>
                NINJA AIR FRYER
              </h1>
              <p className="text-xl md:text-2xl font-semibold mb-8 text-[#8EE000]">DRAW 10TH MAY 9PM</p>
              <Button asChild size="lg" className="bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002147] font-semibold">
                <Link href="/competitions">
                  Enter now
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
              <div className="mt-6 inline-flex items-center justify-center bg-[#002147] rounded-full px-4 py-2 text-white text-sm">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Secure payments with Mastercard and Visa
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Competitions */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#002147]">Live Competitions</h2>
              <p className="text-gray-600 mt-2">Don't miss your chance to win these <span className="text-[#8EE000] font-medium">amazing prizes</span>! New competitions added regularly.</p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-[#002147]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {competitions?.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            )}
            
            <div className="text-center mt-10">
              <Button asChild className="bg-[#002147] hover:bg-[#002147]/90">
                <Link href="/competitions" className="inline-flex items-center">
                  View All Competitions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#002147]">How It Works</h2>
              <p className="text-gray-600 mt-2">Winning with Moby Comps is quick and easy</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold text-[#002147] mb-2">Buy Tickets</h3>
                <p className="text-gray-600">Choose a competition, select your tickets, and make a secure payment.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold text-[#002147] mb-2">Reveal Result</h3>
                <p className="text-gray-600">Winners are automatically selected on the draw date and notified immediately.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#002147] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold text-[#002147] mb-2">Claim Prize</h3>
                <p className="text-gray-600">If you win, we'll contact you to arrange delivery of your prize!</p>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="border-[#002147] text-[#002147]">
                <Link href="/how-to-play">
                  Learn More About How To Play
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
