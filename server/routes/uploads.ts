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

      // Generate a very simple filename - just timestamp + extension
      const timestamp = Date.now();
      // Extract file extension from original name
      const fileExt = path.extname(req.file.originalname).toLowerCase() || '.png';
      
      // Create a simple name without special characters
      const filename = `${timestamp}${fileExt}`;
      console.log("Simple filename:", filename, "Original:", req.file.originalname);
      
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
      
      // First try direct file lookup
      const directPath = path.join(uploadsDir, req.path);
      
      // If direct path doesn't work, try to find the file by listing directory
      if (!fs.existsSync(directPath) || !fs.statSync(directPath).isFile()) {
        // Try to extract the timestamp part from the filename (which should be consistent)
        const pathParts = req.path.split('-');
        if (pathParts.length > 0) {
          const timestamp = pathParts[0].replace(/\//g, '');
          
          // Find all files in uploads directory
          const files = fs.readdirSync(uploadsDir);
          
          // Look for a file starting with the timestamp
          const matchingFile = files.find(file => file.startsWith(timestamp));
          
          if (matchingFile) {
            console.log("Found matching file by timestamp:", matchingFile);
            const matchingFilePath = path.join(uploadsDir, matchingFile);
            
            // Set the proper content type based on file extension
            const ext = path.extname(matchingFilePath).toLowerCase();
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
            const fileBuffer = fs.readFileSync(matchingFilePath);
            return res.send(fileBuffer);
          }
        }
      } else {
        // Original file was found directly, serve it
        const ext = path.extname(directPath).toLowerCase();
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
        const fileBuffer = fs.readFileSync(directPath);
        return res.send(fileBuffer);
      }
      
      // If we get here, no matching file was found
      console.log("No matching file found for:", req.path);
      next();
    } catch (error) {
      console.error("Error serving uploaded file:", error);
      next();
    }
  });
}