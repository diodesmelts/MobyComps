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

  // Endpoint to fix ticket status discrepancies
  app.post("/api/admin/fix-ticket-status", isAdmin, async (req, res) => {
    try {
      console.log(`⚙️ Admin requested to fix ticket status discrepancies`);
      
      // Find all entries to get the tickets that should be marked as purchased
      const queryResult = await storage.db.execute(`
        SELECT e.id, e.user_id, e.competition_id, e.ticket_ids, e.status, e.created_at
        FROM entries e 
        ORDER BY e.id ASC
      `);
      
      console.log(`⚙️ Found ${queryResult.rows.length} entries to check`);
      
      const fixResults = {
        entriesProcessed: 0,
        ticketsFixed: 0,
        errors: 0
      };
      
      // Process each entry
      for (const entry of queryResult.rows) {
        fixResults.entriesProcessed++;
        
        try {
          // Parse the ticket IDs from the entry
          let ticketIdentifiers: number[] = [];
          
          try {
            if (entry.ticket_ids === "999") {
              // Skip test entries with dummy ticket ID
              console.log(`⚙️ Skipping test entry #${entry.id} with dummy ticket ID 999`);
              continue;
            }
            
            ticketIdentifiers = entry.ticket_ids.split(',').map((id: string) => parseInt(id.trim()));
            
            if (ticketIdentifiers.some(isNaN)) {
              console.warn(`⚠️ Entry #${entry.id} has invalid ticket IDs: ${entry.ticket_ids}`);
              continue;
            }
          } catch (parseError) {
            console.error(`❌ Error parsing ticket IDs for entry #${entry.id}:`, parseError);
            fixResults.errors++;
            continue;
          }
          
          console.log(`⚙️ Processing entry #${entry.id} with tickets: ${ticketIdentifiers.join(',')}`);
          
          // First check if these are ticket IDs or ticket numbers
          const ticketsById = await storage.db.execute(
            `SELECT id, number, competition_id, status, user_id FROM tickets WHERE id = ANY($1)`,
            [ticketIdentifiers]
          );
          
          let ticketsToUpdate: any[] = [];
          
          if (ticketsById.rows.length === ticketIdentifiers.length) {
            // These are ticket IDs, use them directly
            ticketsToUpdate = ticketsById.rows;
            console.log(`⚙️ Found ${ticketsToUpdate.length} tickets by ID`);
          } else {
            // Try to find by ticket number instead
            const ticketsByNumber = await storage.db.execute(
              `SELECT id, number, competition_id, status, user_id 
               FROM tickets 
               WHERE competition_id = $1 AND number = ANY($2)`,
              [entry.competition_id, ticketIdentifiers]
            );
            
            ticketsToUpdate = ticketsByNumber.rows;
            console.log(`⚙️ Found ${ticketsToUpdate.length} tickets by number`);
          }
          
          // Filter out tickets that are already purchased
          const ticketsNeedingUpdate = ticketsToUpdate.filter((t: any) => t.status !== 'purchased');
          
          if (ticketsNeedingUpdate.length === 0) {
            console.log(`⚙️ All tickets for entry #${entry.id} are already marked as purchased`);
            continue;
          }
          
          console.log(`⚙️ Updating ${ticketsNeedingUpdate.length} tickets for entry #${entry.id}`);
          
          // Update tickets to purchased status
          const updateResult = await storage.db.execute(
            `UPDATE tickets 
             SET status = 'purchased', user_id = $1, purchased_at = $2 
             WHERE id = ANY($3) AND status != 'purchased'
             RETURNING id, number, status`,
            [entry.user_id, entry.created_at, ticketsNeedingUpdate.map((t: any) => t.id)]
          );
          
          console.log(`⚙️ Updated ${updateResult.rowCount} tickets:`, updateResult.rows);
          fixResults.ticketsFixed += updateResult.rowCount;
        } catch (entryError) {
          console.error(`❌ Error processing entry #${entry.id}:`, entryError);
          fixResults.errors++;
        }
      }
      
      res.json({
        success: true,
        ...fixResults,
        message: `Processed ${fixResults.entriesProcessed} entries and fixed ${fixResults.ticketsFixed} tickets with ${fixResults.errors} errors`
      });
    } catch (error: any) {
      console.error(`❌ Error fixing ticket status:`, error);
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
      
      // First check if the ticket exists
      const ticket = await storage.getTicket(competitionId, ticketNumber);
      
      if (!ticket) {
        return res.status(404).json({ 
          error: "Ticket not found", 
          message: `Ticket number ${ticketNumber} not found for competition ID ${competitionId}` 
        });
      }
      
      console.log(`✅ Found ticket:`, ticket);
      
      // Get the competition details
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      // Find the entry containing this ticket regardless of ticket status
      // This helps with tickets that are in an entry but status wasn't updated
      let user = null;
      let entry = null;
      
      // First approach: If the ticket has a userId, get the user directly
      if (ticket.userId) {
        user = await storage.getUser(ticket.userId);
        console.log(`✅ Found user from ticket:`, user);
      }
      
      // Try to find through entries (this is important for legacy tickets)
      console.log(`🔍 Searching for entry with ticket ${ticketNumber}...`);
      
      // Get all entries for this competition
      const entries = await storage.getCompetitionEntries(competitionId);
      console.log(`✅ Found ${entries.length} entries for competition ${competitionId}`);
      
      // Find the entry that contains this ticket number
      entry = entries.find(entry => {
        // Try to parse the ticketIds string and look for our ticket number
        try {
          const ticketIdString = entry.ticketIds || '';
          const ticketIds = ticketIdString.split(',').map(id => parseInt(id.trim()));
          return ticketIds.includes(ticketNumber);
        } catch (err) {
          console.error(`❌ Error parsing ticket IDs for entry ${entry.id}:`, err);
          return false;
        }
      });
      
      console.log(`${entry ? '✅ Found' : '❌ Could not find'} entry with ticket ${ticketNumber}`);
      
      // If we found an entry, get the user
      if (entry && entry.userId) {
        user = await storage.getUser(entry.userId);
        console.log(`✅ Found user from entry:`, user);

        // If ticket has the wrong status but is in an entry, it should be considered purchased
        // This handles the case of tickets that were purchased but not properly updated
        if (ticket.status !== 'purchased' && entry) {
          console.log(`⚠️ Ticket ${ticketNumber} has status "${ticket.status}" but is in an entry, treating as purchased`);
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
          id: ticket.id,
          number: ticket.number,
          status: ticket.status,
          purchasedAt: ticket.purchasedAt,
          // Indicate if there's a status mismatch (ticket should be purchased)
          statusMismatch: (ticket.status !== 'purchased' && entry !== null)
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