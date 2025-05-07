import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, competitionApi } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { id: "electronics", name: "Electronics" },
  { id: "household", name: "Household" },
  { id: "beauty", name: "Beauty" },
  { id: "travel", name: "Travel" },
  { id: "cash", name: "Cash Prizes" },
  { id: "family", name: "Family" },
];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ticketPrice: z.coerce.number().positive("Ticket price must be positive"),
  maxTickets: z.coerce.number().int().positive("Maximum tickets must be a positive integer"),
  cashAlternative: z.coerce.number().positive("Cash alternative must be positive").optional(),
  drawDate: z.date().refine(date => date > new Date(), {
    message: "Draw date must be in the future",
  }),
  categoryId: z.string().min(1, "Please select a category"),
  isLive: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CompetitionFormProps {
  competition?: any;
  onSuccess?: () => void;
}

export default function AdminCompetitionForm({ 
  competition = null, 
  onSuccess 
}: CompetitionFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    competition?.imageUrl || null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: competition
      ? {
          ...competition,
          drawDate: new Date(competition.drawDate),
        }
      : {
          title: "",
          description: "",
          ticketPrice: 1,
          maxTickets: 500,
          cashAlternative: undefined,
          drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          categoryId: "",
          isLive: false,
          isFeatured: false,
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
  
  // Create/Update competition mutation
  const competitionMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (competition) {
        return competitionApi.updateCompetition(competition.id, data);
      } else {
        return competitionApi.createCompetition(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      
      toast({
        title: competition ? "Competition updated" : "Competition created",
        description: competition 
          ? "The competition has been updated successfully." 
          : "The competition has been created successfully.",
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    let imageUrl = competition?.imageUrl;
    
    // Upload image if selected
    if (imageFile) {
      try {
        const result = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = result.url;
      } catch (error) {
        toast({
          title: "Image upload failed",
          description: "Unable to upload the image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Submit the form with image URL
    competitionMutation.mutate({
      ...data,
      imageUrl,
    });
  };
  
  const isLoading = uploadImageMutation.isPending || competitionMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ninja Air Fryer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the prize..." 
                      rows={5} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticketPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Price (£)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxTickets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tickets</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cashAlternative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash Alternative (£) (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="Optional"
                      {...field}
                      value={field.value || ''}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    If the winner prefers cash instead of the prize
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="drawDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Draw Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date when the winner will be drawn
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isLive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Live</FormLabel>
                      <FormDescription>
                        Make this competition visible to users
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        Show this competition on the homepage
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-3">
              <FormLabel>Competition Image</FormLabel>
              <div className="border rounded-md p-4">
                {imagePreview ? (
                  <div className="relative aspect-video mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Competition preview" 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <FormItem>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a high-quality image of the prize
                  </FormDescription>
                </FormItem>
              </div>
            </div>
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {competition ? "Update Competition" : "Create Competition"}
        </Button>
      </form>
    </Form>
  );
}
