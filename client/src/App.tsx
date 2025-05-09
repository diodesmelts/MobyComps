import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { CartProvider } from "./contexts/cart-provider";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "@/pages/home-page";
import CompetitionsPage from "@/pages/competitions-page";
import CompetitionDetail from "@/pages/competition-detail";
import HowToPlayPage from "@/pages/how-to-play";
import AboutUsPage from "@/pages/about-us";
import FAQsPage from "@/pages/faqs";
import MyEntriesPage from "@/pages/my-entries";
import MyWinsPage from "@/pages/my-wins";
import AuthPage from "@/pages/auth-page";
import CheckoutPage from "@/pages/checkout-page";
import CartPage from "@/pages/cart-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import NotFound from "@/pages/not-found";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCompetitions from "@/pages/admin/competitions";
import AdminUsers from "@/pages/admin/users";
import AdminSiteConfig from "@/pages/admin/site-config";
import AdminSiteContent from "@/pages/admin/site-content";
import AdminTicketSales from "@/pages/admin/ticket-sales";
import AdminTicketSalesDetail from "@/pages/admin/ticket-sales-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/competitions" component={CompetitionsPage} />
      <Route path="/competition/:id" component={CompetitionDetail} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/how-to-play" component={HowToPlayPage} />
      <Route path="/about-us" component={AboutUsPage} />
      <Route path="/faqs" component={FAQsPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes - require login */}
      <ProtectedRoute path="/my-entries" component={MyEntriesPage} />
      <ProtectedRoute path="/my-wins" component={MyWinsPage} />
      
      {/* Admin routes - require admin role */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/competitions" component={AdminCompetitions} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/site-config" component={AdminSiteConfig} />
      <ProtectedRoute path="/admin/site-content" component={AdminSiteContent} />
      <ProtectedRoute path="/admin/ticket-sales" component={AdminTicketSales} />
      <ProtectedRoute path="/admin/ticket-sales/:id" component={AdminTicketSalesDetail} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
