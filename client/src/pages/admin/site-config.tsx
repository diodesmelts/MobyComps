import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Settings, Image, AlertCircle } from "lucide-react";

export default function AdminSiteConfigPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  
  // Site config hooks
  const { getConfig, updateConfig } = useAdminSiteConfig();
  
  const { 
    data: heroBanner, 
    isLoading: isHeroBannerLoading 
  } = getConfig("hero-banner");
  
  const { 
    data: marketingBanner, 
    isLoading: isMarketingBannerLoading 
  } = getConfig("marketing-banner");
  
  const { 
    data: footerText, 
    isLoading: isFooterTextLoading 
  } = getConfig("footer-text");
  
  // State for form values
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  const [marketingText, setMarketingText] = useState("");
  const [footerContent, setFooterContent] = useState("");
  
  // Handle hero banner image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", files[0]);
    
    try {
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      setHeroBannerUrl(data.url);
      
      // Update site config
      if (user) {
        updateConfig.mutate({
          key: "hero-banner",
          value: data.url
        });
      }
    } catch (error) {
      toast({
        title: "Error uploading image",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle marketing banner text update
  const handleMarketingTextUpdate = () => {
    if (!marketingText.trim()) {
      toast({
        title: "Error",
        description: "Marketing text cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (user) {
      updateConfig.mutate({
        key: "marketing-banner",
        value: marketingText
      });
    }
  };
  
  // Handle footer text update
  const handleFooterTextUpdate = () => {
    if (!footerContent.trim()) {
      toast({
        title: "Error",
        description: "Footer text cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (user) {
      updateConfig.mutate({
        key: "footer-text",
        value: footerContent
      });
    }
  };
  
  // Set initial values when data loads
  useState(() => {
    if (heroBanner) {
      setHeroBannerUrl(heroBanner.value);
    }
    
    if (marketingBanner) {
      setMarketingText(marketingBanner.value);
    }
    
    if (footerText) {
      setFooterContent(footerText.value);
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#002147]">Site Configuration</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketing Banner</CardTitle>
                    <CardDescription>
                      Configure the promotional banner displayed at the top of the site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isMarketingBannerLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-[#002147]" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Banner Text</label>
                          <Textarea 
                            placeholder="Enter marketing message"
                            className="mt-1"
                            value={marketingText || (marketingBanner?.value || "Sign up before 20th May and get £10.00 site credit!")}
                            onChange={(e) => setMarketingText(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This text appears in the green banner at the top of every page
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            className="bg-[#002147]"
                            onClick={handleMarketingTextUpdate}
                            disabled={updateConfig.isPending}
                          >
                            {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Footer Information</CardTitle>
                    <CardDescription>
                      Update the site footer content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isFooterTextLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-[#002147]" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Copyright Text</label>
                          <Textarea 
                            placeholder="Enter footer text"
                            className="mt-1"
                            value={footerContent || (footerText?.value || "© 2025 Moby Comps Ltd. All rights reserved. UK Registered Company No. 12345678")}
                            onChange={(e) => setFooterContent(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Copyright and legal information displayed in the footer
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            className="bg-[#002147]"
                            onClick={handleFooterTextUpdate}
                            disabled={updateConfig.isPending}
                          >
                            {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance">
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
                        <label className="text-sm font-medium">Upload New Banner</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        <p className="text-xs text-gray-500">
                          Recommended size: 1920x600px. Maximum file size: 5MB.
                        </p>
                      </div>
                      
                      {isUploading && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading image...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* SEO Settings */}
            <TabsContent value="seo">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Optimization</CardTitle>
                  <CardDescription>
                    Configure settings to improve your site's visibility on search engines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                        <p className="text-gray-600 max-w-sm mx-auto">
                          SEO configuration settings will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
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
