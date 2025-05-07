import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerCompetitionRoutes } from "./routes/competitions";
import { registerTicketRoutes } from "./routes/tickets";
import { registerAdminRoutes } from "./routes/admin";
import { registerUploadRoutes } from "./routes/uploads";
import { registerCartRoutes } from "./routes/cart";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register API routes
  registerCompetitionRoutes(app);
  registerTicketRoutes(app);
  registerAdminRoutes(app);
  registerUploadRoutes(app);
  registerCartRoutes(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
