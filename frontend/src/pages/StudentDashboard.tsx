import { Link } from "react-router-dom";
import { Play, Clock, CheckCircle, TrendingUp, BookOpen, ArrowRight, Download, Award } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const handleDownloadCertificate = () => {
    toast({
      title: "Certificate Downloaded",
      description: "Your certificate has been downloaded successfully.",
    });
    setCertificateOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Learning</h1>
            <p className="text-muted-foreground">Track your progress and continue your journey</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Course Tabs */}
          <Tabs defaultValue="in-progress" className="space-y-6">
            <TabsList>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>

            <TabsContent value="in-progress" className="space-y-4">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden shrink-0">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-smooth">
                          <Button size="icon" variant="secondary" className="rounded-full" asChild>
                            <Link to={`/learn/${course.id}`}>
                              <Play className="h-5 w-5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <Link to={`/learn/${course.id}`}>
                            <h3 className="text-xl font-semibold hover:text-primary transition-smooth">
                              {course.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{course.creator}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{course.progress}% complete</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.timeSpent}h spent</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.lessonsCompleted}/{course.totalLessons} lessons</span>
                          </div>
                        </div>

                        <Button asChild className="gradient-primary group">
                          <Link to={`/learn/${course.id}`}>
                            Continue Learning
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedCourses.map((course) => (
                <Card key={course.id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden shrink-0">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-3 right-3">
                          <div className="bg-accent text-accent-foreground rounded-full p-2">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <Link to={`/course/${course.id}`}>
                            <h3 className="text-xl font-semibold hover:text-primary transition-smooth">
                              {course.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{course.creator}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-accent">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Completed on {course.completedDate}</span>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="outline" asChild>
                            <Link to={`/learn/${course.id}`}>
                              Review Course
                            </Link>
                          </Button>
                          <Dialog open={certificateOpen && selectedCourse?.id === course.id} onOpenChange={(open) => {
                            setCertificateOpen(open);
                            if (open) setSelectedCourse(course);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download Certificate
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Course Completion Certificate</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Certificate Preview */}
                                <div className="border-4 border-primary rounded-lg p-8 bg-gradient-to-br from-background to-muted text-center space-y-6">
                                  <Award className="h-20 w-20 mx-auto text-primary" />
                                  <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">Certificate of Completion</h2>
                                    <p className="text-muted-foreground">This is to certify that</p>
                                  </div>
                                  <div className="text-4xl font-bold text-primary">John Doe</div>
                                  <div className="space-y-2">
                                    <p className="text-muted-foreground">has successfully completed</p>
                                    <h3 className="text-2xl font-semibold">{course.title}</h3>
                                  </div>
                                  <div className="flex justify-around pt-8 border-t">
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Completed on</p>
                                      <p className="font-medium">{course.completedDate}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Instructor</p>
                                      <p className="font-medium">{course.creator}</p>
                                    </div>
                                  </div>
                                </div>
                                <Button onClick={handleDownloadCertificate} className="w-full gradient-primary">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download as PDF
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="wishlist">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Your wishlist is empty</p>
                <Button asChild className="mt-4">
                  <Link to="/marketplace">Browse Courses</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const stats = [
  {
    icon: BookOpen,
    value: "5",
    label: "Courses Enrolled",
    color: "primary",
  },
  {
    icon: CheckCircle,
    value: "2",
    label: "Completed",
    color: "accent",
  },
  {
    icon: Clock,
    value: "42h",
    label: "Learning Time",
    color: "primary",
  },
  {
    icon: TrendingUp,
    value: "85%",
    label: "Avg. Progress",
    color: "accent",
  },
];

const enrolledCourses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    creator: "John Smith",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    progress: 65,
    timeSpent: 18,
    lessonsCompleted: 92,
    totalLessons: 142,
  },
  {
    id: "2",
    title: "UI/UX Design Masterclass",
    creator: "Sarah Williams",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500",
    progress: 40,
    timeSpent: 12,
    lessonsCompleted: 32,
    totalLessons: 80,
  },
  {
    id: "3",
    title: "Digital Marketing Strategy 2024",
    creator: "Mike Johnson",
    thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=500",
    progress: 25,
    timeSpent: 8,
    lessonsCompleted: 15,
    totalLessons: 60,
  },
];

const completedCourses = [
  {
    id: "4",
    title: "Photography Fundamentals",
    creator: "Emma Davis",
    thumbnail: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500",
    completedDate: "Jan 15, 2024",
  },
  {
    id: "5",
    title: "Business Analytics with Python",
    creator: "David Chen",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500",
    completedDate: "Dec 28, 2023",
  },
];

const mockDiscussions = [
  {
    id: "1",
    author: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    time: "2 hours ago",
    message: "I'm having trouble understanding the React hooks concept. Can someone explain useEffect in simpler terms?",
    replies: [
      {
        id: "r1",
        author: "Mike Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        time: "1 hour ago",
        message: "Think of useEffect as a way to run code after your component renders. It's like saying 'do this whenever these things change'.",
      },
      {
        id: "r2",
        author: "Emma Davis",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
        time: "30 minutes ago",
        message: "Great explanation! Also check out lesson 5.3 where it's covered in detail with examples.",
      },
    ],
  },
  {
    id: "2",
    author: "Tom Wilson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    time: "5 hours ago",
    message: "Just finished chapter 3! The project example was really helpful. Thanks for the great course!",
    replies: [],
  },
];

export default StudentDashboard;
