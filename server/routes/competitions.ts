import { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertCompetitionSchema } from "@shared/schema";
import { ticketService } from "../services/ticket-service";
import { drawService } from "../services/draw-service";

export function registerCompetitionRoutes(app: Express) {
  // Get all competitions (public)
  app.get("/api/competitions", async (req, res, next) => {
    try {
      const { featured, category, page, limit, search } = req.query;
      
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 10;
      
      const result = await storage.listCompetitions({
        featured: featured === "true",
        category: category as string,
        page: pageNum,
        limit: limitNum,
        search: search as string
      });
      
      const totalPages = Math.ceil(result.total / limitNum);
      
      res.json({
        competitions: result.competitions,
        total: result.total,
        totalPages
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get competition by ID (public)
  app.get("/api/competitions/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const competition = await storage.getCompetition(id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.json(competition);
    } catch (error) {
      next(error);
    }
  });
  
  // Get competition ticket status
  app.get("/api/competitions/:id/tickets", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      // Get user's session ID
      const sessionId = req.sessionID;
      
      const ticketStatus = await ticketService.getTicketStatus(id, sessionId);
      res.json(ticketStatus);
    } catch (error) {
      next(error);
    }
  });
  
  // Reserve tickets for a competition
  app.post("/api/competitions/:id/reserve-tickets", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      // Validate ticket numbers
      const schema = z.object({
        ticketNumbers: z.array(z.number())
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid ticket numbers" });
      }
      
      const { ticketNumbers } = validation.data;
      
      // Get user's session ID
      const sessionId = req.sessionID;
      
      // Reserve tickets (10 minutes expiry)
      const reservedTickets = await ticketService.reserveTickets(
        id,
        ticketNumbers,
        sessionId,
        10
      );
      
      res.json({ tickets: reservedTickets });
    } catch (error) {
      next(error);
    }
  });
  
  // Initialize the draw service
  drawService.scheduleDraws();
}
