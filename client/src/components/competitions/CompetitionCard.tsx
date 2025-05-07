import { useState } from "react";
import { Link } from "wouter";
import { 
  CalendarIcon, 
  Star, 
  ArrowRight,
  Trophy
} from "lucide-react";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Badge 
} from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils";
import { Competition } from "@shared/types";

interface CompetitionCardProps {
  competition: Competition;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const {
    id,
    title,
    imageUrl,
    ticketPrice,
    maxTickets,
    soldTickets,
    drawDate,
    category
  } = competition;

  const [isHovered, setIsHovered] = useState(false);
  const percentageSold = (soldTickets / maxTickets) * 100;
  
  return (
    <Card 
      className="overflow-hidden border border-gray-100 transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <Badge 
          variant="secondary" 
          className="absolute top-4 left-4 px-4 py-1 rounded-md text-lg font-semibold"
        >
          Win
        </Badge>
        <Badge 
          variant="primary" 
          className="absolute top-4 right-4 p-1.5 rounded-full"
        >
          <Star className="h-4 w-4" />
        </Badge>
        <div className="absolute bottom-4 left-4 bg-primary/80 text-white text-sm px-3 py-1 rounded-md flex items-center space-x-1">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>DRAW DATE: {formatDate(drawDate)}</span>
        </div>
      </div>
      
      {/* Card Content */}
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        
        <div className="flex items-center justify-center bg-gray-50 rounded-md py-2 mb-3">
          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="text-sm">1 in 10 Chance Of Winning!</span>
          <Trophy className="h-4 w-4 text-yellow-500 ml-2" />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="font-bold text-2xl text-secondary">{formatCurrency(ticketPrice)}</span>
          </div>
          
          <Progress value={percentageSold} className="h-2.5" />
          
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>TICKETS SOLD: {formatPercent(percentageSold)}</span>
            <span>{soldTickets}/{maxTickets}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-0">
        <Button 
          variant="primary" 
          className="w-full rounded-t-none flex items-center justify-center gap-2"
          asChild
        >
          <Link href={`/competition/${id}`}>
            <span>Enter now</span>
            <ArrowRight className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
