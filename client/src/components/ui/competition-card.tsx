import { Link } from "wouter";
import { formatPrice, calculatePercentage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Competition } from "@shared/schema";
import { format } from "date-fns";

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const {
    id,
    title,
    imageUrl,
    ticketPrice,
    ticketsSold,
    maxTickets,
    drawDate,
    category,
  } = competition;

  const soldPercentage = calculatePercentage(ticketsSold, maxTickets);
  const formattedDate = format(new Date(drawDate), 'dd MMM yyyy');

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
        />
        {/* Win badge */}
        <div className="absolute top-3 left-3 bg-[#8EE000] text-[#002147] font-bold px-4 py-1 rounded-sm text-lg">
          Win
        </div>
        {/* Draw date label */}
        <div className="absolute bottom-3 left-3 bg-[#002147] text-white text-xs px-2 py-1 rounded-sm flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          DRAW DATE: {formattedDate}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-[#002147] font-medium text-center mb-2">{title}</h3>
        
        {/* Win chance badge */}
        <div className="flex justify-center mb-3">
          <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.37 5.97a.5.5 0 0 0-.74 0l-1.37 1.37-1.16-.61a.5.5 0 0 0-.69.24l-.38 1.26-1.38-.19a.5.5 0 0 0-.54.48l.02 1.3L.95 10.41a.5.5 0 0 0-.1.73l.94.94-.19 1.3a.5.5 0 0 0 .48.53l1.3-.18.65 1.13a.5.5 0 0 0 .7.17l1.17-.58 1.1.73a.5.5 0 0 0 .76-.29l.33-1.28 1.24.4a.5.5 0 0 0 .62-.38l.19-1.3 1.06-.8a.5.5 0 0 0 .09-.72l-.82-1.04.17-1.3a.5.5 0 0 0-.45-.55l-1.3.1-.62-1.17a.5.5 0 0 0-.68-.21z"/>
            </svg>
            1 in 10 Chance Of Winning!
          </div>
        </div>
        
        {/* Price */}
        <div className="text-center my-2">
          <span className="text-2xl font-bold text-[#002147]">{formatPrice(ticketPrice)}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 mb-4">
          <Progress value={soldPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>TICKETS SOLD: {soldPercentage}%</span>
            <span>{ticketsSold}/{maxTickets}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full bg-[#002147] hover:bg-[#002147]/90 mt-auto">
          <Link href={`/competition/${id}`}>
            Enter now
          </Link>
        </Button>
      </div>
    </div>
  );
}
