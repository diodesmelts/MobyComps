import { useState } from "react";
import { useLocation } from "wouter";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

type CategoryProps = {
  categories: {
    id: string;
    name: string;
  }[];
  activeCategory?: string;
};

export default function CategoryFilter({ categories, activeCategory }: CategoryProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(activeCategory || "all");

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      setLocation("/competitions");
    } else {
      setLocation(`/competitions?category=${categoryId}`);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-10">
      <Button
        variant={selectedCategory === "all" ? "primary" : "outline"}
        className="flex items-center"
        onClick={() => handleCategoryChange("all")}
      >
        <Tag className="h-4 w-4 mr-2" />
        All Prizes
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "primary" : "outline"}
          onClick={() => handleCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
