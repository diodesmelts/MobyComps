import { Express } from "express";
import { storage } from "../storage";

export function registerSiteConfigRoutes(app: Express) {
  // Public endpoint to get site configuration - no auth required
  app.get("/api/site-config/:key", async (req, res) => {
    try {
      const config = await storage.getSiteConfig(req.params.key);
      res.json(config || { key: req.params.key, value: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}