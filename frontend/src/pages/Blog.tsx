import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "10 Tips for Effective Online Learning",
    excerpt: "Discover proven strategies to maximize your learning potential in online courses and stay motivated throughout your journey.",
    category: "Learning Tips",
    date: "2024-03-15",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    title: "The Future of Education Technology",
    excerpt: "Explore how AI and emerging technologies are reshaping the landscape of online education and creating new opportunities.",
    category: "Technology",
    date: "2024-03-10",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    title: "How to Create Engaging Course Content",
    excerpt: "Learn the best practices for designing course content that keeps students engaged and drives better learning outcomes.",
    category: "Teaching",
    date: "2024-03-05",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Success Stories: From Student to Creator",
    excerpt: "Inspiring stories from learners who turned their passion into profitable online courses and built successful teaching careers.",
    category: "Success Stories",
    date: "2024-02-28",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Mastering Time Management as a Student",
    excerpt: "Essential time management techniques to balance multiple courses, work, and personal life effectively.",
    category: "Productivity",
    date: "2024-02-20",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Building Your Personal Brand as an Educator",
    excerpt: "Strategic approaches to establishing yourself as a thought leader and growing your audience in the online education space.",
    category: "Marketing",
    date: "2024-02-15",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-20">
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Resources</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Insights, tips, and stories to help you succeed in your learning and teaching journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <Button variant="ghost" className="w-full group">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
