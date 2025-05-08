import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Entry, Competition } from "@shared/schema";
import { formatDate, formatPrice } from "@/lib/utils";
import { Calendar, Clock, AlertCircle, Ticket, ShoppingCart, Loader2, Trophy, Home } from "lucide-react";
import { Link } from "wouter";

export default function MyEntriesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  
  // Fetch user entries - type as any for now to fix TypeScript errors
  const { 
    data: entries = [],
    isLoading: entriesLoading,
    error: entriesError
  } = useQuery<any[]>({
    queryKey: ["/api/user/entries"],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Fetch competitions data
  const {
    data: competitionsData,
    isLoading: competitionsLoading,
    error: competitionsError
  } = useQuery<{ competitions: Competition[] }>({
    queryKey: ["/api/competitions"],
    enabled: true, // Always fetch competitions
  });
  
  // Extract competitions array from response
  const competitions = competitionsData?.competitions || [];
  
  // Loading state
  const isLoading = entriesLoading || competitionsLoading;
  
  // Filter entries by status
  const activeEntries = entries?.filter(entry => entry.status === 'active') || [];
  const completedEntries = entries?.filter(entry => entry.status !== 'active') || [];
  
  // Find competition for an entry - use embedded data or lookup as fallback
  const getCompetition = (entry: any) => {
    // First check if competition data is embedded in the entry (from our updated backend)
    if (entry.competition && entry.competition.title) {
      return {
        ...entry.competition,
        // Add default properties that might be needed
        id: entry.competitionId,
        drawDate: new Date().toISOString(), // Default draw date if not provided
        ticketPrice: 0, // Default price if not available
        ...entry.competition
      };
    }
    
    // Fallback to lookup by ID if embedded data not available
    return competitions?.find(comp => comp.id === entry.competitionId);
  };
  
  // Get ticket count for an entry
  const getTicketCount = (entry: Entry) => {
    return entry.ticketIds.split(',').length;
  };
  
  // Check if competition has ended
  const isCompetitionEnded = (competition?: Competition) => {
    if (!competition) return false;
    
    const drawDate = new Date(competition.drawDate);
    return drawDate < new Date();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002147] mb-2">My Entries</h1>
            <p className="text-gray-600">
              Track all your competition entries and check their status.
            </p>
          </div>
          
          {/* Entries Tabs */}
          <Tabs
            defaultValue="active"
            value={activeTab}
            onValueChange={setActiveTab}
            className="max-w-4xl mx-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="active">Active Entries</TabsTrigger>
                <TabsTrigger value="completed">Completed Entries</TabsTrigger>
              </TabsList>
              
              <Button asChild variant="outline" className="border-[#002147] text-[#002147]">
                <Link href="/competitions">Browse Competitions</Link>
              </Button>
            </div>
            
            {/* Error State */}
            {(entriesError || competitionsError) && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {entriesError?.message || competitionsError?.message || "Failed to load entries. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#002147]" />
              </div>
            )}
            
            {/* Active Entries Tab */}
            <TabsContent value="active" className="mt-2">
              {!isLoading && activeEntries.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4">
                      <Ticket className="h-12 w-12 mx-auto text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Entries</h3>
                    <p className="text-gray-600 mb-6">
                      You don't have any active competition entries yet.
                    </p>
                    <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147]">
                      <Link href="/competitions">Browse Competitions</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeEntries.map((entry) => {
                    const competition = getCompetition(entry);
                    return (
                      <Card key={entry.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          {/* Competition Image */}
                          <div className="w-full md:w-1/4 h-auto md:h-auto bg-gray-200">
                            {competition && (
                              <img
                                src={competition.imageUrl}
                                alt={competition.title}
                                className="w-full h-full object-cover aspect-square md:aspect-auto"
                              />
                            )}
                          </div>
                          
                          {/* Entry Details */}
                          <div className="flex-grow p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-semibold text-[#002147]">
                                {competition?.title || "Competition"}
                              </h3>
                              <div className="bg-[#C3DC6F]/20 text-[#002147] text-xs font-medium rounded-full px-3 py-1">
                                Active
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Draw Date: {competition ? formatDate(competition.drawDate) : 'Unknown'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Ticket className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Tickets: {getTicketCount(entry)} <span className="text-[#002147] font-medium">(#{entry.ticketIds})</span></span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Purchased: {formatDate(entry.createdAt)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <ShoppingCart className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Order ID: #{entry.id}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              <Button 
                                asChild
                                className="bg-[#002147] hover:bg-[#002147]/90"
                              >
                                <Link href={`/competition/${competition?.id}`}>
                                  View Competition
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            {/* Completed Entries Tab */}
            <TabsContent value="completed" className="mt-2">
              {!isLoading && completedEntries.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4">
                      <Clock className="h-12 w-12 mx-auto text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Completed Entries</h3>
                    <p className="text-gray-600 mb-6">
                      You don't have any completed competition entries yet.
                    </p>
                    <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147]">
                      <Link href="/competitions">Browse Competitions</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {completedEntries.map((entry) => {
                    const competition = getCompetition(entry);
                    return (
                      <Card key={entry.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          {/* Competition Image */}
                          <div className="w-full md:w-1/4 h-auto md:h-auto bg-gray-200">
                            {competition && (
                              <img
                                src={competition.imageUrl}
                                alt={competition.title}
                                className="w-full h-full object-cover aspect-square md:aspect-auto"
                              />
                            )}
                          </div>
                          
                          {/* Entry Details */}
                          <div className="flex-grow p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-semibold text-[#002147]">
                                {competition?.title || "Competition"}
                              </h3>
                              <div className={`
                                ${entry.status === 'won' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} 
                                text-xs font-medium rounded-full px-3 py-1
                              `}>
                                {entry.status === 'won' ? 'Won' : 'Completed'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Draw Date: {competition ? formatDate(competition.drawDate) : 'Unknown'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Ticket className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Tickets: {getTicketCount(entry)} <span className="text-[#002147] font-medium">(#{entry.ticketIds})</span></span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Purchased: {formatDate(entry.createdAt)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <ShoppingCart className="h-4 w-4 mr-2 text-[#C3DC6F]" />
                                <span>Order ID: #{entry.id}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              {entry.status === 'won' ? (
                                <Button asChild className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002147]">
                                  <Link href="/my-wins">View Win Details</Link>
                                </Button>
                              ) : (
                                <Button 
                                  asChild
                                  variant="outline" 
                                  className="border-[#002147] text-[#002147]"
                                >
                                  <Link href={`/competition/${competition?.id}`}>
                                    View Competition
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}