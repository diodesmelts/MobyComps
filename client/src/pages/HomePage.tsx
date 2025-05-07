import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { adminApi, competitionApi } from "@/lib/api";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import { Competition } from "@shared/types";

export default function HomePage() {
  // Fetch featured competitions
  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery({
    queryKey: ["/api/competitions"],
    queryFn: competitionApi.getAllCompetitions,
  });

  // Fetch site configuration for the hero banner
  const { data: siteConfig } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: adminApi.getSiteConfig,
  });

  // Featured competitions (should be filtered on the server)
  const featuredCompetitions = competitions?.filter(comp => comp.isFeatured);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[480px] overflow-hidden bg-primary">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ 
            backgroundImage: `url(${siteConfig?.heroBanner?.imageUrl || 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'})` 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-transparent"></div>
        
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              WIN THIS<br/>
              BEAUTIFUL<br/>
              <span className="text-secondary">NINJA AIR FRYER</span>
            </h1>
            <p className="text-secondary text-xl md:text-2xl font-semibold mb-8">
              DRAW 10TH MAY 9PM
            </p>
            <Button asChild size="lg" variant="secondary" className="group">
              <Link href="/competitions">
                Enter now 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-primary/80 text-white px-4 py-2 rounded-full text-sm flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Secure payments with Mastercard and Visa
          </div>
        </div>
      </div>

      {/* Live Competitions Section */}
      <section className="py-16 px-4 container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-primary">Live</span>
            <span className="relative inline-block">
              <span className="text-primary">Competitions</span>
              <span className="absolute top-0 -right-3 h-3 w-3 bg-secondary rounded-full animate-pulse"></span>
            </span>
          </h2>
          <p className="text-gray-600 text-lg">
            Don't miss your chance to win these <span className="text-secondary font-medium">amazing prizes</span>! New competitions added regularly.
          </p>
        </div>

        {/* Competition Grid */}
        <div className="competition-grid mb-10">
          {isLoadingCompetitions ? (
            // Skeleton loaders while loading
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <Skeleton className="h-72 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))
          ) : featuredCompetitions && featuredCompetitions.length > 0 ? (
            // Render competitions
            featuredCompetitions.slice(0, 3).map((competition: Competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-muted-foreground">No active competitions at the moment.</p>
              <p>Please check back soon!</p>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/competitions">
              View All Competitions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Moby Comps makes it incredibly easy to win amazing prizes. Just follow these simple steps!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-xl mb-3">Buy Tickets</h3>
              <p className="text-gray-600">
                Browse our competitions and purchase tickets for the prizes you'd love to win.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-xl mb-3">Wait for the Draw</h3>
              <p className="text-gray-600">
                Competitions close on their set date or when all tickets are sold. Then we select a winner.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-xl mb-3">Claim Your Prize</h3>
              <p className="text-gray-600">
                Winners are notified by email. Prizes are dispatched within 14 days.
              </p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/how-to-play">
                Learn More About How to Play
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Winners Section 
      <section className="py-16 px-4 container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">Recent Winners</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Meet some of our latest lucky winners and the amazing prizes they've won.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Winner cards would go here * /}
        </div>
      </section>
      */}

      {/* Testimonials / Trust Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Why Choose Moby Comps?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <ShieldCheck className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-lg font-semibold">Secure & Transparent</h3>
              </div>
              <p className="text-gray-600">
                All our competitions are run with complete transparency and our payment system is fully secure.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Badge className="mr-3 p-1.5 h-8 w-8 flex items-center justify-center">
                  <span className="text-lg font-bold">£1</span>
                </Badge>
                <h3 className="text-lg font-semibold">Amazing Value</h3>
              </div>
              <p className="text-gray-600">
                Tickets start from just £1, giving you a chance to win incredible prizes at a fraction of their value.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-lg font-semibold">Regular Draws</h3>
              </div>
              <p className="text-gray-600">
                We add new competitions weekly, so there's always something exciting to enter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 container mx-auto text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">Ready to Win?</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Don't miss your chance to win amazing prizes. Enter our competitions today!
        </p>
        <Button asChild size="lg" className="px-8">
          <Link href="/competitions">
            Browse Competitions <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
