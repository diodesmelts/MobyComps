import { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCompetitionSchema, updateCompetitionSchema, competitionStatusEnum, insertSiteConfigSchema } from "@shared/schema";
import { ticketService } from "../services/ticket-service";
import { drawService } from "../services/draw-service";

// Middleware to ensure the user is an admin
function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  }
  
  next();
}

export function registerAdminRoutes(app: Express) {
  // Admin dashboard stats - Register both endpoints for backward compatibility
  // This handler will serve both /api/admin/dashboard and /api/admin/stats
  const dashboardStatsHandler = async (req, res) => {
    try {
      // Get competitions
      const { competitions: allCompetitions } = await storage.listCompetitions();
      
      // Get users
      const { users: allUsers, total: totalUsers } = await storage.listUsers();
      
      // Calculate stats
      const activeCompetitions = allCompetitions.filter(c => c.status === 'live').length;
      const completedCompetitions = allCompetitions.filter(c => c.status === 'completed').length;
      
      // Calculate total revenue
      const totalRevenue = allCompetitions.reduce((acc, comp) => {
        return acc + (comp.ticketsSold * comp.ticketPrice);
      }, 0);
      
      // Simplified stats for now
      const stats = {
        totalRevenue,
        revenueChangePercent: 0, // Would need historical data
        activeUsers: totalUsers,
        newUsersThisWeek: 0, // Would need registration date tracking
        activeCompetitions,
        completedCompetitions,
        ticketsSold: allCompetitions.reduce((acc, comp) => acc + comp.ticketsSold, 0),
        ticketSoldToday: 0, // Would need timestamps on entries
        revenueByCategory: [], // Would need more data processing
        salesTrend: [], // Would need time series data
        recentActivity: [] // Would need activity logs
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Register the same handler for both endpoints
  app.get("/api/admin/dashboard", isAdmin, dashboardStatsHandler);
  app.get("/api/admin/stats", isAdmin, dashboardStatsHandler);

  // CRUD for competitions (admin only)
  // Get all competitions (admin only)
  app.get("/api/admin/competitions", isAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string | undefined;
      
      // Debug
      console.log("Admin competitions request:", { page, limit, status });
      
      // For debugging, directly fetch all competitions without filters
      const result = await storage.listCompetitions();
      
      console.log("Found competitions:", result.competitions.length, result.competitions.map(c => ({ id: c.id, title: c.title })));
      
      res.json({
        competitions: result.competitions,
        total: result.total
      });
    } catch (error: any) {
      console.error("Error fetching admin competitions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/competitions", isAdmin, async (req, res) => {
    try {
      console.log("Creating competition with data:", req.body);
      
      // No need to pre-process dates anymore since the schema will handle it
      
      // Special handling for Zod validation
      let competitionData;
      try {
        competitionData = insertCompetitionSchema.parse(req.body);
        console.log("Validated data:", competitionData);
      } catch (zodError: any) {
        console.error("Validation error:", zodError);
        return res.status(400).json({ error: JSON.stringify(zodError.errors, null, 2) });
      }
      
      const competition = await storage.createCompetition(competitionData);
      console.log("Competition created:", competition);
      
      // Create tickets for the competition
      try {
        console.log("Initializing tickets for competition:", competition.id, "maxTickets:", competition.maxTickets);
        await ticketService.initializeTickets(competition.id, competition.maxTickets);
        console.log("Tickets created successfully");
      } catch (ticketError) {
        console.error("Error creating tickets:", ticketError);
        // We don't want to fail the competition creation if tickets fail,
        // but we'll log the error
      }
      
      res.status(201).json(competition);
    } catch (error: any) {
      console.error("Error creating competition:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate status if provided
      if (req.body.status && !competitionStatusEnum.enumValues.includes(req.body.status)) {
        return res.status(400).json({ error: "Invalid competition status" });
      }
      
      // Use the updateCompetitionSchema to handle the data transformation
      const competitionData = updateCompetitionSchema.parse(req.body);
      
      const competition = await storage.updateCompetition(id, competitionData);
      res.json(competition);
    } catch (error: any) {
      console.error("Error updating competition:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Add PATCH endpoint for competition updates
  app.patch("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log("Updating competition data:", req.body);
      
      // Validate status if provided
      if (req.body.status && !competitionStatusEnum.enumValues.includes(req.body.status)) {
        return res.status(400).json({ error: "Invalid competition status" });
      }
      
      // Use the updateCompetitionSchema to handle the data transformation
      const competitionData = updateCompetitionSchema.parse(req.body);
      
      console.log("Validated update data:", competitionData);
      
      const competition = await storage.updateCompetition(id, competitionData);
      console.log("Competition updated:", competition);
      res.json(competition);
    } catch (error: any) {
      console.error("Error updating competition:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Add DELETE endpoint for competitions
  app.delete("/api/admin/competitions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Check if competition exists
      const competition = await storage.getCompetition(id);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      // In a real application, we'd need to check if it's safe to delete
      // e.g., no active tickets or entries that reference this competition
      
      // For now, we'll just mark it as cancelled
      await storage.updateCompetition(id, { status: 'cancelled' });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User management
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const { users, total } = await storage.listUsers(page, limit);
      res.json({
        users,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Site configuration management
  app.get("/api/admin/site-config/:key", isAdmin, async (req, res) => {
    try {
      const config = await storage.getSiteConfig(req.params.key);
      res.json(config || { key: req.params.key, value: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/site-config/:key", isAdmin, async (req, res) => {
    try {
      const config = await storage.updateSiteConfig(
        req.params.key,
        req.body.value,
        req.user.id
      );
      
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Add POST endpoint for backward compatibility
  app.post("/api/admin/site-config/:key", isAdmin, async (req, res) => {
    try {
      const config = await storage.updateSiteConfig(
        req.params.key,
        req.body.value,
        req.user.id
      );
      
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // New ticket sales endpoint
  app.get("/api/admin/competitions/:id/ticket-sales", isAdmin, async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      
      // Get the competition
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      // Get all tickets for the competition
      const tickets = await storage.listTickets(competitionId);
      
      // Calculate ticket statistics
      const ticketStats = {
        total: competition.maxTickets,
        available: tickets.filter(t => t.status === 'available').length,
        reserved: tickets.filter(t => t.status === 'reserved').length,
        purchased: tickets.filter(t => t.status === 'purchased').length,
        revenue: competition.ticketsSold * competition.ticketPrice,
        percentageSold: (competition.ticketsSold / competition.maxTickets) * 100
      };
      
      res.json({
        competition,
        ticketStats
      });
    } catch (error: any) {
      console.error("Error fetching ticket sales:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint to get all ticket sales
  app.get("/api/admin/ticket-sales", isAdmin, async (req, res) => {
    try {
      // Get all competitions
      const { competitions } = await storage.listCompetitions();
      
      // Process each competition to get ticket statistics
      const competitionSalesData = await Promise.all(
        competitions.map(async (competition) => {
          const tickets = await storage.listTickets(competition.id);
          
          return {
            id: competition.id,
            title: competition.title,
            status: competition.status,
            maxTickets: competition.maxTickets,
            ticketsSold: competition.ticketsSold,
            ticketPrice: competition.ticketPrice,
            revenue: competition.ticketsSold * competition.ticketPrice,
            percentageSold: (competition.ticketsSold / competition.maxTickets) * 100,
            available: tickets.filter(t => t.status === 'available').length,
            reserved: tickets.filter(t => t.status === 'reserved').length,
            purchased: tickets.filter(t => t.status === 'purchased').length,
            drawDate: competition.drawDate
          };
        })
      );
      
      res.json(competitionSalesData);
    } catch (error: any) {
      console.error("Error fetching all ticket sales:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint to look up winning tickets
  app.get("/api/admin/winning-ticket-lookup", isAdmin, async (req, res) => {
    try {
      const ticketNumber = req.query.ticketNumber ? parseInt(req.query.ticketNumber as string) : undefined;
      const competitionId = req.query.competitionId ? parseInt(req.query.competitionId as string) : undefined;
      
      if (!ticketNumber || !competitionId) {
        return res.status(400).json({ error: "Ticket number and competition ID are required" });
      }
      
      // Find the ticket in the competition
      const ticket = await storage.getTicket(competitionId, ticketNumber);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      // Get the competition
      const competition = await storage.getCompetition(competitionId);
      
      // Get the user who owns the ticket (if purchased)
      let user = null;
      if (ticket.status === 'purchased' && ticket.userId) {
        user = await storage.getUser(ticket.userId);
      }
      
      res.json({
        competition,
        ticket,
        user
      });
    } catch (error: any) {
      console.error("Error looking up winning ticket:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint to trigger a draw for a competition (for testing)
  app.post("/api/admin/competitions/:id/draw", isAdmin, async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      
      // Get the competition
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      if (competition.status !== 'live') {
        return res.status(400).json({ error: "Competition is not live" });
      }
      
      // Force draw the competition
      const result = await drawService.performDraw(competitionId);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error performing draw:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // New endpoint to lookup winner by ticket number
  app.get("/api/admin/lookup-winner", isAdmin, async (req, res) => {
    try {
      const ticketNumber = req.query.ticketNumber ? parseInt(req.query.ticketNumber as string) : undefined;
      const competitionId = req.query.competitionId ? parseInt(req.query.competitionId as string) : undefined;
      
      if (!ticketNumber || !competitionId) {
        return res.status(400).json({ error: "Ticket number and competition ID are required" });
      }
      
      console.log(`🔍 Looking up winner for competition ID: ${competitionId}, ticket number: ${ticketNumber}`);
      
      // First check if the ticket exists and is purchased
      const ticket = await storage.getTicket(competitionId, ticketNumber);
      
      if (!ticket) {
        return res.status(404).json({ 
          error: "Ticket not found", 
          message: `Ticket number ${ticketNumber} not found for competition ID ${competitionId}` 
        });
      }
      
      console.log(`✅ Found ticket:`, ticket);
      
      if (ticket.status !== 'purchased') {
        return res.status(400).json({ 
          error: "Ticket not purchased", 
          message: `Ticket number ${ticketNumber} exists but has not been purchased. Current status: ${ticket.status}`,
          ticket
        });
      }
      
      // Get the competition details
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      // Find the entry containing this ticket
      // First approach: If the ticket has a userId, get the user directly
      let user = null;
      let entry = null;
      
      if (ticket.userId) {
        user = await storage.getUser(ticket.userId);
        console.log(`✅ Found user from ticket:`, user);
      }
      
      // If user not found through ticket directly, try to find through entries
      if (!user) {
        console.log(`🔍 Searching for entry with ticket ${ticketNumber}...`);
        
        // Get all entries for this competition
        const entries = await storage.getCompetitionEntries(competitionId);
        console.log(`✅ Found ${entries.length} entries for competition ${competitionId}`);
        
        // Find the entry that contains this ticket number
        entry = entries.find(entry => {
          const ticketIds = entry.ticketIds.split(',').map(id => parseInt(id.trim()));
          return ticketIds.includes(ticketNumber);
        });
        
        console.log(`${entry ? '✅ Found' : '❌ Could not find'} entry with ticket ${ticketNumber}`);
        
        // If we found an entry, get the user
        if (entry && entry.userId) {
          user = await storage.getUser(entry.userId);
          console.log(`✅ Found user from entry:`, user);
        }
      }
      
      // Return the result
      res.json({
        competition: {
          id: competition.id,
          title: competition.title,
          status: competition.status,
          drawDate: competition.drawDate,
          ticketPrice: competition.ticketPrice
        },
        ticket: {
          number: ticket.number,
          status: ticket.status,
          purchasedAt: ticket.purchasedAt
        },
        entry: entry ? {
          id: entry.id,
          ticketIds: entry.ticketIds,
          createdAt: entry.createdAt,
          stripePaymentId: entry.stripePaymentId
        } : null,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || null
        } : null
      });
    } catch (error: any) {
      console.error("❌ Error looking up winner:", error);
      res.status(500).json({ error: error.message });
    }
  });
}