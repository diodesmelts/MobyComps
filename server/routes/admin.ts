import { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCompetitionSchema, updateCompetitionSchema, competitionStatusEnum, insertSiteConfigSchema } from "@shared/schema";
import { ticketService } from "../services/ticket-service";

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
      
      const result = await storage.listCompetitions({
        status,
        page,
        limit
      });
      
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
}