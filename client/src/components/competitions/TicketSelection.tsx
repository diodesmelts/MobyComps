import { useState, useEffect } from "react";
import { useTicketStatus } from "@/hooks/use-ticket-status";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Timer,
  Plus,
  Minus,
  Hash
} from "lucide-react";
import { Competition } from "@shared/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import AnswerQuiz from "./AnswerQuiz";
import TicketNumberGrid from "./TicketNumberGrid";

interface TicketSelectionProps {
  competition: Competition;
}

export default function TicketSelection({ competition }: TicketSelectionProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const { 
    availableTickets, 
    selectedTickets, 
    quizCorrect, 
    timeLeft,
    reservationTimeout,
    toggleTicket, 
    reserveTickets, 
    releaseTickets, 
    selectRandomTickets, 
    clearSelection, 
    submitQuizAnswer,
    isPendingReservation
  } = useTicketStatus(competition.id);
  
  const { 
    addToCart, 
    isPendingAdd 
  } = useCart();

  const percentSold = Math.round((competition.soldTickets / competition.maxTickets) * 100);
  
  const handleDecrementTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1);
    }
  };

  const handleIncrementTickets = () => {
    if (ticketCount < 10) { // Max 10 tickets at once
      setTicketCount(ticketCount + 1);
    }
  };
  
  const handleOpenTicketModal = () => {
    if (!quizCorrect) return;
    setIsTicketModalOpen(true);
    
    // If no tickets are reserved yet, reserve them now
    if (!reservationTimeout && selectedTickets.length === 0) {
      selectRandomTickets(ticketCount);
    }
  };
  
  const handleAddToCart = () => {
    if (selectedTickets.length > 0) {
      addToCart(competition.id, selectedTickets);
      setIsTicketModalOpen(false);
    }
  };
  
  // Format the time left for the reservation
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Mock quiz question for demo
  const quizQuestion = {
    question: "What is 4 + 8?",
    options: ["10", "11", "12", "13"],
    correctAnswer: "12"
  };

  useEffect(() => {
    return () => {
      // Clean up by releasing tickets when component unmounts
      if (selectedTickets.length > 0) {
        releaseTickets();
      }
    };
  }, []);

  return (
    <Card>
      {/* Prize Header */}
      <CardHeader className="bg-primary text-white">
        <CardTitle className="text-xl">{competition.title.toUpperCase()}</CardTitle>
        <CardDescription className="text-white/80">
          Cash Alternative: {formatCurrency(competition.cashAlternative || competition.ticketPrice * 150)}
        </CardDescription>
      </CardHeader>

      {/* Price and Progress */}
      <CardContent className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <Badge variant="secondary" className="text-sm">
            Draw {formatDate(competition.drawDate)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Automated Draw
          </Badge>
        </div>
        
        <div className="text-center mb-4">
          <span className="text-4xl font-bold text-secondary">{formatCurrency(competition.ticketPrice)}</span>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">SOLD: {percentSold}%</span>
            <span className="font-medium">{competition.soldTickets}/{competition.maxTickets}</span>
          </div>
          <Progress value={percentSold} className="h-2.5" />
        </div>
      </CardContent>

      {/* Ticket Selection */}
      <CardContent className="p-6 border-b border-gray-200">
        <h3 className="font-semibold mb-4 text-center uppercase text-primary">
          SELECT YOUR TICKETS
        </h3>
        
        {/* Ticket Range Indicator */}
        <div className="flex justify-between items-center mb-3 bg-gray-100 rounded-md px-4 py-2">
          <span className="text-sm text-gray-500">1</span>
          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium">
            {ticketCount}
          </div>
          <span className="text-sm text-gray-500">10</span>
        </div>
        
        {/* Ticket Counter */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 rounded-l-md hover:bg-gray-100"
              onClick={handleDecrementTickets}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 text-center">
              <div className="text-sm text-gray-500">
                Number of tickets: {formatCurrency(competition.ticketPrice)} × {ticketCount}
              </div>
              <div className="font-semibold">{ticketCount}</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 rounded-r-md hover:bg-gray-100"
              onClick={handleIncrementTickets}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Quiz Question */}
        <AnswerQuiz 
          quizQuestion={quizQuestion} 
          onAnswerSubmit={submitQuizAnswer}
          isAnswered={quizCorrect}
        />
        
        {/* Ticket Number Selection Button */}
        <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mb-4 flex items-center justify-center"
              disabled={!quizCorrect}
              onClick={handleOpenTicketModal}
            >
              <Hash className="mr-2 h-4 w-4" /> Select Ticket Numbers
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Select Your Ticket Numbers</DialogTitle>
              <DialogDescription>
                Choose specific ticket numbers or use Lucky Dip for random selection.
              </DialogDescription>
            </DialogHeader>
            
            <TicketNumberGrid 
              availableTickets={availableTickets.map(t => ({
                number: t,
                status: "available"
              }))}
              selectedTickets={selectedTickets}
              onToggleTicket={toggleTicket}
              onLuckyDip={selectRandomTickets}
              onClearSelection={clearSelection}
              maxSelection={10}
            />
            
            <DialogFooter className="flex justify-between items-center sm:justify-between mt-4">
              <div>
                <span className="font-medium">Selected: {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}</span>
                {selectedTickets.length > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({selectedTickets.sort((a, b) => a - b).join(', ')})
                  </span>
                )}
              </div>
              <Button 
                onClick={handleAddToCart} 
                disabled={selectedTickets.length === 0}
              >
                Confirm Selection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add to Cart Button */}
        <Button 
          variant="secondary" 
          className="w-full flex items-center justify-center"
          disabled={!quizCorrect || selectedTickets.length === 0 || isPendingAdd}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> 
          Add to Cart
        </Button>
        
        {/* Quiz Warning */}
        {!quizCorrect && (
          <div className="mt-3 text-center text-sm text-destructive flex items-center justify-center">
            <AlertCircle className="h-4 w-4 mr-1" /> 
            Please correctly answer the question to continue
          </div>
        )}
        
        {/* Reservation Timer */}
        {reservationTimeout && (
          <Alert className="mt-4 bg-amber-50 text-amber-900 border-amber-200">
            <Timer className="h-4 w-4" />
            <AlertTitle>Tickets reserved</AlertTitle>
            <AlertDescription>
              Your selected tickets are reserved for {formatTimeLeft()}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {/* Competition Timer */}
      <CardFooter className="p-4 text-center bg-gray-50">
        <div className="w-full space-y-1">
          <div className="font-medium text-primary">
            Competition closes {formatDateTime(competition.drawDate)}
          </div>
          <div className="text-sm text-gray-500">
            Or when all tickets are sold
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
