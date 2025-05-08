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
      console.log("💳 Creating payment intent...");
      
      // Get cart items to calculate the total amount
      const sessionId = req.sessionID;
      console.log(`💳 Session ID: ${sessionId}`);
      
      const cartItems = await storage.getCartItems(sessionId);
      console.log(`💳 Retrieved ${cartItems.length} cart items:`, cartItems);
      
      if (cartItems.length === 0) {
        console.log("❌ Error: Cart is empty");
        return res.status(400).json({ 
          error: "Cart is empty" 
        });
      }
      
      // Calculate total amount from cart items
      let totalAmount = 0;
      const cartItemsDetails = [];
      
      for (const item of cartItems) {
        const competition = await storage.getCompetition(item.competitionId);
        if (!competition) {
          console.warn(`⚠️ Competition not found for ID: ${item.competitionId}`);
          continue;
        }
        
        const ticketCount = item.ticketNumbers ? item.ticketNumbers.split(',').length : 0;
        const itemTotal = ticketCount * competition.ticketPrice;
        totalAmount += itemTotal;
        
        console.log(`💳 Item: ${competition.title}, Count: ${ticketCount}, Item Total: £${itemTotal}`);
        
        cartItemsDetails.push({
          competitionId: item.competitionId,
          competitionTitle: competition.title,
          ticketNumbers: item.ticketNumbers,
          ticketCount,
          price: competition.ticketPrice,
          total: itemTotal
        });
      }
      
      console.log(`💳 Total amount: £${totalAmount}`);
      
      // Create payment intent with metadata
      const paymentIntent = await stripeService.createPaymentIntent(
        totalAmount,
        {
          sessionId,
          cartItems: JSON.stringify(cartItemsDetails)
        }
      );
      
      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create payment intent" 
      });
    }
  });
  
  app.post("/api/process-payment", async (req, res) => {
    try {
      console.log("💰 Processing payment...");
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        console.error("❌ Error: Missing payment intent ID");
        return res.status(400).json({ error: "Missing payment intent ID" });
      }
      
      console.log(`💰 Processing payment intent: ${paymentIntentId}`);
      
      // Retrieve the payment intent from Stripe to verify it's successful
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      console.log(`💰 Payment intent status: ${paymentIntent.status}`);
      
      if (paymentIntent.status !== 'succeeded') {
        console.error(`❌ Payment intent ${paymentIntentId} has not succeeded. Status: ${paymentIntent.status}`);
        return res.status(400).json({ error: "Payment not successful" });
      }
      
      // Get the session ID from the metadata
      const sessionId = paymentIntent.metadata.sessionId;
      if (!sessionId) {
        console.error("❌ No session ID found in payment intent metadata");
        return res.status(400).json({ error: "No session ID associated with this payment" });
      }
      
      console.log(`💰 Retrieved session ID from payment: ${sessionId}`);
      
      // Get cart items for this session
      const cartItems = await storage.getCartItems(sessionId);
      console.log(`💰 Retrieved ${cartItems.length} cart items for session`);
      
      if (cartItems.length === 0) {
        console.error("❌ No cart items found for this session");
        return res.status(400).json({ error: "No items in cart to process" });
      }
      
      // Process each cart item
      const userId = req.isAuthenticated() ? (req.user as any).id : null;
      if (!userId) {
        console.error("❌ User not authenticated");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log(`💰 Processing purchase for user ID: ${userId}`);
      
      let entriesCreated = 0;
      let ticketsProcessed = 0;
      
      for (const item of cartItems) {
        try {
          const ticketNumbers = item.ticketNumbers.split(',').map(n => parseInt(n.trim()));
          
          console.log(`💰 Processing tickets: ${JSON.stringify(ticketNumbers)} for competition ${item.competitionId}`);
          
          // Get the actual ticket records for these numbers
          const tickets = await storage.getTicketsByNumbers(item.competitionId, ticketNumbers);
          console.log(`💰 Retrieved ${tickets.length} ticket records: ${JSON.stringify(tickets.map(t => ({ id: t.id, number: t.number })))}`);
          
          if (tickets.length !== ticketNumbers.length) {
            console.warn(`⚠️ Warning: Expected ${ticketNumbers.length} tickets, but found ${tickets.length}`);
          }
          
          if (tickets.length === 0) {
            console.error(`❌ No tickets found for competition ${item.competitionId} with numbers ${ticketNumbers}`);
            continue;
          }
          
          // Mark tickets as purchased
          const ticketIds = tickets.map(ticket => ticket.id);
          console.log(`💰 Marking tickets as purchased: ${JSON.stringify(ticketIds)}`);
          
          const updatedTickets = await storage.purchaseTickets(ticketIds, userId);
          console.log(`💰 Updated ${updatedTickets.length} tickets to purchased status: ${JSON.stringify(updatedTickets.map(t => ({ id: t.id, number: t.number, status: t.status })))}`);
          
          ticketsProcessed += updatedTickets.length;
          
          // Create entry record in the database
          const entry = await storage.createEntry({
            userId: userId,
            competitionId: item.competitionId,
            ticketIds: ticketIds.join(','),
            status: 'active',
            stripePaymentId: paymentIntentId,
          });
          
          console.log(`💰 Created new entry: ${JSON.stringify(entry)}`);
          entriesCreated++;
        } catch (itemError: any) {
          console.error(`❌ Error processing cart item ${item.id}:`, itemError);
        }
      }
      
      console.log(`💰 Payment processing complete! ${ticketsProcessed} tickets purchased, ${entriesCreated} entries created`);
      
      res.json({
        success: true,
        ticketsProcessed,
        entriesCreated,
        message: "Payment processed successfully"
      });
    } catch (error: any) {
      console.error("❌ Error processing payment:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process payment" 
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
