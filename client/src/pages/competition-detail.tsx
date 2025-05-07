import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCompetition } from "@/hooks/use-competition";
import { TicketModal } from "@/components/modals/ticket-modal";
import { TicketNumberSelector } from "@/components/ui/ticket-number-selector";
import { QuizQuestion } from "@/components/ui/quiz-question";
import { formatPrice, calculatePercentage, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Calendar, AlertCircle, Clock, ShoppingCart, Ticket, TicketCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompetitionDetail() {
  const { id } = useParams();
  const competitionId = parseInt(id);
  const { toast } = useToast();
  const [location] = useLocation();
  const { competition, isLoading, error } = useCompetition(competitionId);
  const { openCart } = useCart();
  
  // State
  const [ticketCount, setTicketCount] = useState(1);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Generate options for the quiz question
  const generateOptions = (correctAnswer: string): string[] => {
    const options = [correctAnswer];
    
    // For numeric answers, generate close numbers
    if (!isNaN(parseInt(correctAnswer))) {
      const correct = parseInt(correctAnswer);
      while (options.length < 4) {
        const random = Math.floor(Math.random() * 6) - 3 + correct;
        if (random !== correct && !options.includes(random.toString())) {
          options.push(random.toString());
        }
      }
    } else {
      // For text answers, add some dummy options
      const dummyOptions = ["Option A", "Option B", "Option C"];
      options.push(...dummyOptions);
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };
  
  // Handle quiz submission
  const handleQuizSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setQuizAnswered(true);
      toast({
        title: "Correct answer!",
        description: "You can now select your tickets.",
      });
    } else {
      toast({
        title: "Incorrect answer",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle ticket selection
  const handleSelectTickets = () => {
    if (!quizAnswered) {
      toast({
        title: "Quiz required",
        description: "Please answer the question correctly first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsModalOpen(true);
  };
  
  // If competition is loading or not found
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002D5C]"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !competition) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-12">
          <div className="container mx-auto px-4">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || "Competition not found. Please check the URL and try again."}
              </AlertDescription>
            </Alert>
            <div className="text-center mt-8">
              <Button asChild>
                <a href="/competitions">Browse Competitions</a>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Calculate progress percentage
  const progressPercentage = calculatePercentage(competition.ticketsSold, competition.maxTickets);
  
  // Generate quiz options
  const quizOptions = generateOptions(competition.quizAnswer);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Competition Image and Details - Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Competition Image */}
            <div className="rounded-lg overflow-hidden bg-white shadow-md">
              <img 
                src={competition.imageUrl} 
                alt={competition.title} 
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Competition Details */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-[#002D5C]">Competition Details</h2>
              <p className="text-gray-700">{competition.description}</p>
              
              <div className="space-y-2">
                <h3 className="font-medium text-[#002D5C]">Draw information:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-[#8EE000] flex-shrink-0" />
                    Draw date: {formatDate(competition.drawDate)}
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 text-[#8EE000] flex-shrink-0" />
                    Competition will close sooner if the maximum entries are received
                  </li>
                </ul>
              </div>
              
              {/* How it works */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-[#002D5C] mb-4">How it works</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#002D5C] text-white flex items-center justify-center mb-2">1</div>
                    <div className="text-sm text-gray-700">Buy tickets</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#002D5C] text-white flex items-center justify-center mb-2">2</div>
                    <div className="text-sm text-gray-700">Reveal result</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#002D5C] text-white flex items-center justify-center mb-2">3</div>
                    <div className="text-sm text-gray-700">Claim prize</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-[#002D5C]">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-[#002D5C]">How do I know if I've won?</h3>
                  <p className="text-sm text-gray-700 mt-1">Once the competition closes and the draw takes place, winners will be notified via email. You can also check your account dashboard for any winning notifications.</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[#002D5C]">When will I receive my prize?</h3>
                  <p className="text-sm text-gray-700 mt-1">If you're the lucky winner, your prize will be dispatched within 14 working days of the draw date. For high-value items, we may arrange a delivery date with you directly.</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[#002D5C]">Can I get a refund on my tickets?</h3>
                  <p className="text-sm text-gray-700 mt-1">Unfortunately, all ticket purchases are final and non-refundable. Please ensure you want to enter before completing your purchase.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ticket Selection - Right Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Competition Header */}
              <div className="bg-[#002D5C] text-white p-4">
                <h1 className="text-lg font-bold uppercase">{competition.title}</h1>
                {competition.cashAlternative && (
                  <p className="text-sm opacity-80">Cash Alternative: {formatPrice(competition.cashAlternative)}</p>
                )}
              </div>
              
              {/* Competition Details */}
              <div className="p-4 space-y-4">
                {/* Draw Date & Price */}
                <div className="flex justify-between items-center">
                  <div className="bg-[#8EE000]/20 text-[#002D5C] text-xs font-medium rounded-full px-3 py-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Draw: {formatDate(competition.drawDate)}
                  </div>
                  <div className="bg-[#002D5C]/10 text-[#002D5C] text-xs font-medium rounded-full px-3 py-1">
                    Automated Draw
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-center">
                  <span className="text-3xl font-bold text-[#002D5C]">{formatPrice(competition.ticketPrice)}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>SOLD: {progressPercentage}%</span>
                    <span>{competition.ticketsSold}/{competition.maxTickets}</span>
                  </div>
                </div>
                
                {/* Ticket Selection Section */}
                <TicketNumberSelector
                  ticketPrice={competition.ticketPrice}
                  maxTickets={Math.min(10, competition.maxTickets - competition.ticketsSold)}
                  onChange={setTicketCount}
                  defaultValue={ticketCount}
                />
                
                {/* Quiz Question */}
                <QuizQuestion
                  question={competition.quizQuestion}
                  options={quizOptions}
                  correctAnswer={competition.quizAnswer}
                  onAnswerSubmit={handleQuizSubmit}
                />
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleSelectTickets}
                    className="w-full bg-[#002D5C] hover:bg-[#002D5C]/90 text-white py-2.5 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
                    disabled={!quizAnswered}
                  >
                    <Ticket className="h-5 w-5" />
                    <span>Select Ticket Numbers</span>
                  </Button>
                  
                  <Button
                    onClick={openCart}
                    className="w-full bg-[#8EE000] hover:bg-[#8EE000]/90 text-[#002D5C] py-2.5 px-4 rounded-md flex items-center justify-center space-x-2"
                    disabled={!quizAnswered}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>View Cart</span>
                  </Button>
                </div>
                
                {/* Warning Message */}
                {!quizAnswered && (
                  <div className="text-center text-sm text-red-500">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    <span>Please correctly answer the question to continue</span>
                  </div>
                )}
                
                {/* Competition Countdown */}
                <div className="text-xs text-center text-gray-500 pt-2 border-t border-gray-200">
                  Competition closes {formatDate(competition.closeDate || competition.drawDate)}<br />
                  (or when all tickets are sold)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Ticket Selection Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        competitionId={competitionId}
        maxTickets={competition.maxTickets}
        ticketCount={ticketCount}
      />
      
      <Footer />
    </div>
  );
}
