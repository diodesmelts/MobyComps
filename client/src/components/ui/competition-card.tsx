import { Link } from "wouter";
import { formatPrice, calculatePercentage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full border border-gray-200">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Draw date badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#002D5C] text-white text-xs font-medium py-1.5 px-3 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          DRAW DATE: {formattedDate}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-bold text-[#002D5C] mb-2 text-center">{title}</h3>
        
        {/* Win chance badge */}
        <div className="flex justify-center mb-3">
          <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.37 5.97a.5.5 0 0 0-.74 0l-1.37 1.37-1.16-.61a.5.5 0 0 0-.69.24l-.38 1.26-1.38-.19a.5.5 0 0 0-.54.48l.02 1.3L.95 10.41a.5.5 0 0 0-.1.73l.94.94-.19 1.3a.5.5 0 0 0 .48.53l1.3-.18.65 1.13a.5.5 0 0 0 .7.17l1.17-.58 1.1.73a.5.5 0 0 0 .76-.29l.33-1.28 1.24.4a.5.5 0 0 0 .62-.38l.19-1.3 1.06-.8a.5.5 0 0 0 .09-.72l-.82-1.04.17-1.3a.5.5 0 0 0-.45-.55l-1.3.1-.62-1.17a.5.5 0 0 0-.68-.21z"/>
            </svg>
            1 in 10 Chance Of Winning!
          </div>
        </div>
        
        {/* Price */}
        <div className="text-center my-3">
          <span className="text-2xl font-bold text-[#C3DC6F]">{formatPrice(ticketPrice)}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 mb-4">
          <Progress value={soldPercentage} className="h-2.5 bg-gray-100" indicatorClassName="bg-[#C3DC6F]" />
          <div className="flex justify-between text-xs text-gray-500 mt-1.5">
            <span className="font-medium">TICKETS SOLD: {soldPercentage}%</span>
            <span>{ticketsSold}/{maxTickets}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full bg-[#002D5C] hover:bg-[#002D5C]/90 mt-auto font-medium py-2.5">
          <Link href={`/competition/${id}`} className="flex items-center justify-center">
            Enter now
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </Button>
      </div>
    </div>
  );
}
