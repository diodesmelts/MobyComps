import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAdminCompetitionTicketSales, useAdminDrawCompetition } from "@/hooks/use-admin";
import { ArrowLeft, BarChart, Calendar, Clock, FilePieChart, Heart, HeartPulse, PercentCircle, Search, Tag, Ticket, Trophy, Users, Wallet } from "lucide-react";

export default function TicketSalesDetailPage() {
  const params = useParams<{ id: string }>();
  const competitionId = parseInt(params.id);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get competition ticket sales data
  const { 
    data: ticketSalesData, 
    isLoading, 
    error 
  } = useAdminCompetitionTicketSales(competitionId);
  
  // Trigger a draw mutation
  const drawCompetition = useAdminDrawCompetition();
  
  // Handle draw for a competition
  const handleDraw = () => {
    drawCompetition.mutate(competitionId);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-8 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-4">Loading competition data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !ticketSalesData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto">
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => navigate("/admin/ticket-sales")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ticket Sales
              </Button>
              
              <Card>
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                  <CardDescription>Failed to load competition data</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">
                    {error instanceof Error ? error.message : "Unknown error occurred"}
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate("/admin/ticket-sales")}
                  >
                    Return to Ticket Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const { competition, ticketStats } = ticketSalesData;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin/ticket-sales")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-[#002D5C]">
                Ticket Sales: {competition.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {competition.status === 'live' && (
                <Button
                  onClick={handleDraw}
                  disabled={drawCompetition.isPending}
                >
                  {drawCompetition.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full" />
                      Drawing...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Perform Draw
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/competitions?edit=${competition.id}`)}
              >
                Edit Competition
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                  <Ticket className="h-4 w-4 mr-2 text-blue-500" />
                  Ticket Sales
                </CardTitle>
                <CardDescription>Overall ticket sales statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Available</span>
                      <span className="text-xl font-semibold">{ticketStats.available}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Reserved</span>
                      <span className="text-xl font-semibold">{ticketStats.reserved}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Purchased</span>
                      <span className="text-xl font-semibold">{ticketStats.purchased}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-xl font-semibold">{ticketStats.total}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 items-center">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium">
                        {Math.round(ticketStats.percentageSold)}%
                      </span>
                    </div>
                    <Progress value={ticketStats.percentageSold} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-emerald-500" />
                  Revenue
                </CardTitle>
                <CardDescription>Financial statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Ticket Price</span>
                      <span className="text-xl font-semibold">{formatPrice(competition.ticketPrice)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Total Revenue</span>
                      <span className="text-xl font-semibold">{formatPrice(ticketStats.revenue)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {ticketStats.purchased} tickets sold at {formatPrice(competition.ticketPrice)} each
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-red-500" />
                  Competition Details
                </CardTitle>
                <CardDescription>Status and dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Status</span>
                      <span 
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium mt-1 w-fit
                          ${competition.status === 'live' 
                            ? 'bg-green-100 text-green-700' 
                            : competition.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : competition.status === 'draft'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }
                        `}
                      >
                        {competition.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Draw Date</span>
                      <span className="text-md font-semibold flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        {formatDate(new Date(competition.drawDate))}
                      </span>
                    </div>
                    
                    {competition.closeDate && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Close Date</span>
                        <span className="text-md font-semibold flex items-center gap-1 mt-1">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          {formatDate(new Date(competition.closeDate))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts & Detailed Stats */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Distribution</CardTitle>
                <CardDescription>Visual breakdown of ticket allocation</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Visual representation of ticket stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <Ticket className="h-10 w-10 text-blue-500" />
                    </div>
                    <span className="text-2xl font-bold">{ticketStats.available}</span>
                    <span className="text-sm text-gray-500">Available Tickets</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg">
                    <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-10 w-10 text-amber-500" />
                    </div>
                    <span className="text-2xl font-bold">{ticketStats.reserved}</span>
                    <span className="text-sm text-gray-500">Reserved Tickets</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg">
                    <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <span className="text-2xl font-bold">{ticketStats.purchased}</span>
                    <span className="text-sm text-gray-500">Purchased Tickets</span>
                  </div>
                </div>
                
                {/* Progress bars for visual comparison */}
                <div className="mt-8 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Available ({Math.round(ticketStats.available / ticketStats.total * 100)}%)</span>
                    </div>
                    <Progress value={ticketStats.available / ticketStats.total * 100} className="h-3 bg-gray-100" indicatorColor="bg-blue-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Reserved ({Math.round(ticketStats.reserved / ticketStats.total * 100)}%)</span>
                    </div>
                    <Progress value={ticketStats.reserved / ticketStats.total * 100} className="h-3 bg-gray-100" indicatorColor="bg-amber-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Purchased ({Math.round(ticketStats.purchased / ticketStats.total * 100)}%)</span>
                    </div>
                    <Progress value={ticketStats.purchased / ticketStats.total * 100} className="h-3 bg-gray-100" indicatorColor="bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Lookup Tool */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Steps you can take for this competition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer transition-colors"
                     onClick={() => navigate(`/admin/ticket-sales?lookup=${competition.id}`)}>
                  <Search className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="font-medium">Lookup Ticket</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Search for a specific ticket number
                  </p>
                </div>
                
                {competition.status === 'live' && (
                  <div className="p-4 border rounded-lg flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer transition-colors"
                       onClick={handleDraw}>
                    <Trophy className="h-8 w-8 text-amber-500 mb-3" />
                    <h3 className="font-medium">Perform Draw</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Draw a winner for this competition
                    </p>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg flex flex-col items-center text-center hover:bg-gray-50 cursor-pointer transition-colors"
                     onClick={() => navigate(`/admin/competitions?edit=${competition.id}`)}>
                  <Edit className="h-8 w-8 text-gray-500 mb-3" />
                  <h3 className="font-medium">Edit Details</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Modify competition information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Missing components to make the code compile
function CheckCircle(props: any) {
  return <div {...props} />;
}

function Edit(props: any) {
  return <div {...props} />;
}