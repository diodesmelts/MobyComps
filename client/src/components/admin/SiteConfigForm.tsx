import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  heroBannerTitle: z.string().min(1, "Banner title is required"),
  heroBannerSubtitle: z.string().min(1, "Banner subtitle is required"),
  marketingBannerText: z.string().min(1, "Marketing banner text is required"),
  marketingBannerEnabled: z.boolean().default(true),
  footerText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SiteConfigFormProps {
  initialData?: {
    heroBanner: {
      imageUrl: string;
      title: string;
      subtitle: string;
    } | null;
    marketingBanner: {
      text: string;
      enabled: boolean;
    } | null;
    footerText: string | null;
  };
}

export default function SiteConfigForm({ initialData }: SiteConfigFormProps) {
  const [heroBannerFile, setHeroBannerFile] = useState<File | null>(null);
  const [heroBannerPreview, setHeroBannerPreview] = useState<string | null>(
    initialData?.heroBanner?.imageUrl || null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heroBannerTitle: initialData?.heroBanner?.title || "WIN THIS BEAUTIFUL",
      heroBannerSubtitle: initialData?.heroBanner?.subtitle || "DRAW 10TH MAY 9PM",
      marketingBannerText: initialData?.marketingBanner?.text || "Sign up before 20th May and get £10.00 site credit!",
      marketingBannerEnabled: initialData?.marketingBanner?.enabled ?? true,
      footerText: initialData?.footerText || "",
    },
  });
  
  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return adminApi.uploadImage(formData);
    }
  });
  
  // Update site config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminApi.updateSiteConfig(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      
      toast({
        title: "Configuration updated",
        description: "The site configuration has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleHeroBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroBannerFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setHeroBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    let heroBannerUrl = initialData?.heroBanner?.imageUrl || "";
    
    // Upload hero banner if selected
    if (heroBannerFile) {
      try {
        const result = await uploadImageMutation.mutateAsync(heroBannerFile);
        heroBannerUrl = result.url;
      } catch (error) {
        toast({
          title: "Image upload failed",
          description: "Unable to upload the hero banner image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Format the data for the API
    const configData = {
      heroBanner: JSON.stringify({
        imageUrl: heroBannerUrl,
        title: data.heroBannerTitle,
        subtitle: data.heroBannerSubtitle,
      }),
      marketingBanner: JSON.stringify({
        text: data.marketingBannerText,
        enabled: data.marketingBannerEnabled,
      }),
      footerText: data.footerText,
    };
    
    // Submit the form
    updateConfigMutation.mutate(configData);
  };
  
  const isLoading = uploadImageMutation.isPending || updateConfigMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Hero Banner</h3>
            <Separator className="mb-6" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <FormLabel>Banner Image</FormLabel>
                <div className="border rounded-md p-4">
                  {heroBannerPreview ? (
                    <div className="relative aspect-[21/9] mb-4">
                      <img 
                        src={heroBannerPreview} 
                        alt="Hero banner preview" 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[21/9] bg-gray-100 rounded-md flex items-center justify-center mb-4">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <FormItem>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroBannerChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Recommended size: 1920x820 pixels
                    </FormDescription>
                  </FormItem>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="heroBannerTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Title</FormLabel>
                    <FormControl>
                      <Input placeholder="WIN THIS BEAUTIFUL" {...field} />
                    </FormControl>
                    <FormDescription>
                      The main heading text that appears on the hero banner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="heroBannerSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Subtitle</FormLabel>
                    <FormControl>
                      <Input placeholder="DRAW 10TH MAY 9PM" {...field} />
                    </FormControl>
                    <FormDescription>
                      The secondary text that appears below the main heading
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Marketing Banner</h3>
            <Separator className="mb-6" />
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="marketingBannerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sign up before 20th May and get £10.00 site credit!"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The text that appears in the marketing banner at the top of the page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="marketingBannerEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Banner</FormLabel>
                      <FormDescription>
                        Show the marketing banner at the top of the page
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Footer</h3>
            <Separator className="mb-6" />
            
            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="© 2023 Moby Comps Ltd. All rights reserved."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom text to display in the footer of the site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}
