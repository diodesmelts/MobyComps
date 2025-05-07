import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAdminSiteConfig } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Image, FileImage } from "lucide-react";

export default function AdminSiteContentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("logo");
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  // Site config hooks
  const { getConfig, updateConfig } = useAdminSiteConfig();
  
  // Get site logo configuration
  const { 
    data: siteLogo, 
    isLoading: isSiteLogoLoading 
  } = getConfig("site-logo");
  
  // Get hero banner configuration
  const { 
    data: heroBanner, 
    isLoading: isHeroBannerLoading 
  } = getConfig("hero-banner");
  
  // State for image URLs
  const [logoUrl, setLogoUrl] = useState("");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  
  // Handle image upload for logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading("logo");
    const formData = new FormData();
    formData.append("image", files[0]);
    
    try {
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }
      
      const data = await response.json();
      // The file URL path
      const logoPath = data.fileUrl;
      setLogoUrl(logoPath);
      
      // Update site config
      if (user) {
        updateConfig.mutate({
          key: "site-logo",
          value: logoPath
        });
      }
      
      toast({
        title: "Logo uploaded",
        description: "The site logo has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error uploading logo",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };
  
  // Handle hero banner image upload
  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading("hero");
    const formData = new FormData();
    formData.append("image", files[0]);
    
    try {
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload hero banner");
      }
      
      const data = await response.json();
      // The file URL path
      const heroPath = data.fileUrl;
      setHeroBannerUrl(heroPath);
      
      // Update site config
      if (user) {
        updateConfig.mutate({
          key: "hero-banner",
          value: heroPath
        });
      }
      
      toast({
        title: "Hero banner uploaded",
        description: "The hero banner has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error uploading hero banner",
        description: error instanceof Error ? error.message : "Failed to upload hero banner",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };
  
  // Set initial values when data loads
  useState(() => {
    if (siteLogo && siteLogo.value) {
      setLogoUrl(siteLogo.value);
    }
    
    if (heroBanner && heroBanner.value) {
      setHeroBannerUrl(heroBanner.value);
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#002147]">Site Content</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="logo">Site Logo</TabsTrigger>
              <TabsTrigger value="hero">Hero Banner</TabsTrigger>
            </TabsList>
            
            {/* Site Logo Tab */}
            <TabsContent value="logo">
              <Card>
                <CardHeader>
                  <CardTitle>Site Logo</CardTitle>
                  <CardDescription>
                    Upload the logo displayed in the site header
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSiteLogoLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-[#002147]" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(siteLogo?.value || logoUrl) && (
                        <div className="w-full flex justify-center p-4 bg-gray-100 rounded-lg">
                          <div className="max-w-xs max-h-24">
                            <img 
                              src={logoUrl || siteLogo?.value} 
                              alt="Site Logo Preview" 
                              className="h-auto max-h-24 object-contain mx-auto"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Logo</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploading === "logo"}
                        />
                        <p className="text-xs text-gray-500">
                          Recommended size: 200x60px. PNG with transparent background works best.
                        </p>
                      </div>
                      
                      {isUploading === "logo" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading logo...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Hero Banner Tab */}
            <TabsContent value="hero">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Hero Banner</CardTitle>
                  <CardDescription>
                    Upload the main banner image for the homepage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isHeroBannerLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-[#002147]" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(heroBanner?.value || heroBannerUrl) && (
                        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={heroBannerUrl || heroBanner?.value} 
                            alt="Hero Banner Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Hero Banner</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroBannerUpload}
                          disabled={isUploading === "hero"}
                        />
                        <p className="text-xs text-gray-500">
                          Recommended size: 1920x600px. Maximum file size: 5MB.
                        </p>
                      </div>
                      
                      {isUploading === "hero" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading hero banner...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}