import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ticketService } from "./services/TicketService";
import { stripeService } from "./services/StripeService";
import { drawService } from "./services/DrawService";
import { cloudinaryService } from "./services/CloudinaryService";
import { validateQuizAnswer } from "./utils/quiz-validator";
import multer from "multer";
import { z } from "zod";
import { 
  insertCompetitionSchema,
  insertCartItemSchema
} from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { isAuthenticated, isAdmin } = setupAuth(app);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Public API routes
  
  // Competitions
  app.get("/api/competitions", async (req, res) => {
    try {
      const { category } = req.query;
      let competitions;
      
      if (category && typeof category === 'string') {
        competitions = await storage.getCompetitionsByCategory(category);
      } else {
        competitions = await storage.getAllLiveCompetitions();
      }
      
      res.json(competitions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/competitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competition = await storage.getCompetitionById(id);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.json(competition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Site configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tickets
  app.get("/api/tickets/:competitionId/available", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const availableTickets = await ticketService.getAvailableTickets(competitionId);
      res.json(availableTickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets/:competitionId/reserve", isAuthenticated, async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const userId = req.user!.id;
      const { ticketNumbers, quizAnswer } = req.body;

      // Validate quiz answer
      const competition = await storage.getCompetitionById(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      const isAnswerCorrect = validateQuizAnswer(quizAnswer, competition.quizCorrectAnswer);
      if (!isAnswerCorrect) {
        return res.status(400).json({ message: "Incorrect quiz answer" });
      }

      // Reserve tickets
      const reservation = await ticketService.reserveTickets(competitionId, userId, ticketNumbers);
      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets/:competitionId/release", isAuthenticated, async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const userId = req.user!.id;
      const { ticketNumbers } = req.body;

      await ticketService.releaseTickets(competitionId, userId, ticketNumbers);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cart
  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const cart = await storage.getUserCart(userId);
      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart/add", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { competitionId, ticketNumbers } = req.body;
      
      // Validate request
      const validatedData = insertCartItemSchema.parse({
        userId,
        competitionId,
        ticketIds: ticketNumbers,
      });

      // Create cart item
      const cartItem = await storage.addToCart(validatedData);
      
      // Convert reserved tickets to purchased
      await ticketService.updateTicketsStatus(competitionId, ticketNumbers, userId, "reserved");
      
      res.status(201).json(cartItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:cartItemId", isAuthenticated, async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.cartItemId);
      const userId = req.user!.id;

      // Get cart item to release tickets
      const cartItem = await storage.getCartItemById(cartItemId);
      if (!cartItem || cartItem.userId !== userId) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      // Release tickets
      await ticketService.releaseTickets(cartItem.competitionId, userId, cartItem.ticketIds);

      // Remove from cart
      await storage.removeFromCart(cartItemId, userId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user's cart items
      const cart = await storage.getUserCart(userId);
      
      // Release all tickets in the cart
      for (const item of cart.items || []) {
        await ticketService.releaseTickets(item.competitionId, userId, item.ticketIds);
      }
      
      // Clear the cart
      await storage.clearCart(userId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Payment
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(amount);
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/complete-purchase", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { paymentIntentId } = req.body;

      // Verify the payment intent
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Get user's cart
      const cart = await storage.getUserCart(userId);
      
      // Create entries for each cart item
      const entries = [];
      for (const item of cart.items || []) {
        // Update ticket status to purchased
        await ticketService.updateTicketsStatus(
          item.competitionId, 
          item.ticketIds, 
          userId, 
          "purchased"
        );
        
        // Create entry
        const entry = await storage.createEntry({
          userId,
          competitionId: item.competitionId,
          ticketNumbers: item.ticketIds,
          isWinner: false,
          stripePaymentId: paymentIntentId,
        });
        
        entries.push(entry);
        
        // Update competition sold tickets count
        await storage.incrementCompetitionSoldTickets(item.competitionId, item.ticketIds.length);
      }
      
      // Clear the cart
      await storage.clearCart(userId);
      
      res.json({ success: true, entries });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User entries and wins
  app.get("/api/user/entries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const entries = await storage.getUserEntries(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/wins", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const wins = await storage.getUserWins(userId);
      res.json(wins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  
  // Admin dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin competitions
  app.get("/api/admin/competitions", isAdmin, async (req, res) => {
    try {
      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/competitions", isAdmin, upload.single("image"), async (req, res) => {
    try {
      let imageUrl = req.body.imageUrl;
      
      // Upload image if provided
      if (req.file) {
        const uploadResult = await cloudinaryService.uploadImage(req.file);
        imageUrl = uploadResult.secure_url;
      }

      // Validate and create competition
      const competitionData = {
        ...req.body,
        imageUrl,
        ticketPrice: parseFloat(req.body.ticketPrice),
        maxTickets: parseInt(req.body.maxTickets),
        cashAlternative: req.body.cashAlternative ? parseFloat(req.body.cashAlternative) : undefined,
        drawDate: new Date(req.body.drawDate),
        quizAnswers: JSON.parse(req.body.quizAnswers),
        isLive: req.body.isLive === "true",
        isFeatured: req.body.isFeatured === "true",
        categoryId: parseInt(req.body.categoryId),
      };

      const validatedData = insertCompetitionSchema.parse(competitionData);
      const competition = await storage.createCompetition(validatedData);
      
      // Create tickets for the competition
      await ticketService.createCompetitionTickets(competition.id, competition.maxTickets);
      
      res.status(201).json(competition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/competitions/:id", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let imageUrl = req.body.imageUrl;
      
      // Upload image if provided
      if (req.file) {
        const uploadResult = await cloudinaryService.uploadImage(req.file);
        imageUrl = uploadResult.secure_url;
      }

      // Get existing competition
      const existingCompetition = await storage.getCompetitionById(id);
      if (!existingCompetition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Prepare update data
      const updateData = {
        ...req.body,
        imageUrl: imageUrl || existingCompetition.imageUrl,
        ticketPrice: req.body.ticketPrice ? parseFloat(req.body.ticketPrice) : existingCompetition.ticketPrice,
        maxTickets: req.body.maxTickets ? parseInt(req.body.maxTickets) : existingCompetition.maxTickets,
        cashAlternative: req.body.cashAlternative ? parseFloat(req.body.cashAlternative) : existingCompetition.cashAlternative,
        drawDate: req.body.drawDate ? new Date(req.body.drawDate) : existingCompetition.drawDate,
        quizAnswers: req.body.quizAnswers ? JSON.parse(req.body.quizAnswers) : existingCompetition.quizAnswers,
        isLive: req.body.isLive !== undefined ? req.body.isLive === "true" : existingCompetition.isLive,
        isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured === "true" : existingCompetition.isFeatured,
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : existingCompetition.categoryId,
      };

      // Update competition
      const competition = await storage.updateCompetition(id, updateData);
      
      // If maxTickets increased, create additional tickets
      if (updateData.maxTickets > existingCompetition.maxTickets) {
        const additionalTickets = updateData.maxTickets - existingCompetition.maxTickets;
        await ticketService.createAdditionalTickets(id, existingCompetition.maxTickets, additionalTickets);
      }
      
      res.json(competition);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompetition(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      
      const users = await storage.getUsers(page, limit, search);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isAdmin: isUserAdmin, isActive } = req.body;
      
      const user = await storage.updateUser(id, {
        isAdmin: isUserAdmin,
        isActive,
      });
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin site configuration
  app.get("/api/admin/config", async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/config", isAdmin, upload.single("heroBanner"), async (req, res) => {
    try {
      let heroBannerUrl = req.body.heroBannerUrl;
      
      // Upload hero banner if provided
      if (req.file) {
        const uploadResult = await cloudinaryService.uploadImage(req.file);
        heroBannerUrl = uploadResult.secure_url;
      }

      // Parse and validate the data
      const configData = {
        heroBanner: heroBannerUrl,
        marketingBanner: req.body.marketingBanner,
        footerText: req.body.footerText,
      };

      const config = await storage.updateSiteConfig(configData);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin image upload endpoint
  app.post("/api/admin/upload", isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const result = await cloudinaryService.uploadImage(req.file);
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Draw execution endpoint (could be triggered by a cron job)
  app.post("/api/admin/execute-draw/:competitionId", isAdmin, async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Execute the draw
      const result = await drawService.executeDraw(competitionId);
      
      if (result.success) {
        res.json({
          success: true,
          winner: result.winner,
          winningTicket: result.winningTicket,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
