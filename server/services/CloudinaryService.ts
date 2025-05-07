import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../utils/cloudinary-upload";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

interface UploadResult {
  secure_url: string;
  public_id: string;
}

class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    try {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary credentials are not configured");
      }

      // Upload the file to Cloudinary
      const result = await uploadToCloudinary(file);
      
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error: any) {
      console.error("Cloudinary upload error:", error.message);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      console.error("Cloudinary delete error:", error.message);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}

export const cloudinaryService = new CloudinaryService();
