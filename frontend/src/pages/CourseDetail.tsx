import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  Award, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  ArrowRight
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CourseDetail = () => {
  const { id } = useParams();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Badge>Development</Badge>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Complete Web Development Bootcamp 2024
                </h1>
                <p className="text-lg text-muted-foreground">
                  Master web development from scratch with HTML, CSS, JavaScript, React, Node.js, and more. Build real-world projects and launch your developer career.
                </p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-muted-foreground">(3,421 reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>12,453 students</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">John Smith</div>
                    <div className="text-sm text-muted-foreground">Senior Developer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:sticky lg:top-20 h-fit">
              <Card>
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800"
                    alt="Course preview"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button size="lg" variant="secondary" className="rounded-full h-16 w-16">
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2 animate-pulse-glow">$49.99</div>
                    <Button size="lg" className="w-full gradient-primary shadow-glow hover:shadow-xl group">
                      Enroll Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">24 hours of video content</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">142 lessons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">45 downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Lifetime access</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="lg:max-w-4xl">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {learningPoints.map((point, index) => (
                      <div key={index} className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Course Description</h2>
                  <div className={`space-y-4 ${!isExpanded && 'line-clamp-6'}`}>
                    <p className="text-muted-foreground">
                      Welcome to the Complete Web Development Bootcamp! This comprehensive course will take you from a complete beginner to a professional web developer. You'll learn everything you need to know to build modern, responsive websites and web applications.
                    </p>
                    <p className="text-muted-foreground">
                      Starting with the fundamentals of HTML and CSS, you'll progress through JavaScript, React, Node.js, and databases. Each section includes hands-on projects that you can add to your portfolio.
                    </p>
                    <p className="text-muted-foreground">
                      By the end of this course, you'll have built multiple real-world projects, understand modern development workflows, and be ready to start your career as a web developer.
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2"
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Show more <ChevronDown className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>No prior programming experience required</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>A computer with internet connection</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Willingness to learn and practice</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Course Curriculum</h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {curriculum.map((chapter, index) => (
                      <AccordionItem key={index} value={`chapter-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="text-left">
                              <div className="font-semibold">{chapter.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {chapter.lessons} lessons • {chapter.duration}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {chapter.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center gap-3 py-2 text-sm">
                                {item.type === 'video' ? (
                                  <Play className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="flex-1">{item.title}</span>
                                <span className="text-muted-foreground">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Student Reviews</h2>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-5xl font-bold">4.8</div>
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">3,421 reviews</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="p-6 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold">{review.name}</div>
                                <div className="text-sm text-muted-foreground">{review.date}</div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const learningPoints = [
  "Build responsive websites with HTML5 and CSS3",
  "Master JavaScript fundamentals and ES6+ features",
  "Create modern web apps with React and hooks",
  "Build backend APIs with Node.js and Express",
  "Work with databases (SQL and NoSQL)",
  "Implement user authentication and authorization",
  "Deploy applications to the cloud",
  "Use Git and GitHub for version control",
];

const curriculum = [
  {
    title: "Introduction to Web Development",
    lessons: 8,
    duration: "1h 30m",
    items: [
      { type: "video", title: "Welcome to the course", duration: "5:32" },
      { type: "video", title: "Setting up your environment", duration: "12:45" },
      { type: "video", title: "How the web works", duration: "15:20" },
      { type: "text", title: "Course resources", duration: "2 pages" },
    ],
  },
  {
    title: "HTML Fundamentals",
    lessons: 12,
    duration: "2h 15m",
    items: [
      { type: "video", title: "HTML basics", duration: "10:30" },
      { type: "video", title: "Text formatting", duration: "8:45" },
      { type: "video", title: "Links and images", duration: "12:20" },
      { type: "video", title: "Lists and tables", duration: "15:40" },
    ],
  },
  {
    title: "CSS Styling",
    lessons: 15,
    duration: "3h 20m",
    items: [
      { type: "video", title: "CSS introduction", duration: "8:15" },
      { type: "video", title: "Selectors and properties", duration: "14:30" },
      { type: "video", title: "Box model", duration: "18:45" },
      { type: "video", title: "Flexbox layout", duration: "22:10" },
    ],
  },
];

const reviews = [
  {
    name: "Alex Martinez",
    date: "2 weeks ago",
    rating: 5,
    comment: "This course exceeded my expectations! The instructor explains everything clearly and the projects are really practical. I went from knowing nothing about web development to building my own websites.",
  },
  {
    name: "Jessica Lee",
    date: "1 month ago",
    rating: 5,
    comment: "Best investment I've made in my career. The curriculum is comprehensive and up-to-date. I landed my first developer job 3 months after completing this course!",
  },
  {
    name: "David Brown",
    date: "1 month ago",
    rating: 4,
    comment: "Great course overall. Very detailed and well-structured. The only improvement I'd suggest is adding more advanced JavaScript concepts.",
  },
];

export default CourseDetail;
