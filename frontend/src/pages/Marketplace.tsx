import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-subtle py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Discover Your Next
              <span className="text-primary block">Learning Adventure</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse thousands of courses from world-class creators
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for courses, topics, or creators..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border sticky top-16 bg-background z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap hover-scale"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Courses" : category}
                </Badge>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-3 w-full md:w-auto">
              <Select defaultValue="popular">
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory === "all" ? "All Courses" : selectedCategory} 
              <span className="text-muted-foreground font-normal ml-2">
                ({mockCourses.length} results)
              </span>
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockCourses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const categories = [
  "all",
  "Development",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
];

const mockCourses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    creator: "John Smith",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    price: 49.99,
    rating: 4.8,
    students: 12453,
    duration: "24h",
    category: "Development",
  },
  {
    id: "2",
    title: "UI/UX Design Masterclass",
    creator: "Sarah Williams",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500",
    price: 39.99,
    rating: 4.9,
    students: 8932,
    duration: "18h",
    category: "Design",
  },
  {
    id: "3",
    title: "Digital Marketing Strategy 2024",
    creator: "Mike Johnson",
    thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=500",
    price: 59.99,
    rating: 4.7,
    students: 15621,
    duration: "32h",
    category: "Marketing",
  },
  {
    id: "4",
    title: "Photography Fundamentals",
    creator: "Emma Davis",
    thumbnail: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500",
    price: 44.99,
    rating: 4.9,
    students: 6754,
    duration: "15h",
    category: "Photography",
  },
  {
    id: "5",
    title: "Business Analytics with Python",
    creator: "David Chen",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500",
    price: 54.99,
    rating: 4.6,
    students: 9876,
    duration: "28h",
    category: "Business",
  },
  {
    id: "6",
    title: "Music Production Essentials",
    creator: "Lisa Anderson",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500",
    price: 49.99,
    rating: 4.8,
    students: 5432,
    duration: "20h",
    category: "Music",
  },
  {
    id: "7",
    title: "React & TypeScript Complete Guide",
    creator: "Alex Turner",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    price: 64.99,
    rating: 4.9,
    students: 11234,
    duration: "35h",
    category: "Development",
  },
  {
    id: "8",
    title: "Graphic Design for Beginners",
    creator: "Rachel Green",
    thumbnail: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500",
    price: 34.99,
    rating: 4.7,
    students: 7890,
    duration: "12h",
    category: "Design",
  },
];

export default Marketplace;
