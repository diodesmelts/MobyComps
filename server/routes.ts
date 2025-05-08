import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerCompetitionRoutes } from "./routes/competitions";
import { registerTicketRoutes } from "./routes/tickets";
import { registerAdminRoutes } from "./routes/admin";
import { registerUploadRoutes } from "./routes/uploads";
import { registerCartRoutes } from "./routes/cart";
import { registerSiteConfigRoutes } from "./routes/site-config";
import { stripeService } from "./services/StripeService";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register API routes
  registerCompetitionRoutes(app);
  registerTicketRoutes(app);
  registerAdminRoutes(app);
  registerUploadRoutes(app);
  registerCartRoutes(app);
  registerSiteConfigRoutes(app);
  
  // User entry endpoints
  app.get("/api/user/entries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const entries = await storage.getUserEntries(userId);
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching user entries:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/user/wins", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const entries = await storage.getUserWinningEntries(userId);
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching user wins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Backward compatibility for existing client code
  app.get("/api/my-entries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const entries = await storage.getUserEntries(userId);
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching user entries:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/my-wins", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const entries = await storage.getUserWinningEntries(userId);
      
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching user wins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Get cart items to calculate the total amount
      const sessionId = req.sessionID;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ 
          error: "Cart is empty" 
        });
      }
      
      // Calculate total amount from cart items
      let totalAmount = 0;
      for (const item of cartItems) {
        const competition = await storage.getCompetition(item.competitionId);
        if (!competition) continue;
        
        const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
        totalAmount += ticketCount * competition.ticketPrice;
      }
      
      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(totalAmount);
      
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create payment intent" 
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
