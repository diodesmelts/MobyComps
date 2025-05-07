import { Express, Request, Response } from "express";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";

// Simple in-memory multer storage for development
// In production, use proper cloud storage or disk storage with cleanup
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Simple middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function registerUploadRoutes(app: Express) {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Upload endpoint for competition images
  app.post("/api/upload/image", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // For simplicity, just generate a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${req.file.originalname.replace(/\s+/g, "-")}`;
      
      // Write the file to disk
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Return the URL that can be used to access the file
      const fileUrl = `/uploads/${filename}`;
      
      res.json({
        success: true,
        fileUrl,
        filename
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filepath = path.join(uploadsDir, req.path);
    
    // Check if file exists
    if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
      res.sendFile(filepath);
    } else {
      next();
    }
  });
}