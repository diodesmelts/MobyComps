import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { competitionApi } from "@/lib/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock, ShieldCheck } from "lucide-react";
import TicketSelection from "@/components/competitions/TicketSelection";
import { Competition } from "@shared/types";
import { formatDate } from "@/lib/utils";

export default function CompetitionDetailPage() {
  const { id } = useParams();
  
  // Fetch competition details
  const { data: competition, isLoading, error } = useQuery<Competition>({
    queryKey: [`/api/competitions/${id}`],
    queryFn: () => competitionApi.getCompetitionById(id as string),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] w-full rounded-lg" />
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertDescription>
            Sorry, we couldn't load this competition. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/competitions">Competitions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>{competition.title}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Competition Details */}
          <div>
            {/* Product Image */}
            <Card className="overflow-hidden shadow-md mb-6">
              <img 
                src={competition.imageUrl} 
                alt={competition.title} 
                className="w-full h-auto aspect-video object-cover"
              />
            </Card>

            {/* Competition Details */}
            <Card className="shadow-md mb-6">
              <CardHeader>
                <CardTitle>Competition Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{competition.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Draw information:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CalendarIcon className="h-4 w-4 mt-1 mr-2 text-primary" />
                      <span>Prize draw date: {formatDate(competition.drawDate)}</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 mt-1 mr-2 text-primary" />
                      <span>Competition will close sooner if the maximum entries are received</span>
                    </li>
                  </ul>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Category:</h4>
                  <Badge variant="outline">{competition.category?.name || "Uncategorized"}</Badge>
                </div>

                {/* How It Works */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">How it works</h4>
                  <div className="flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mb-2">
                        <span className="font-medium">1</span>
                      </div>
                      <div className="text-center text-sm">
                        <span className="block text-primary mb-1">🎫</span>
                        <p>Buy tickets</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mb-2">
                        <span className="font-medium">2</span>
                      </div>
                      <div className="text-center text-sm">
                        <span className="block text-primary mb-1">🎁</span>
                        <p>Reveal result</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mb-2">
                        <span className="font-medium">3</span>
                      </div>
                      <div className="text-center text-sm">
                        <span className="block text-primary mb-1">🏆</span>
                        <p>Claim prize</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I know if I've won?</AccordionTrigger>
                    <AccordionContent>
                      Once the competition closes and the draw takes place, winners will be notified via email. 
                      You can also check your account dashboard for any winning notifications.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>When will I receive my prize?</AccordionTrigger>
                    <AccordionContent>
                      If you're the lucky winner, your prize will be dispatched within 14 working days of the draw date. 
                      For high-value items, we may arrange a delivery date with you directly.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Can I get a refund on my tickets?</AccordionTrigger>
                    <AccordionContent>
                      Unfortunately, all ticket purchases are final and non-refundable once confirmed.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Ticket Selection */}
          <div className="sticky top-4">
            <TicketSelection competition={competition} />
                      
            {/* Trust Badge */}
            <div className="mt-6">
              <Card className="border-none shadow-sm bg-gray-50">
                <CardContent className="flex justify-center items-center py-4">
                  <ShieldCheck className="text-primary mr-2 h-5 w-5" />
                  <span className="text-sm text-gray-600">
                    Secure payments with Mastercard and Visa
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
