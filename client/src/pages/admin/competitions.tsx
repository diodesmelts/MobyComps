import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { insertCompetitionSchema, Competition } from "@shared/schema";
import { useAdminCompetitions, useAdminCompetitionMutations } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatPrice, formatDate } from "@/lib/utils";
import { Loader2, Package, Eye, Edit, Trash2, Plus, Calendar, FileImage, CreditCard, AlertCircle } from "lucide-react";

// Extended schema for form validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(['electronics', 'kids', 'days_out', 'beauty', 'household', 'cash_prizes', 'family']),
  maxTickets: z.number().min(1, "Must have at least 1 ticket"),
  ticketPrice: z.number().min(0.01, "Price must be at least 0.01"),
  featured: z.boolean().default(false),
  quizQuestion: z.string().min(1, "Quiz question is required"),
  quizAnswer: z.string().min(1, "Quiz answer is required"),
  drawDate: z.string().min(1, "Draw date is required"),
  closeDate: z.string().optional(),
  status: z.enum(['draft', 'live', 'completed', 'cancelled']).default('draft'),
  cashAlternative: z.number().optional(),
  imageFile: z.instanceof(FileList).optional(),
  imageUrl: z.string().optional(),
})
.transform((data) => {
  // For logging purposes
  console.log("Form data before transformation:", data);
  return data;
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminCompetitionsPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("edit");
  const isNew = searchParams.get("new") === "true";
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<Competition | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Get competitions based on active tab
  const { 
    competitions, 
    totalCompetitions, 
    totalPages, 
    isLoading,
    error 
  } = useAdminCompetitions(page, 10, activeTab !== "all" ? activeTab : undefined);
  
  // Debug output
  console.log("Admin competitions:", { competitions, totalCompetitions, error });
  
  // Get mutation hooks
  const {
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useAdminCompetitionMutations();
  
  // Get competition being edited
  const competitionToEdit = competitions.find(c => c.id === Number(editId));
  
  // Form for creating/editing competitions
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "electronics",
      ticketPrice: 1,
      maxTickets: 500,
      featured: false,
      quizQuestion: "What is 4 + 8?",
      quizAnswer: "12",
      drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "draft",
    },
    mode: "onChange",
  });
  
  // Debug form errors
  useEffect(() => {
    console.log("Form errors:", form.formState.errors);
  }, [form.formState.errors]);
  
  // Update form values when editing a competition
  useEffect(() => {
    if (competitionToEdit) {
      form.reset({
        title: competitionToEdit.title,
        description: competitionToEdit.description,
        category: competitionToEdit.category,
        ticketPrice: competitionToEdit.ticketPrice,
        maxTickets: competitionToEdit.maxTickets,
        cashAlternative: competitionToEdit.cashAlternative || undefined,
        featured: competitionToEdit.featured,
        quizQuestion: competitionToEdit.quizQuestion,
        quizAnswer: competitionToEdit.quizAnswer,
        drawDate: new Date(competitionToEdit.drawDate).toISOString().split('T')[0],
        closeDate: competitionToEdit.closeDate ? new Date(competitionToEdit.closeDate).toISOString().split('T')[0] : undefined,
        status: competitionToEdit.status,
        imageUrl: competitionToEdit.imageUrl,
      });
    } else if (isNew) {
      form.reset({
        title: "",
        description: "",
        category: "electronics",
        ticketPrice: 1,
        maxTickets: 500,
        featured: false,
        quizQuestion: "What is 4 + 8?",
        quizAnswer: "12",
        drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "draft",
      });
    }
  }, [competitionToEdit, isNew, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
    
    try {
      // Handle image upload if provided
      let imageUrl = competitionToEdit?.imageUrl;
      
      if (values.imageFile && values.imageFile.length > 0) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("image", values.imageFile[0]);
          
          const response = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error("Failed to upload image: " + await response.text());
          }
          
          const data = await response.json();
          console.log("Image upload response:", data);
          imageUrl = data.fileUrl;
        } catch (error) {
          console.error("Image upload error:", error);
          toast({
            title: "Error uploading image",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      
      console.log("Using image URL:", imageUrl);
      
      // Check if we have an image
      if (!imageUrl && !competitionToEdit) {
        toast({
          title: "Image required",
          description: "Please upload an image for the competition",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure we have proper date strings in ISO format
      const drawDate = values.drawDate ? new Date(values.drawDate).toISOString() : null;
      const closeDate = values.closeDate ? new Date(values.closeDate).toISOString() : null;
      
      console.log("Formatted dates:", { drawDate, closeDate });
      
      // Prepare competition data - convert dates to ISO format strings
      const competitionData = {
        title: values.title,
        description: values.description,
        category: values.category,
        ticketPrice: values.ticketPrice,
        maxTickets: values.maxTickets,
        featured: values.featured,
        quizQuestion: values.quizQuestion,
        quizAnswer: values.quizAnswer,
        drawDate: drawDate,
        closeDate: closeDate,
        status: values.status,
        cashAlternative: values.cashAlternative || null,
        imageUrl: imageUrl!,
      };
      
      console.log("Saving competition data:", competitionData);
      
      // Create or update competition
      if (competitionToEdit) {
        await updateCompetition.mutateAsync({
          id: competitionToEdit.id,
          data: competitionData,
        });
        
        toast({
          title: "Competition updated",
          description: "The competition has been updated successfully."
        });
      } else {
        await createCompetition.mutateAsync(competitionData);
        
        toast({
          title: "Competition created",
          description: "The competition has been created successfully."
        });
      }
      
      // Navigate back to competitions list
      navigate("/admin/competitions");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error saving competition",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle competition deletion
  const handleDelete = () => {
    if (competitionToDelete) {
      deleteCompetition.mutate(competitionToDelete.id);
      setIsDeleteDialogOpen(false);
      setCompetitionToDelete(null);
    }
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          {(isNew || editId) ? (
            // Competition Editor
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#002D5C]">
                  {competitionToEdit ? "Edit Competition" : "Create Competition"}
                </h1>
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/competitions")}
                >
                  Cancel
                </Button>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Competition Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter title" {...field} />
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
                                    placeholder="Enter description" 
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="electronics" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                                          Electronics
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="kids" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                                          Kids
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="days_out" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                                          Days Out
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="beauty" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                                          Beauty
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="household" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                                          Household
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="cash_prizes" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                                          Cash Prizes
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="family" className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
                                          Family
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="draft">Draft</SelectItem>
                                      <SelectItem value="live">Live</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="ticketPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ticket Price (£)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      min="0.01"
                                      placeholder="1.00"
                                      {...field}
                                      onChange={e => field.onChange(parseFloat(e.target.value))}
                                    />
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
                                  <FormLabel>Maximum Tickets</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="1" 
                                      placeholder="500"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
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
                                    placeholder="150.00"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  The cash amount offered as an alternative to the prize
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="imageFile"
                            render={({ field: { value, onChange, ...field } }) => (
                              <FormItem>
                                <FormLabel>Competition Image</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    {competitionToEdit && competitionToEdit.imageUrl && (
                                      <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                                        <img 
                                          src={competitionToEdit.imageUrl} 
                                          alt={competitionToEdit.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      {...field}
                                      onChange={(e) => onChange(e.target.files)}
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  {competitionToEdit?.imageUrl 
                                    ? "Upload a new image or keep the existing one" 
                                    : "Upload an image for the competition"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="drawDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Draw Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="closeDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Close Date (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    If not set, competition closes on draw date
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Featured Competition</FormLabel>
                                  <FormDescription>
                                    Featured competitions appear on the homepage
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="quizQuestion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quiz Question</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="What is 4 + 8?"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Simple question users must answer to enter
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="quizAnswer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quiz Answer</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  The correct answer to the quiz question
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate("/admin/competitions")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            console.log("Debug button clicked");
                            console.log("Form values:", form.getValues());
                            console.log("Form errors:", form.formState.errors);
                            form.handleSubmit(onSubmit)();
                          }}
                        >
                          Debug Submit
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-[#002D5C] hover:bg-[#002D5C]/90"
                          disabled={isUploading || createCompetition.isPending || updateCompetition.isPending}
                          onClick={() => console.log("Submit button clicked")}
                        >
                          {(isUploading || createCompetition.isPending || updateCompetition.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {competitionToEdit ? "Update Competition" : "Create Competition"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Competitions List
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#002D5C]">Manage Competitions</h1>
                <Button 
                  className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C]"
                  onClick={() => navigate("/admin/competitions?new=true")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Competition
                </Button>
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="live">Live</TabsTrigger>
                      <TabsTrigger value="draft">Draft</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#002D5C]" />
                    </div>
                  ) : competitions.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No competitions found</h3>
                      <p className="text-gray-500 mb-4">
                        {activeTab === "all" 
                          ? "You haven't created any competitions yet." 
                          : `You don't have any ${activeTab} competitions.`}
                      </p>
                      <Button 
                        className="bg-[#C3DC6F] hover:bg-[#C3DC6F]/90 text-[#002D5C]"
                        onClick={() => navigate("/admin/competitions?new=true")}
                      >
                        Create First Competition
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Competition</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Tickets</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Draw Date</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {competitions.map((competition) => (
                            <tr key={competition.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 mr-3">
                                    <img 
                                      src={competition.imageUrl} 
                                      alt={competition.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{competition.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">ID: {competition.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${competition.status === 'live' ? 'bg-green-100 text-green-800' : 
                                    competition.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    competition.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'}`
                                }>
                                  {competition.status}
                                </span>
                                {competition.featured && (
                                  <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Featured
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex items-center">
                                  <span>{competition.ticketsSold} / {competition.maxTickets}</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5 ml-2">
                                    <div 
                                      className="bg-[#C3DC6F] rounded-full h-1.5" 
                                      style={{ width: `${(competition.ticketsSold / competition.maxTickets) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {formatPrice(competition.ticketPrice)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {formatDate(competition.drawDate)}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button asChild variant="ghost" size="sm">
                                    <Link href={`/competition/${competition.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => navigate(`/admin/competitions?edit=${competition.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setCompetitionToDelete(competition);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {!isLoading && totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-500">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#002D5C]">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the competition "{competitionToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCompetition.isPending}
            >
              {deleteCompetition.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Competition"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
