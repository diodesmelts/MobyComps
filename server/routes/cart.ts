import { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCartItemSchema } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

export function registerCartRoutes(app: Express) {
  // Get cart items
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const cartItems = await storage.getCartItems(sessionId);
      // Return items in a structured format to match what the frontend expects
      res.json({ items: cartItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add to cart
  app.post("/api/cart/add", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const { competitionId, ticketNumbers } = req.body;
      
      if (!competitionId || !ticketNumbers || !Array.isArray(ticketNumbers)) {
        return res.status(400).json({ error: "Invalid request data" });
      }
      
      // Get competition details for title and image
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      // Create expiration timestamp for 10 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      const cartItemData = {
        competitionId,
        competitionTitle: competition.title,
        competitionImageUrl: competition.imageUrl,
        ticketNumbers: ticketNumbers.join(','),
        sessionId,
        expiresAt // Pass the Date object directly
      };
      
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Remove from cart
  app.delete("/api/cart/remove/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear cart
  app.delete("/api/cart/clear", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      await storage.clearCart(sessionId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create payment intent for cart checkout
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of cartItems) {
        const competition = await storage.getCompetition(item.competitionId);
        if (!competition) {
          return res.status(400).json({ 
            error: `Competition with ID ${item.competitionId} not found` 
          });
        }
        // Calculate quantity from ticketNumbers string (comma-separated values)
        const ticketCount = item.ticketNumbers.split(',').length;
        totalAmount += competition.ticketPrice * ticketCount;
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          sessionId,
          cartItems: JSON.stringify(cartItems.map(item => ({
            competitionId: item.competitionId,
            ticketCount: item.ticketNumbers.split(',').length
          })))
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Process successful payment
  app.post("/api/process-payment", async (req, res) => {
    try {
      // This is a simplified version - in production, use Stripe webhooks
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }
      
      // Retrieve payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment has not been completed" });
      }
      
      const sessionId = paymentIntent.metadata.sessionId;
      const cartItemsData = JSON.parse(paymentIntent.metadata.cartItems || "[]");
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "User must be logged in to complete purchase" });
      }
      
      // Get user ID safely
      const userId = req.user ? (req.user as any).id : null;
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }
      
      const purchasedTickets: any[] = [];
      
      // Process each cart item
      for (const item of cartItemsData) {
        const { competitionId, ticketCount } = item;
        
        // Get available tickets
        const tickets = await storage.listTickets(competitionId, 'available');
        const ticketNumbers = tickets.slice(0, ticketCount).map(t => t.id);
        
        if (ticketNumbers.length < ticketCount) {
          return res.status(400).json({ 
            error: `Not enough tickets available for competition ${competitionId}` 
          });
        }
        
        // Purchase tickets
        const purchased = await storage.purchaseTickets(ticketNumbers, userId);
        purchasedTickets.push(...purchased);
        
        // Update competition tickets sold count
        await storage.incrementTicketsSold(competitionId, purchased.length);
        
        // Create entry
        await storage.createEntry({
          userId,
          competitionId,
          ticketIds: ticketNumbers.join(','),
          status: 'active'
        });
      }
      
      // Clear cart
      await storage.clearCart(sessionId);
      
      res.json({ 
        success: true, 
        message: "Payment processed successfully",
        purchasedTickets
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}