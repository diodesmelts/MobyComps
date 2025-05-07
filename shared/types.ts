import { User, Category, Ticket, Competition as DbCompetition, Entry, Win, CartItem } from "./schema";

// Extended types with additional client-side properties
export interface Competition extends DbCompetition {
  category?: Category;
}

export interface CartItemWithDetails extends CartItem {
  competition: Competition;
  tickets: Ticket[];
  totalPrice: number;
}

export interface EntryWithDetails extends Entry {
  competition: Competition;
}

export interface WinWithDetails extends Win {
  competition: Competition;
  entry: Entry;
}

// Admin dashboard statistics
export interface DashboardStats {
  totalRevenue: number;
  revenueChangePercent: number;
  activeUsers: number;
  newUsersThisWeek: number;
  activeCompetitions: number;
  completedCompetitions: number;
  ticketsSold: number;
  ticketSoldToday: number;
  revenueByCategory: { name: string; value: number }[];
  salesTrend: { date: string; tickets: number }[];
  recentActivity: {
    title: string;
    description: string;
    time: string;
  }[];
}

// Site configuration
export interface SiteConfigResponse {
  heroBanner: {
    imageUrl: string;
    title: string;
    subtitle: string;
  } | null;
  marketingBanner: {
    text: string;
    enabled: boolean;
  } | null;
  footerText: string | null;
}

// Ticket reservation response
export interface TicketReservationResponse {
  success: boolean;
  tickets: number[];
  expiresAt: string;
  timeLeftSeconds: number;
}

// Quiz validation
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Payment
export interface CreatePaymentIntentResponse {
  clientSecret: string;
}
