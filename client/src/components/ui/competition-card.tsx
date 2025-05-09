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

  const competitionUrl = `/competition/${id}`;

  return (
    <Link href={competitionUrl} className="block h-full transition-transform duration-200 hover:scale-[1.01] focus:outline-none">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full border border-gray-200 relative">
        {/* Image - square aspect ratio */}
        <div className="relative pt-[100%] overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              console.error("Competition card image failed to load:", imageUrl);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log("Competition card image loaded successfully")}
          />
          
          {/* Draw date badge */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#002D5C] text-white text-sm font-medium py-2 px-4 flex items-center justify-center">
            <div className="flex items-center">
              <span className="text-[#C3DC6F] font-medium mr-2">DRAW DATE:</span> 
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-xl font-extrabold text-[#002D5C] mb-3 text-center leading-tight">{title}</h3>
          
          {/* Win chance badge */}
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3.5 py-1.5 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.37 5.97a.5.5 0 0 0-.74 0l-1.37 1.37-1.16-.61a.5.5 0 0 0-.69.24l-.38 1.26-1.38-.19a.5.5 0 0 0-.54.48l.02 1.3L.95 10.41a.5.5 0 0 0-.1.73l.94.94-.19 1.3a.5.5 0 0 0 .48.53l1.3-.18.65 1.13a.5.5 0 0 0 .7.17l1.17-.58 1.1.73a.5.5 0 0 0 .76-.29l.33-1.28 1.24.4a.5.5 0 0 0 .62-.38l.19-1.3 1.06-.8a.5.5 0 0 0 .09-.72l-.82-1.04.17-1.3a.5.5 0 0 0-.45-.55l-1.3.1-.62-1.17a.5.5 0 0 0-.68-.21z"/>
              </svg>
              1 in 10 Chance Of Winning!
            </div>
          </div>
          
          {/* Price */}
          <div className="text-center my-4">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(ticketPrice)}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 mb-5 p-3 border border-gray-100 rounded-md bg-gray-50">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 mb-2">
              <div
                className="h-full w-full flex-1 competition-progress-indicator"
                style={{ transform: `translateX(-${100 - soldPercentage}%)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Tickets sold: {soldPercentage}%</span>
              <span>{ticketsSold}/{maxTickets}</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            <Button asChild className="w-full bg-[#002D5C] hover:bg-[#002D5C]/90 font-medium text-base py-3">
              <Link href={competitionUrl} className="flex items-center justify-center">
                Enter now
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
