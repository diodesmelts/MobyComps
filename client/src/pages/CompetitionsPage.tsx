import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter/use-location";
import { useState } from "react";
import { competitionApi } from "@/lib/api";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import CategoryFilter from "@/components/competitions/CategoryFilter";
import { Loader2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Competition } from "@shared/types";

const categories = [
  { id: "all", name: "All Prizes" },
  { id: "cash", name: "Cash Prizes" },
  { id: "family", name: "Family" },
  { id: "household", name: "Household" },
  { id: "electronics", name: "Electronics" },
  { id: "travel", name: "Travel" },
  { id: "beauty", name: "Beauty" },
];

const sortOptions = [
  { id: "newest", name: "Newest First" },
  { id: "popular", name: "Most Popular" },
  { id: "ending", name: "Ending Soon" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
];

export default function CompetitionsPage() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const categoryParam = params.get("category") || "all";
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch competitions based on category
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["/api/competitions", selectedCategory],
    queryFn: () => selectedCategory === "all" 
      ? competitionApi.getAllCompetitions()
      : competitionApi.getCompetitionsByCategory(selectedCategory),
  });

  // Filter and sort competitions
  const filteredCompetitions = competitions?.filter(comp => {
    if (!searchTerm) return true;
    return comp.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedCompetitions = filteredCompetitions?.slice().sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "popular":
        return b.soldTickets - a.soldTickets;
      case "ending":
        return new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime();
      case "price-low":
        return a.ticketPrice - b.ticketPrice;
      case "price-high":
        return b.ticketPrice - a.ticketPrice;
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-secondary">All</span> Competitions
        </h1>
        <p className="text-gray-600">
          Explore our full range of competitions and find your perfect prize.
        </p>
      </div>

      {/* Category Filters */}
      <CategoryFilter categories={categories} activeCategory={selectedCategory} />

      {/* Search and Sort Controls */}
      <div className="mb-8 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-auto">
          <Input
            placeholder="Search competitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="md:hidden flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <div className={`flex gap-4 md:flex ${showFilters ? 'flex' : 'hidden'}`}>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedCompetitions && sortedCompetitions.length > 0 ? (
        <div className="competition-grid">
          {sortedCompetitions.map((competition: Competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl font-medium text-gray-600">No competitions found</p>
          <p className="text-gray-500">
            {searchTerm 
              ? "Try adjusting your search terms"
              : selectedCategory !== "all" 
                ? "Try selecting a different category" 
                : "Check back soon for new competitions!"}
          </p>
        </div>
      )}
    </div>
  );
}
