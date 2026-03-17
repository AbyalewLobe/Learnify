import { Link } from "react-router-dom";
import { Star, Clock, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  price: number;
  rating: number;
  students: number;
  duration: string;
  category: string;
}

export const CourseCard = ({
  id,
  title,
  creator,
  thumbnail,
  price,
  rating,
  students,
  duration,
  category,
}: CourseCardProps) => {
  return (
    <Link to={`/course/${id}`} className="block">
      <Card className="overflow-hidden hover-lift group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300">
        <div className="relative overflow-hidden aspect-video">
          <img
            src={thumbnail}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-110 transition-all duration-500"
          />
          <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm hover-scale">
            {category}
          </Badge>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="text-white text-sm font-medium">Preview Course →</div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 group-hover:text-foreground transition-smooth">{creator}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 group/rating hover-scale">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{rating}</span>
            </div>
            <div className="flex items-center gap-1 hover-scale">
              <Users className="h-4 w-4" />
              <span>{students.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 hover-scale">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-2xl font-bold text-primary group-hover:scale-110 transition-all duration-300">${price}</span>
            <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300">
              View Details →
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
