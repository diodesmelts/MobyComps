import { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCompetitionSchema, competitionStatusEnum, insertSiteConfigSchema } from "@shared/schema";

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
  app.post("/api/admin/competitions", isAdmin, async (req, res) => {
    try {
      const competitionData = insertCompetitionSchema.parse(req.body);
      const competition = await storage.createCompetition(competitionData);
      res.status(201).json(competition);
    } catch (error: any) {
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
      
      const competition = await storage.updateCompetition(id, req.body);
      res.json(competition);
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
      const { value } = insertSiteConfigSchema.parse({
        key: req.params.key,
        value: req.body.value,
        updatedBy: req.user.id
      });
      
      const config = await storage.updateSiteConfig(
        req.params.key,
        value,
        req.user.id
      );
      
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}