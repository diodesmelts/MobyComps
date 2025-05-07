import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Loader2, TrendingUp, Users, Gift, Ticket } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: adminApi.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="w-full h-60 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load dashboard statistics
      </div>
    );
  }

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: `${stats.revenueChangePercent}% from last month`,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: stats.revenueChangePercent >= 0 ? "positive" : "negative",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      description: `${stats.newUsersThisWeek} new this week`,
      icon: <Users className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      title: "Active Competitions",
      value: stats.activeCompetitions.toString(),
      description: `${stats.completedCompetitions} completed this month`,
      icon: <Gift className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      title: "Tickets Sold",
      value: stats.ticketsSold.toLocaleString(),
      description: `${stats.ticketSoldToday} sold today`,
      icon: <Ticket className="h-4 w-4" />,
      trend: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs flex items-center mt-1 ${
                card.trend === 'positive' 
                  ? 'text-green-500' 
                  : card.trend === 'negative' 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
              }`}>
                {card.icon}
                <span className="ml-1">{card.description}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>
              Breakdown of revenue across different competition categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `£${value}`} />
                  <Tooltip formatter={(value) => [`£${value}`, "Revenue"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>
              Ticket sales over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Tickets"]} />
                  <Line 
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="hsl(var(--primary))" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest platform activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <li key={index} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
