import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAdminStats } from "@/hooks/use-admin";
import { Link } from "wouter";
import { formatPrice, formatDate } from "@/lib/utils";
import { Users, ShoppingBag, Calendar, CheckCircle, TrendingUp, Package, AlertCircle, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [period, setPeriod] = useState("week");
  const { data: stats, isLoading, error } = useAdminStats();
  
  // Generate color scale for chart based on theme colors
  const chartColors = {
    primary: "hsl(var(--chart-1))",
    secondary: "hsl(var(--chart-2))",
    third: "hsl(var(--chart-3))",
    fourth: "hsl(var(--chart-4))",
    fifth: "hsl(var(--chart-5))",
  };
  
  // Format date for chart tooltip
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', 
      month: 'short'
    }).format(date);
  };
  
  // Format currency for chart tooltip
  const formatChartValue = (value: number) => {
    return formatPrice(value);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#002D5C] mb-4" />
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-red-700">Error Loading Dashboard</h3>
                  <p className="text-red-600 mt-1">
                    {error instanceof Error ? error.message : "Failed to load dashboard data. Please try again."}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-[#002D5C]">Admin Dashboard</h1>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button asChild variant="outline" size="sm" className="border-[#002D5C] text-[#002D5C]">
                <Link href="/admin/competitions">Competitions</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[#002D5C] text-[#002D5C]">
                <Link href="/admin/users">Users</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[#002D5C] text-[#002D5C]">
                <Link href="/admin/site-config">Config</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[#002D5C] text-[#002D5C]">
                <Link href="/admin/site-content">Site Content</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002D5C] ml-auto md:ml-0">
                <Link href="/admin/competitions?new=true">Create Competition</Link>
              </Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalUsers || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">+{Math.floor((stats.totalUsers || 0) * 0.05)} in the last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((stats.activeCompetitions || 0) + (stats.completedCompetitions || 0)).toLocaleString()}</div>
                <div className="flex items-center text-xs mt-1">
                  <div className="text-green-500 flex items-center">
                    <span className="mr-1">{stats.activeCompetitions || 0}</span>
                    <span>active</span>
                  </div>
                  <span className="mx-1">•</span>
                  <div className="text-gray-500 flex items-center">
                    <span className="mr-1">{stats.completedCompetitions || 0}</span>
                    <span>completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                <ShoppingBag className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalTicketsSold || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPrice((stats.totalTicketsSold || 0) * 1.1)} total value
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Draw</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.recentCompetitions && stats.recentCompetitions[0] 
                    ? formatDate(stats.recentCompetitions[0].drawDate || new Date())
                    : "No draws scheduled"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.recentCompetitions && stats.recentCompetitions[0]
                    ? stats.recentCompetitions[0].title
                    : "Create a new competition"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Sales Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales Overview</CardTitle>
                  <Tabs defaultValue="week" value={period} onValueChange={setPeriod} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>Total revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.salesData || []}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `£${value}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={formatChartValue}
                        labelFormatter={formatChartDate}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={chartColors.primary}
                        fill={chartColors.secondary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats.recentUsers || []).slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium mr-3">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.username || 'User'} joined</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt || new Date()).toLocaleDateString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(stats.recentCompetitions || []).slice(0, 2).map((comp, index) => (
                    <div key={`comp-${index}`} className="flex items-start">
                      <div className="w-9 h-9 rounded-full bg-[#8EE000]/20 flex items-center justify-center text-[#002D5C] mr-3">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New competition created</p>
                        <p className="text-xs text-gray-900">{comp.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comp.createdAt).toLocaleDateString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Button asChild variant="link" className="text-sm">
                    <Link href="/admin/users">View All Activity</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Competitions */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Competitions</CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/competitions">View All</Link>
                  </Button>
                </div>
                <CardDescription>Overview of recently created competitions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="py-3 px-4 font-medium">Competition</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Tickets Sold</th>
                        <th className="py-3 px-4 font-medium">Draw Date</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(stats.recentCompetitions || []).map((competition) => (
                        <tr key={competition.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 mr-3">
                                <img 
                                  src={competition.imageUrl} 
                                  alt={competition.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{competition.title}</p>
                                <p className="text-xs text-gray-500">{formatPrice(competition.ticketPrice)} per ticket</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${competition.status === 'live' ? 'bg-green-100 text-green-800' : 
                                competition.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`
                            }>
                              {competition.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <span className="text-sm">{competition.ticketsSold} / {competition.maxTickets}</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2 ml-2">
                                <div 
                                  className="bg-[#8EE000] rounded-full h-2" 
                                  style={{ width: `${(competition.ticketsSold / competition.maxTickets) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatDate(competition.drawDate)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/competitions?edit=${competition.id}`}>Edit</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
