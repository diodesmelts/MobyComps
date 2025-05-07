import { Switch, Route } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import CompetitionsPage from "@/pages/CompetitionsPage";
import CompetitionDetailPage from "@/pages/CompetitionDetailPage";
import HowToPlayPage from "@/pages/HowToPlayPage";
import AboutUsPage from "@/pages/AboutUsPage";
import FaqsPage from "@/pages/FaqsPage";
import MyEntriesPage from "@/pages/MyEntriesPage";
import MyWinsPage from "@/pages/MyWinsPage";
import CartPage from "@/pages/CartPage";
import AuthPage from "@/pages/AuthPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import ManageCompetitions from "@/pages/admin/ManageCompetitions";
import ManageUsers from "@/pages/admin/ManageUsers";
import SiteConfig from "@/pages/admin/SiteConfig";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TopBanner from "@/components/layout/TopBanner";

function App() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  return (
    <>
      <TopBanner />
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/competitions" component={CompetitionsPage} />
          <Route path="/competition/:id" component={CompetitionDetailPage} />
          <Route path="/how-to-play" component={HowToPlayPage} />
          <Route path="/about" component={AboutUsPage} />
          <Route path="/faqs" component={FaqsPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/cart" component={CartPage} />
          
          <ProtectedRoute path="/my-entries" component={MyEntriesPage} />
          <ProtectedRoute path="/my-wins" component={MyWinsPage} />
          
          {isAdmin && (
            <>
              <ProtectedRoute path="/admin" component={AdminDashboard} />
              <ProtectedRoute path="/admin/competitions" component={ManageCompetitions} />
              <ProtectedRoute path="/admin/users" component={ManageUsers} />
              <ProtectedRoute path="/admin/config" component={SiteConfig} />
            </>
          )}
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

export default App;
