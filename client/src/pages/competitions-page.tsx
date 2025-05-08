import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CompetitionCard } from "@/components/ui/competition-card";
import { useCompetitions } from "@/hooks/use-competitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Filter, Loader2 } from "lucide-react";

// Category options
const categories = [
  { value: "all", label: "All Prizes" },
  { value: "electronics", label: "Electronics" },
  { value: "cash_prizes", label: "Cash Prizes" },
  { value: "family", label: "Family" },
  { value: "household", label: "Household" },
  { value: "kids", label: "Kids" },
  { value: "days_out", label: "Days Out" },
  { value: "beauty", label: "Beauty" },
];

export default function CompetitionsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(search);
  
  // Get category from URL or default to "all"
  const initialCategory = searchParams.get("category") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialSearch = searchParams.get("search") || "";
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("newest");
  
  // Get competitions based on filters
  const { competitions, isLoading, totalCompetitions, totalPages } = useCompetitions({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    page: currentPage,
    search: searchTerm,
    limit: 9,
  });
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    
    const newSearch = params.toString();
    setLocation(`/competitions${newSearch ? `?${newSearch}` : ""}`, { replace: true });
  }, [selectedCategory, currentPage, searchTerm, setLocation]);
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page when changing category
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#002D5C]">
              <span className="text-[#C3DC6F]">Browse & Discover</span> All Competitions
            </h1>
            <p className="text-gray-600 mt-2">
              Explore our full range of competitions and find your perfect prize.
            </p>
          </div>
          
          {/* Search and Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex">
                <Input
                  placeholder="Search competitions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="mr-2"
                />
                <Button type="submit" variant="secondary" className="bg-[#C3DC6F] text-[#002D5C]">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              
              {/* Sort */}
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort:</span>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="flex-grow">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="ending">Ending Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search Results */}
              <div className="text-right text-sm text-gray-600">
                {!isLoading && (
                  <span>
                    Showing {competitions?.length || 0} of {totalCompetitions} competitions
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Categories Tabs */}
          <Tabs 
            value={selectedCategory} 
            onValueChange={handleCategoryChange}
            className="mb-6"
          >
            <TabsList className="bg-white">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.value} 
                  value={category.value}
                  className="px-4 py-2"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Competitions Grid */}
          <div className="mb-8">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-[#002D5C]" />
              </div>
            ) : competitions?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <div className="mb-4">
                  <Filter className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No competitions found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any competitions matching your criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchTerm("");
                    setSearchInput("");
                    setCurrentPage(1);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions?.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  
                  // Show current page, first, last, and adjacent pages
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }} 
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis if there's a gap
                  if (
                    (page === 2 && currentPage > 3) || 
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
