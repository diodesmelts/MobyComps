import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Tag,
  Ticket,
  Trophy,
  User2
} from "lucide-react";
import { useAdminTicketSales, useAdminWinningTicketLookup, useAdminDrawCompetition } from "@/hooks/use-admin";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminTicketSalesPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Lookup states
  const [lookupCompetitionId, setLookupCompetitionId] = useState<number | undefined>();
  const [lookupTicketNumber, setLookupTicketNumber] = useState<number | undefined>();
  
  // Get ticket sales data
  const { 
    data: ticketSalesData, 
    isLoading: isLoadingTicketSales,
    error: ticketSalesError
  } = useAdminTicketSales();
  
  // Lookup a winning ticket
  const {
    data: ticketLookupData,
    isLoading: isLoadingTicketLookup,
    error: ticketLookupError
  } = useAdminWinningTicketLookup(lookupCompetitionId, lookupTicketNumber);
  
  // Trigger a draw mutation
  const drawCompetition = useAdminDrawCompetition();
  
  // Filter ticket sales data
  const filteredSalesData = ticketSalesData
    ? ticketSalesData
        .filter(sale => 
          filterStatus === "all" || sale.status === filterStatus
        )
        .filter(sale => 
          sale.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];
  
  // Handle ticket lookup submit
  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCompetitionId || !lookupTicketNumber) {
      toast({
        title: "Missing information",
        description: "Please provide both competition ID and ticket number",
        variant: "destructive"
      });
      return;
    }
  };
  
  // Handle draw for a competition
  const handleDraw = (competitionId: number) => {
    drawCompetition.mutate(competitionId);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#002D5C]">Ticket Sales Dashboard</h1>
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              size="sm"
            >
              Back to Admin
            </Button>
          </div>
          
          <Tabs defaultValue="sales" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="sales">Ticket Sales</TabsTrigger>
              <TabsTrigger value="lookup">Winner Lookup</TabsTrigger>
            </TabsList>
            
            {/* Ticket Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary cards */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-[#002D5C]" />
                      <span className="text-2xl font-bold">
                        {formatPrice(ticketSalesData?.reduce((total, sale) => total + sale.revenue, 0) || 0)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Across {ticketSalesData?.length || 0} competitions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Tickets Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Ticket className="h-4 w-4 text-[#002D5C]" />
                      <span className="text-2xl font-bold">
                        {ticketSalesData?.reduce((total, sale) => total + sale.ticketsSold, 0) || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Of {ticketSalesData?.reduce((total, sale) => total + sale.maxTickets, 0) || 0} total tickets
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Competitions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-[#002D5C]" />
                      <span className="text-2xl font-bold">
                        {ticketSalesData?.filter(sale => sale.status === 'live').length || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Ready for draws
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Search and filter row */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center my-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search competitions..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select 
                    className="text-sm border rounded py-1.5 px-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {/* Main table */}
              {isLoadingTicketSales ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
                  <p className="mt-2">Loading ticket sales data...</p>
                </div>
              ) : ticketSalesError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
                  Error loading ticket sales: {ticketSalesError instanceof Error ? ticketSalesError.message : 'Unknown error'}
                </div>
              ) : (
                <div className="bg-white rounded-md shadow overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competition</TableHead>
                        <TableHead className="text-right">Ticket Price</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Draw Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesData.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium max-w-md truncate">
                            {sale.title}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(sale.ticketPrice)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1">
                              <Progress value={sale.percentageSold} className="w-20 h-2" />
                              <span className="text-xs text-gray-500">
                                {sale.ticketsSold} / {sale.maxTickets}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(sale.revenue)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <div className="flex items-center justify-end gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              {formatDate(new Date(sale.drawDate))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span 
                              className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium
                                ${sale.status === 'live' 
                                  ? 'bg-green-100 text-green-700' 
                                  : sale.status === 'completed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : sale.status === 'draft'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700'
                                }
                              `}
                            >
                              {sale.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/admin/ticket-sales/${sale.id}`)}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              {sale.status === 'live' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDraw(sale.id)}
                                  disabled={drawCompetition.isPending}
                                >
                                  {drawCompetition.isPending ? (
                                    <>
                                      <div className="animate-spin h-4 w-4 mr-1 border-2 border-t-transparent border-white rounded-full" />
                                      Drawing...
                                    </>
                                  ) : (
                                    <>
                                      <Trophy className="h-4 w-4 mr-1" />
                                      Draw
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredSalesData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {searchTerm || filterStatus !== "all" 
                              ? "No competitions match your filters" 
                              : "No competitions found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* Winner Lookup Tab */}
            <TabsContent value="lookup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Lookup</CardTitle>
                  <CardDescription>
                    Look up competition ticket details, including winner information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLookupSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="competitionId">Competition ID</Label>
                        <Input 
                          id="competitionId" 
                          type="number" 
                          placeholder="Enter competition ID" 
                          value={lookupCompetitionId || ''}
                          onChange={(e) => setLookupCompetitionId(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticketNumber">Ticket Number</Label>
                        <Input 
                          id="ticketNumber" 
                          type="number" 
                          placeholder="Enter ticket number" 
                          value={lookupTicketNumber || ''}
                          onChange={(e) => setLookupTicketNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!lookupCompetitionId || !lookupTicketNumber || isLoadingTicketLookup}
                    >
                      {isLoadingTicketLookup ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full" />
                          Looking up...
                        </>
                      ) : (
                        <>Lookup Ticket</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Results Card */}
              {ticketLookupData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Competition</h3>
                          <p className="text-lg font-semibold">{ticketLookupData.competition.title}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Status</h3>
                          <span 
                            className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium
                              ${ticketLookupData.competition.status === 'live' 
                                ? 'bg-green-100 text-green-700' 
                                : ticketLookupData.competition.status === 'completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : ticketLookupData.competition.status === 'draft'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              }
                            `}
                          >
                            {ticketLookupData.competition.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Draw Date</h3>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {formatDate(new Date(ticketLookupData.competition.drawDate))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Ticket Number</h3>
                          <p className="text-lg font-semibold flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-blue-500" />
                            {ticketLookupData.ticket.number}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Ticket Status</h3>
                          <span 
                            className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium
                              ${ticketLookupData.ticket.status === 'available' 
                                ? 'bg-gray-100 text-gray-700' 
                                : ticketLookupData.ticket.status === 'reserved'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }
                            `}
                          >
                            {ticketLookupData.ticket.status}
                          </span>
                        </div>
                        <div>
                          {ticketLookupData.ticket.purchasedAt && (
                            <>
                              <h3 className="text-sm font-medium text-gray-500">Purchased</h3>
                              <p className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                {formatDate(new Date(ticketLookupData.ticket.purchasedAt))}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner information */}
                    {ticketLookupData.user ? (
                      <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User2 className="h-5 w-5 text-[#002D5C]" />
                          Ticket Owner
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Name</h4>
                            <p>{ticketLookupData.user.firstName} {ticketLookupData.user.lastName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Email</h4>
                            <p>{ticketLookupData.user.email}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Username</h4>
                            <p>{ticketLookupData.user.username}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                            <p>{ticketLookupData.user.phoneNumber || "Not provided"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-500">Address</h4>
                            <p>
                              {ticketLookupData.user.address ? (
                                <>
                                  {ticketLookupData.user.address}, 
                                  {ticketLookupData.user.city && <>{ticketLookupData.user.city}, </>}
                                  {ticketLookupData.user.postcode && <>{ticketLookupData.user.postcode}, </>}
                                  {ticketLookupData.user.country && <>{ticketLookupData.user.country}</>}
                                </>
                              ) : (
                                "Address not provided"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 border-t pt-6">
                        <p className="flex items-center gap-2 text-gray-500">
                          <User2 className="h-5 w-5" />
                          This ticket has not been purchased by any user
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {ticketLookupError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
                  Error looking up ticket: {ticketLookupError instanceof Error ? ticketLookupError.message : 'Unknown error'}
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