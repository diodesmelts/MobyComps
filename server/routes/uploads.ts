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

  // Handler function for image uploads
  const handleImageUpload = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      console.log("File upload received:", req.file.originalname, req.file.mimetype, req.file.size);

      // Generate a safe filename - timestamps plus sanitized original name
      const timestamp = Date.now();
      // Remove any special characters, spaces, non-ASCII chars that could cause issues
      const sanitizedName = req.file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "-") // Replace any non-alphanumeric chars with hyphens
        .replace(/--+/g, "-"); // Collapse multiple hyphens
      
      const filename = `${timestamp}-${sanitizedName}`;
      console.log("Sanitized filename:", filename);
      
      // Write the file to disk
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Return the URL that can be used to access the file
      const fileUrl = `/uploads/${filename}`;
      
      console.log("File saved successfully:", filename, "URL:", fileUrl);
      
      res.json({
        success: true,
        fileUrl,
        url: fileUrl, // Add url property for backward compatibility
        filename
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  // Register routes for both singular and plural versions
  // Upload endpoint for images (plural - preferred)
  app.post("/api/uploads/image", isAuthenticated, upload.single("image"), handleImageUpload);
  
  // Compatibility endpoint (singular)
  app.post("/api/upload/image", isAuthenticated, upload.single("image"), handleImageUpload);
  
  // Simple upload endpoint without authentication for testing
  app.post("/api/upload-test", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // For simplicity, just return a fake URL
      res.json({
        success: true,
        fileUrl: "/uploads/test-image.jpg",
        url: "/uploads/test-image.jpg",
        filename: "test-image.jpg"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    try {
      console.log("Received request for file:", req.path);
      
      // Only allow alphanumeric, dash, underscore and dot in filenames 
      // This is a security check to prevent path traversal attacks
      const sanitizedPath = req.path.replace(/[^a-zA-Z0-9\-._]/g, "");
      const filepath = path.join(uploadsDir, sanitizedPath);
      
      console.log("Serving file:", filepath);
      
      // Check if file exists
      if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
        // Set the proper content type based on file extension
        const ext = path.extname(filepath).toLowerCase();
        let contentType = 'application/octet-stream'; // Default content type
        
        if (ext === '.png') {
          contentType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
          contentType = 'image/jpeg';
        } else if (ext === '.gif') {
          contentType = 'image/gif';
        } else if (ext === '.webp') {
          contentType = 'image/webp';
        }
        
        console.log("Serving file with content type:", contentType);
        
        // Ensure no caching issues
        res.set({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': 'inline'
        });
        
        // Read file manually and send as buffer instead of using sendFile
        const fileBuffer = fs.readFileSync(filepath);
        return res.send(fileBuffer);
      } else {
        console.log("File not found:", filepath);
        next();
      }
    } catch (error) {
      console.error("Error serving uploaded file:", error);
      next();
    }
  });
}