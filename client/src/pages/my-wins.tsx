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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Entry, Competition } from "@shared/schema";
import { formatDate, formatPrice } from "@/lib/utils";
import { Calendar, Package, AlertCircle, Trophy, ShoppingCart, Loader2, Truck, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function MyWinsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch user winning entries
  const { 
    data: wins,
    isLoading: winsLoading,
    error: winsError
  } = useQuery<Entry[]>({
    queryKey: ["/api/my-wins"],
    enabled: !!user,
  });
  
  // Fetch competitions data
  const {
    data: competitions,
    isLoading: competitionsLoading,
    error: competitionsError
  } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    enabled: !!wins,
  });
  
  // Loading state
  const isLoading = winsLoading || competitionsLoading;
  
  // Find competition for an entry
  const getCompetition = (competitionId: number) => {
    return competitions?.find(comp => comp.id === competitionId);
  };
  
  // Get filtered wins based on status filter
  const getFilteredWins = () => {
    if (!wins) return [];
    if (statusFilter === "all") return wins;
    
    // Mock delivery statuses for demo purposes
    // In a real app, this would come from the server
    const mockDeliveryStatus: Record<number, string> = {
      1: "processing",
      2: "shipped",
      3: "delivered",
    };
    
    return wins.filter(win => {
      const entryId = win.id % 3 + 1; // Just for demo
      return mockDeliveryStatus[entryId] === statusFilter;
    });
  };
  
  // Get delivery status for a win
  const getDeliveryStatus = (win: Entry) => {
    // Mock delivery statuses for demo purposes
    // In a real app, this would come from the server
    const statuses = ["processing", "shipped", "delivered"];
    const entryId = win.id % 3; // Just for demo
    return statuses[entryId];
  };
  
  // Get ticket count for an entry
  const getTicketCount = (entry: Entry) => {
    return entry.ticketIds.split(',').length;
  };
  
  const filteredWins = getFilteredWins();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002D5C] mb-2">My Wins</h1>
            <p className="text-gray-600">
              Congratulations! Track your prize wins and delivery status here.
            </p>
          </div>
          
          {/* Filter Controls */}
          <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Filter by status:</span>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button asChild variant="outline" className="border-[#002D5C] text-[#002D5C]">
              <Link href="/competitions">Enter More Competitions</Link>
            </Button>
          </div>
          
          {/* Error State */}
          {(winsError || competitionsError) && (
            <Alert variant="destructive" className="max-w-4xl mx-auto mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {winsError?.message || competitionsError?.message || "Failed to load wins. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#002D5C]" />
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && (!wins || wins.length === 0) && (
            <Card className="max-w-4xl mx-auto text-center py-12">
              <CardContent>
                <div className="mb-4">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Wins Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven't won any competitions yet. Keep entering to increase your chances!
                </p>
                <Button asChild className="bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002D5C]">
                  <Link href="/competitions">Browse Competitions</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Wins List */}
          {!isLoading && filteredWins.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-6">
              {filteredWins.map((win) => {
                const competition = getCompetition(win.competitionId);
                const deliveryStatus = getDeliveryStatus(win);
                
                return (
                  <Card key={win.id} className="overflow-hidden">
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
                      
                      {/* Win Details */}
                      <div className="flex-grow p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-[#002D5C]">
                              {competition?.title || "Prize"}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {competition?.cashAlternative && 
                                `Cash Alternative: ${formatPrice(competition.cashAlternative)}`
                              }
                            </p>
                          </div>
                          
                          <Badge
                            variant="outline"
                            className={`
                              ${deliveryStatus === 'processing' ? 'border-orange-400 text-orange-600 bg-orange-50' : 
                                deliveryStatus === 'shipped' ? 'border-blue-400 text-blue-600 bg-blue-50' :
                                'border-green-400 text-green-600 bg-green-50'}
                            `}
                          >
                            {deliveryStatus === 'processing' ? 'Processing' : 
                              deliveryStatus === 'shipped' ? 'Shipped' : 'Delivered'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-[#8EE000]" />
                            <span>Won on: {formatDate(win.createdAt)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Trophy className="h-4 w-4 mr-2 text-[#8EE000]" />
                            <span>Winning Ticket: #{win.ticketIds.split(',')[0]}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <ShoppingCart className="h-4 w-4 mr-2 text-[#8EE000]" />
                            <span>Total Entries: {getTicketCount(win)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Truck className="h-4 w-4 mr-2 text-[#8EE000]" />
                            <span>
                              {deliveryStatus === 'processing' ? 'Processing your prize' : 
                               deliveryStatus === 'shipped' ? 'Shipped on ' + formatDate(new Date(Date.now() - 2*24*60*60*1000)) : 
                               'Delivered on ' + formatDate(new Date(Date.now() - 5*24*60*60*1000))}
                            </span>
                          </div>
                        </div>
                        
                        {/* Delivery Timeline */}
                        <div className="mt-6">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-between">
                              <div className={`flex flex-col items-center ${
                                deliveryStatus === 'processing' || 
                                deliveryStatus === 'shipped' || 
                                deliveryStatus === 'delivered' ? 'text-[#8EE000]' : 'text-gray-400'
                              }`}>
                                <div className={`rounded-full h-5 w-5 flex items-center justify-center ${
                                  deliveryStatus === 'processing' || 
                                  deliveryStatus === 'shipped' || 
                                  deliveryStatus === 'delivered' ? 'bg-[#8EE000]' : 'bg-gray-300'
                                }`}>
                                  <CheckIcon className="h-3 w-3 text-white" />
                                </div>
                                <span className="mt-2 text-xs">Processing</span>
                              </div>
                              
                              <div className={`flex flex-col items-center ${
                                deliveryStatus === 'shipped' || 
                                deliveryStatus === 'delivered' ? 'text-[#8EE000]' : 'text-gray-400'
                              }`}>
                                <div className={`rounded-full h-5 w-5 flex items-center justify-center ${
                                  deliveryStatus === 'shipped' || 
                                  deliveryStatus === 'delivered' ? 'bg-[#8EE000]' : 'bg-gray-300'
                                }`}>
                                  <CheckIcon className="h-3 w-3 text-white" />
                                </div>
                                <span className="mt-2 text-xs">Shipped</span>
                              </div>
                              
                              <div className={`flex flex-col items-center ${
                                deliveryStatus === 'delivered' ? 'text-[#8EE000]' : 'text-gray-400'
                              }`}>
                                <div className={`rounded-full h-5 w-5 flex items-center justify-center ${
                                  deliveryStatus === 'delivered' ? 'bg-[#8EE000]' : 'bg-gray-300'
                                }`}>
                                  <CheckIcon className="h-3 w-3 text-white" />
                                </div>
                                <span className="mt-2 text-xs">Delivered</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        {deliveryStatus === 'delivered' && (
                          <div className="flex justify-end mt-4">
                            <Button className="bg-[#002D5C] hover:bg-[#002D5C]/90">
                              Leave Feedback
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Filtered Empty State */}
          {!isLoading && wins && wins.length > 0 && filteredWins.length === 0 && (
            <Card className="max-w-4xl mx-auto text-center py-8">
              <CardContent>
                <div className="mb-4">
                  <Package className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any wins with the selected filter.
                </p>
                <Button variant="outline" onClick={() => setStatusFilter("all")}>
                  Clear Filter
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// CheckIcon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
