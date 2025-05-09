import { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { ticketStatusEnum } from "@shared/schema";

export function registerTicketRoutes(app: Express) {
  // Get tickets for a competition
  app.get("/api/competitions/:competitionId/tickets", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const sessionId = req.sessionID;
      const status = req.query.status as string | undefined;
      
      // Validate status if provided and cast to the correct type
      let validStatus: "available" | "reserved" | "purchased" | undefined = undefined;
      if (status && ["available", "reserved", "purchased"].includes(status)) {
        validStatus = status as "available" | "reserved" | "purchased";
      } else if (status) {
        return res.status(400).json({ error: "Invalid ticket status" });
      }
      
      const tickets = await storage.listTickets(competitionId, validStatus);
      res.json({
        tickets,
        sessionId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get tickets by competition ID with their status - This matches the API client's expected endpoint
  app.get("/api/tickets/:competitionId/available", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Get ALL tickets for this competition to show proper status
      const allTickets = await storage.listTickets(competitionId);
      
      // Map to the expected format for the client, including status
      const ticketStatusList = allTickets.map(ticket => ({
        number: ticket.number,
        status: ticket.status
      }));
      
      res.json(ticketStatusList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reserve tickets - original endpoint
  app.post("/api/competitions/:competitionId/tickets/reserve", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const requestSchema = z.object({
        ticketNumbers: z.array(z.number()),
      });
      
      const parsedBody = requestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { ticketNumbers } = parsedBody.data;
      const sessionId = req.sessionID;
      
      // Use 10 minutes as the default reservation time
      const reservedTickets = await storage.reserveTickets(
        competitionId,
        ticketNumbers,
        sessionId,
        10
      );
      
      // Calculate expiration time based on reservedUntil from the first ticket
      const expiresAt = reservedTickets.length > 0 && reservedTickets[0].reservedUntil 
        ? reservedTickets[0].reservedUntil 
        : new Date(Date.now() + 10 * 60 * 1000); // Default to 10 minutes from now
      
      const timeLeftSeconds = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );
      
      res.json({
        success: reservedTickets.length > 0,
        tickets: reservedTickets.map(t => t.number),
        expiresAt: expiresAt.toISOString(),
        timeLeftSeconds: Math.max(0, timeLeftSeconds)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reserve tickets - client API endpoint
  app.post("/api/tickets/:competitionId/reserve", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const requestSchema = z.object({
        ticketNumbers: z.array(z.number()),
        quizAnswer: z.string()
      });
      
      const parsedBody = requestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { ticketNumbers, quizAnswer } = parsedBody.data;
      const sessionId = req.sessionID;
      
      // Use 10 minutes as the default reservation time
      const reservedTickets = await storage.reserveTickets(
        competitionId,
        ticketNumbers,
        sessionId,
        10
      );
      
      // Calculate expiration time based on reservedUntil from the first ticket
      const expiresAt = reservedTickets.length > 0 && reservedTickets[0].reservedUntil 
        ? reservedTickets[0].reservedUntil 
        : new Date(Date.now() + 10 * 60 * 1000); // Default to 10 minutes from now
      
      const timeLeftSeconds = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );
      
      res.json({
        success: reservedTickets.length > 0,
        tickets: reservedTickets.map(t => t.number),
        expiresAt: expiresAt.toISOString(),
        timeLeftSeconds: Math.max(0, timeLeftSeconds)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Release tickets - client API endpoint
  app.post("/api/tickets/:competitionId/release", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const requestSchema = z.object({
        ticketNumbers: z.array(z.number())
      });
      
      const parsedBody = requestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { ticketNumbers } = parsedBody.data;
      const sessionId = req.sessionID;
      
      // For now, just release all reserved tickets for this session
      const count = await storage.releaseReservedTickets(sessionId);
      res.json({ success: true, released: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Release reserved tickets - original endpoint
  app.post("/api/tickets/release", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const count = await storage.releaseReservedTickets(sessionId);
      res.json({ success: true, released: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get ticket availability for a competition
  app.get("/api/competitions/:competitionId/ticket-status", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const competition = await storage.getCompetition(competitionId);
      
      if (!competition) {
        return res.status(404).json({ error: "Competition not found" });
      }
      
      const tickets = await storage.listTickets(competitionId);
      
      // Count tickets by status
      const available = tickets.filter(t => t.status === 'available').length;
      const reserved = tickets.filter(t => t.status === 'reserved').length;
      const purchased = tickets.filter(t => t.status === 'purchased').length;
      
      res.json({
        competitionId,
        totalTickets: competition.maxTickets,
        available,
        reserved,
        purchased,
        soldOutPercentage: Math.floor((purchased / competition.maxTickets) * 100)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}