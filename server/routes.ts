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
import { db } from "./db";
import { tickets, entries, users } from "@shared/schema";
import { eq, inArray, desc, and, sql } from "drizzle-orm";

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
      console.log("🔍 STEP 5 - GET /api/user/entries called");
      
      if (!req.isAuthenticated()) {
        console.log("🔍 STEP 5 - User not authenticated");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      console.log(`🔍 STEP 5 - Fetching entries for user ID: ${userId} (${typeof userId})`);
      
      if (!userId) {
        console.error("❌ Invalid user ID:", userId);
        return res.json([]);  // Return empty array
      }
      
      try {
        // First check if there are any entries in the database
        const countQuery = `SELECT COUNT(*) FROM entries`;
        const countResult = await db.execute(countQuery);
        console.log(`🔍 STEP 5 - Total entries in database: ${countResult.rows[0].count}`);
        
        // Check if the entries table exists and has the right columns
        try {
          const tableCheck = await db.execute(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'entries' ORDER BY ordinal_position
          `);
          console.log(`🔍 STEP 5 - Entries table columns:`, tableCheck.rows.map(r => r.column_name));
        } catch (e) {
          console.error(`❌ STEP 5 - Error checking entries table:`, e);
        }
        
        // Use direct integer in the query to avoid parameter binding issues
        console.log(`🔍 STEP 5 - Executing query with direct userId: ${userId}`);
        const result = await db.execute(
          `SELECT e.*, c.title as competition_title, c.image_url as competition_image_url 
           FROM entries e 
           JOIN competitions c ON e.competition_id = c.id 
           WHERE e.user_id = ${parseInt(userId, 10)} 
           ORDER BY e.created_at DESC`
        );
        
        console.log(`✅ STEP 5 - Found ${result.rows.length} entries directly with SQL`);
        
        // Convert the raw SQL result to Entry objects with competition details
        const entries = result.rows.map(row => ({
          id: parseInt(row.id, 10),
          userId: parseInt(row.user_id, 10),
          competitionId: parseInt(row.competition_id, 10),
          ticketIds: row.ticket_ids,
          status: row.status,
          stripePaymentId: row.stripe_payment_id,
          createdAt: new Date(row.created_at),
          // Include competition details
          competition: {
            title: row.competition_title,
            imageUrl: row.competition_image_url
          }
        }));
        
        res.json(entries);
      } catch (dbError) {
        console.error("❌ STEP 5 - Database error in entries route:", dbError);
        // Send back empty array instead of error to avoid breaking the frontend
        res.json([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching user entries:", error);
      // Send back empty array instead of error to prevent frontend crash
      res.json([]);
    }
  });
  
  app.get("/api/user/wins", async (req, res) => {
    try {
      console.log("🔍 GET /api/user/wins called");
      
      if (!req.isAuthenticated()) {
        console.log("🔍 User not authenticated");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      console.log(`🔍 Fetching winning entries for user ID: ${userId}`);
      
      const entries = await storage.getUserWinningEntries(userId);
      console.log(`🔍 Found ${entries.length} winning entries:`, entries);
      
      res.json(entries);
    } catch (error: any) {
      console.error("❌ Error fetching user wins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Backward compatibility for existing client code
  app.get("/api/my-entries", async (req, res) => {
    try {
      console.log("🔍 STEP 5 - GET /api/my-entries called");
      
      if (!req.isAuthenticated()) {
        console.log("🔍 STEP 5 - User not authenticated");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      console.log(`🔍 STEP 5 - Fetching entries for user ID: ${userId}`);
      
      try {
        // Use direct integer in the query to avoid parameter binding issues
        console.log(`🔍 STEP 5 - Executing query with direct userId: ${userId}`);
        const result = await db.execute(
          `SELECT e.*, c.title as competition_title, c.image_url as competition_image_url 
           FROM entries e 
           JOIN competitions c ON e.competition_id = c.id 
           WHERE e.user_id = ${parseInt(userId, 10)} 
           ORDER BY e.created_at DESC`
        );
        
        console.log(`✅ STEP 5 - Found ${result.rows.length} entries directly with SQL`);
        
        // Convert the raw SQL result to Entry objects with competition details
        const entries = result.rows.map(row => ({
          id: parseInt(row.id, 10),
          userId: parseInt(row.user_id, 10),
          competitionId: parseInt(row.competition_id, 10),
          ticketIds: row.ticket_ids,
          status: row.status,
          stripePaymentId: row.stripe_payment_id,
          createdAt: new Date(row.created_at),
          // Include competition details
          competition: {
            title: row.competition_title,
            imageUrl: row.competition_image_url
          }
        }));
        
        res.json(entries);
      } catch (dbError) {
        console.error("❌ STEP 5 - Database error in my-entries route:", dbError);
        // Send back empty array instead of error
        res.json([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching user entries:", error);
      // Return empty array instead of error to prevent frontend crashes
      res.json([]);
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
      console.log("\n\n💳 =====================================");
      console.log("💳 === CREATING PAYMENT INTENT ===");
      console.log("💳 =====================================");
      
      // Get cart items to calculate the total amount
      const sessionId = req.sessionID;
      console.log(`💳 Session ID: ${sessionId}`);
      
      // Verify cookies for tracing issues
      console.log(`💳 Request cookies:`, req.headers.cookie);
      console.log(`💳 User authenticated:`, req.isAuthenticated());
      if (req.isAuthenticated()) {
        console.log(`💳 User info:`, req.user);
      }
      
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
      console.log("\n\n🚨 =============================================");
      console.log("🚨 ==== PROCESSING PAYMENT FLOW STARTING ====");
      console.log("🚨 =============================================");
      console.log("🚨 STEP 1 - Request received at /api/process-payment");
      console.log("🚨 STEP 1 - Request body:", req.body);
      
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        console.error("❌ STEP 1 - Error: Missing payment intent ID");
        return res.status(400).json({ error: "Missing payment intent ID" });
      }
      
      console.log(`🚨 STEP 1 - Processing payment intent: ${paymentIntentId}`);
      
      // Check authentication status
      console.log(`🚨 STEP 1 - User authentication status: ${req.isAuthenticated()}`);
      console.log(`🚨 STEP 1 - User info:`, req.user);
      
      if (!req.isAuthenticated()) {
        console.error("❌ STEP 1 - User not authenticated for payment processing");
        return res.status(401).json({ error: "You must be logged in to process payment" });
      }
      
      // Retrieve the payment intent from Stripe to verify it's successful
      console.log(`🚨 STEP 1 - Retrieving payment intent from Stripe...`);
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      console.log(`🚨 STEP 1 - Payment intent status: ${paymentIntent.status}`);
      console.log(`🚨 STEP 1 - Payment intent metadata:`, paymentIntent.metadata);
      
      if (paymentIntent.status !== 'succeeded') {
        console.error(`❌ STEP 1 - Payment intent ${paymentIntentId} has not succeeded. Status: ${paymentIntent.status}`);
        return res.status(400).json({ error: "Payment not successful" });
      }
      
      // Get the session ID from the metadata
      const sessionId = paymentIntent.metadata.sessionId;
      if (!sessionId) {
        console.error("❌ STEP 1 - No session ID found in payment intent metadata");
        return res.status(400).json({ error: "No session ID associated with this payment" });
      }
      
      console.log(`🚨 STEP 1 - Retrieved session ID from payment: ${sessionId}`);
      console.log(`🚨 STEP 1 - Current session ID:`, req.sessionID);
      
      // Get cart items for this session
      console.log(`\n🚨 STEP 2 - Fetching cart items for session ${sessionId}...`);
      const cartItems = await storage.getCartItems(sessionId);
      console.log(`🚨 STEP 2 - Retrieved ${cartItems.length} cart items for session:`, cartItems);
      
      if (cartItems.length === 0) {
        console.error("❌ STEP 2 - No cart items found for this session");
        return res.status(400).json({ error: "No items in cart to process" });
      }
      
      // Direct DB validation for cart items
      try {
        console.log(`🚨 STEP 2 - Verifying cart items with direct SQL...`);
        const cartQuery = `SELECT * FROM cart_items WHERE session_id = $1`;
        console.log(`🚨 STEP 2 - Executing SQL: "${cartQuery}" with params: ["${sessionId}"]`);
        const cartResults = await db.execute(cartQuery, [sessionId]);
        console.log(`🚨 STEP 2 - SQL cart verification found ${cartResults.rowCount} items:`, cartResults.rows);
      } catch (sqlError) {
        console.error(`❌ STEP 2 - SQL error in cart verification:`, sqlError);
        // Continue execution, this is just for debugging
      }
      
      // Process each cart item
      const userId = req.isAuthenticated() ? (req.user as any).id : null;
      if (!userId) {
        console.error("❌ STEP 2 - User not authenticated");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log(`\n🚨 STEP 3 - Processing purchase for user ID: ${userId}`);
      
      let entriesCreated = 0;
      let ticketsProcessed = 0;
      
      for (const item of cartItems) {
        try {
          const ticketNumbers = item.ticketNumbers.split(',').map(n => parseInt(n.trim()));
          
          console.log(`🚨 Processing tickets: ${JSON.stringify(ticketNumbers)} for competition ${item.competitionId}`);
          
          // Get the actual ticket records for these numbers
          console.log(`🚨 Fetching ticket records for competition ${item.competitionId}, numbers ${ticketNumbers}...`);
          const tickets = await storage.getTicketsByNumbers(item.competitionId, ticketNumbers);
          console.log(`🚨 Retrieved ${tickets.length} ticket records:`, tickets);
          
          if (tickets.length !== ticketNumbers.length) {
            console.warn(`⚠️ Warning: Expected ${ticketNumbers.length} tickets, but found ${tickets.length}`);
          }
          
          if (tickets.length === 0) {
            console.error(`❌ No tickets found for competition ${item.competitionId} with numbers ${ticketNumbers}`);
            continue;
          }
          
          // Mark tickets as purchased
          const ticketIds = tickets.map(ticket => ticket.id);
          console.log(`🚨 Marking tickets as purchased: ${JSON.stringify(ticketIds)}`);
          
          try {
            console.log(`🚨 Before purchaseTickets() - Checking current ticket status...`);
            // Direct DB query to check ticket status before update
            console.log(`🚨 STEP 3 - Before purchaseTickets() - User ID: ${userId}, Ticket IDs: ${JSON.stringify(ticketIds)}`);
            try {
              const queryBefore = `SELECT id, competition_id, status, user_id, number FROM tickets WHERE id = ANY($1)`;
              console.log(`🚨 STEP 3 - Executing SQL: "${queryBefore}" with ticket IDs: [${ticketIds}]`);
              const ticketsBefore = await db.execute(queryBefore, [ticketIds]);
              console.log(`🚨 STEP 3 - Current ticket status:`, ticketsBefore.rows);
            } catch (sqlError) {
              console.error(`❌ STEP 3 - SQL error checking tickets before:`, sqlError);
            }
            
            const updatedTickets = await storage.purchaseTickets(ticketIds, userId);
            console.log(`🚨 STEP 3 - Updated ${updatedTickets.length} tickets to purchased status:`, updatedTickets);
            
            console.log(`🚨 STEP 3 - After purchaseTickets() - Verifying ticket status update...`);
            try {
              // Direct DB query to check ticket status after update
              const queryAfter = `SELECT id, competition_id, status, user_id, number FROM tickets WHERE id = ANY($1)`;
              console.log(`🚨 STEP 3 - Executing SQL: "${queryAfter}" with ticket IDs: [${ticketIds}]`);
              const ticketsAfter = await db.execute(queryAfter, [ticketIds]);
              console.log(`🚨 STEP 3 - Updated ticket status:`, ticketsAfter.rows);
            } catch (sqlError) {
              console.error(`❌ STEP 3 - SQL error checking tickets after:`, sqlError);
            }
            
            ticketsProcessed += updatedTickets.length;
            
            // Create entry record in the database
            console.log(`🚨 STEP 4 - Creating entry record for user ${userId}, competition ${item.competitionId}...`);
            const entry = await storage.createEntry({
              userId: userId,
              competitionId: item.competitionId,
              ticketIds: ticketIds.join(','),
              status: 'active',
              stripePaymentId: paymentIntentId,
            });
            
            console.log(`🚨 STEP 4 - Created new entry:`, entry);
            
            // Verify entry was created
            console.log(`🚨 STEP 4 - Verifying entry creation...`);
            try {
              const entryQuery = `SELECT * FROM entries WHERE id = $1`;
              console.log(`🚨 STEP 4 - Executing SQL: "${entryQuery}" with entry ID: ${entry.id}`);
              const entryVerification = await db.execute(entryQuery, [entry.id]);
              console.log(`🚨 STEP 4 - Entry verification:`, entryVerification.rows);
            } catch (sqlError) {
              console.error(`❌ STEP 4 - SQL error verifying entry:`, sqlError);
            }
            
            entriesCreated++;
          } catch (dbError) {
            console.error(`❌ Database error during ticket processing:`, dbError);
            throw dbError;
          }
        } catch (itemError: any) {
          console.error(`❌ Error processing cart item ${item.id}:`, itemError);
          throw itemError; // Re-throw to catch at the outer level
        }
      }
      
      console.log(`\n🚨 STEP 5 - Payment processing complete! ${ticketsProcessed} tickets purchased, ${entriesCreated} entries created`);
      
      // Verify that entries exist for the user
      console.log(`🚨 STEP 5 - Verifying entries for user ${userId}...`);
      const userEntries = await storage.getUserEntries(userId);
      console.log(`🚨 STEP 5 - User entries after processing:`, userEntries);
      
      // Final response
      const result = {
        success: true,
        ticketsProcessed,
        entriesCreated,
        userEntries: userEntries.length,
        message: "Payment processed successfully"
      };
      
      console.log(`\n🚨 STEP 6 - Sending response:`, result);
      console.log("🚨 ==============================================");
      console.log("🚨 ==== PROCESSING PAYMENT FLOW COMPLETED ====");
      console.log("🚨 ==============================================");
      
      res.json(result);
    } catch (error: any) {
      console.error("❌ Error processing payment:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process payment",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Debug endpoint for testing entry creation directly
  app.post("/api/debug/create-test-entry", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      console.log(`🧪 DEBUG - Creating test entry for user ID: ${userId}`);
      
      // Create a test entry directly
      const testEntry = await storage.createEntry({
        userId: userId,
        competitionId: 1, // Assumes competition ID 1 exists
        ticketIds: "999", // Dummy ticket ID
        status: 'active',
        stripePaymentId: 'test_payment_123'
      });
      
      console.log(`🧪 DEBUG - Test entry created:`, testEntry);
      
      // Verify the entry was created
      const userEntries = await storage.getUserEntries(userId);
      console.log(`🧪 DEBUG - User entries after test:`, userEntries);
      
      // Return success
      res.json({ 
        success: true, 
        testEntry,
        allEntries: userEntries
      });
    } catch (error: any) {
      console.error("❌ DEBUG - Error creating test entry:", error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
