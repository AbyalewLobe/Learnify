import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Video, DollarSign, TrendingUp, Eye, CheckCircle, XCircle, Mail, Calendar, ShoppingCart, PlayCircle, FileText, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<{ name: string; url: string } | null>(null);

  const approveCourse = (courseId: string) => {
    toast({ title: "Course Approved", description: "The course has been published to the marketplace" });
  };

  const rejectCourse = (courseId: string) => {
    toast({ title: "Course Rejected", description: "The creator has been notified", variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage platform, users, and content</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-10 w-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                    </div>
                    <Badge variant={stat.trend === "up" ? "default" : "secondary"}>
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Course Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-16 h-10 object-cover rounded"
                              />
                              <span className="font-medium">{course.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{course.creator}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                course.status === "Published"
                                  ? "default"
                                  : course.status === "Pending"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.students.toLocaleString()}</TableCell>
                          <TableCell>${course.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {course.status === "Pending" && (
                                <>
                                  <Button size="sm" variant="default" onClick={() => approveCourse(course.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => rejectCourse(course.id)}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setSelectedCourse(course)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.joined}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedUser(user)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <div className="text-3xl font-bold">$245,800</div>
                        <div className="text-sm text-accent">+18.2% this month</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Creator Earnings</div>
                        <div className="text-3xl font-bold">$221,220</div>
                        <div className="text-sm text-muted-foreground">90% payout rate</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Platform Revenue</div>
                        <div className="text-3xl font-bold">$24,580</div>
                        <div className="text-sm text-muted-foreground">10% platform fee</div>
                      </div>
                    </div>

                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenue",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-64"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>Review course information and manage publication status</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <img
                  src={selectedCourse.thumbnail}
                  alt={selectedCourse.title}
                  className="w-48 h-32 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-bold">{selectedCourse.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedCourse.status === "Published" ? "default" : "secondary"}>
                      {selectedCourse.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Created by {selectedCourse.creator}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Students Enrolled</div>
                    <div className="text-2xl font-bold">{selectedCourse.students.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">${selectedCourse.revenue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Rating</div>
                    <div className="text-2xl font-bold">4.8 ⭐</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Course Description</h4>
                <p className="text-sm text-muted-foreground">
                  This comprehensive course covers everything you need to know about the subject.
                  Students will learn through practical examples and hands-on projects.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Course Content</h4>
                <Accordion type="single" collapsible className="w-full">
                  {courseContent.chapters.map((chapter, chapterIndex) => (
                    <AccordionItem key={chapterIndex} value={`chapter-${chapterIndex}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">Chapter {chapterIndex + 1}: {chapter.title}</span>
                          <span className="text-sm text-muted-foreground">{chapter.lessons.length} lessons</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                {lesson.type === "video" ? (
                                  <PlayCircle className="h-5 w-5 text-primary mt-0.5" />
                                ) : (
                                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">{lesson.title}</div>
                                  <div className="text-sm text-muted-foreground">{lesson.duration}</div>
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                                  )}
                                  
                                  {lesson.type === "video" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="mt-2"
                                      onClick={() => setPreviewVideo(lesson.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")}
                                    >
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Preview Video
                                    </Button>
                                  )}
                                  
                                  {lesson.resources && lesson.resources.length > 0 && (
                                    <div className="mt-3">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">Resources:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {lesson.resources.map((resource, idx) => (
                                          <Button
                                            key={idx}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8"
                                            onClick={() => setPreviewResource({ 
                                              name: resource, 
                                              url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf` 
                                            })}
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            {resource}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {selectedCourse.status === "Pending" && (
                <div className="flex gap-3">
                  <Button variant="destructive" className="flex-1" onClick={() => rejectCourse(selectedCourse.id)}>
                    Reject Course
                  </Button>
                  <Button className="flex-1 gradient-primary" onClick={() => approveCourse(selectedCourse.id)}>
                    Approve & Publish
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
            <DialogDescription>Review the video content before approval</DialogDescription>
          </DialogHeader>
          {previewVideo && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                src={previewVideo} 
                controls 
                className="w-full h-full"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resource Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Resource Preview: {previewResource?.name}</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => previewResource && window.open(previewResource.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          {previewResource && (
            <div className="h-[70vh] bg-muted rounded-lg overflow-hidden">
              <iframe 
                src={previewResource.url} 
                className="w-full h-full border-0"
                title={previewResource.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user information and activity</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {selectedUser.joined}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    <Badge variant={selectedUser.status === "Active" ? "default" : "secondary"}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Courses Created</div>
                    <div className="text-2xl font-bold">
                      {selectedUser.role === "Creator" ? "12" : "0"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Courses Enrolled</div>
                    <div className="text-2xl font-bold">
                      {selectedUser.role === "Student" ? "8" : "3"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">
                      {selectedUser.role === "Creator" ? "$24,500" : "$0"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Enrolled in "Complete Web Development"</div>
                      <div className="text-xs text-muted-foreground">2 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Completed 5 lessons</div>
                      <div className="text-xs text-muted-foreground">4 days ago</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">Send Message</Button>
                <Button variant="destructive" className="flex-1">Suspend Account</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const stats = [
  {
    icon: Users,
    value: "52.4K",
    label: "Total Users",
    change: "+2.4K",
    trend: "up",
    color: "primary",
  },
  {
    icon: Video,
    value: "10.2K",
    label: "Total Courses",
    change: "+340",
    trend: "up",
    color: "accent",
  },
  {
    icon: DollarSign,
    value: "$245K",
    label: "Total Revenue",
    change: "+18.2%",
    trend: "up",
    color: "accent",
  },
  {
    icon: TrendingUp,
    value: "98.5%",
    label: "Platform Uptime",
    change: "Excellent",
    trend: "up",
    color: "primary",
  },
];

const courses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    creator: "John Smith",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    status: "Published",
    students: 12453,
    revenue: 18680,
  },
  {
    id: "2",
    title: "Advanced React Patterns",
    creator: "Sarah Williams",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    status: "Pending",
    students: 0,
    revenue: 0,
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    creator: "Mike Johnson",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500",
    status: "Published",
    students: 8932,
    revenue: 11234,
  },
];

const users = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    role: "Creator",
    joined: "Jan 2024",
    status: "Active",
  },
  {
    id: "2",
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "Creator",
    joined: "Feb 2024",
    status: "Active",
  },
  {
    id: "3",
    name: "Alex Martinez",
    email: "alex@example.com",
    role: "Student",
    joined: "Mar 2024",
    status: "Active",
  },
];

const revenueData = [
  { month: "Jan", revenue: 18500 },
  { month: "Feb", revenue: 22300 },
  { month: "Mar", revenue: 19800 },
  { month: "Apr", revenue: 25600 },
  { month: "May", revenue: 28900 },
  { month: "Jun", revenue: 32400 },
  { month: "Jul", revenue: 29700 },
  { month: "Aug", revenue: 35200 },
  { month: "Sep", revenue: 38600 },
  { month: "Oct", revenue: 42100 },
  { month: "Nov", revenue: 39800 },
  { month: "Dec", revenue: 45800 },
];

const courseContent = {
  chapters: [
    {
      title: "Introduction to the Course",
      lessons: [
        {
          title: "Welcome and Overview",
          type: "video",
          duration: "8:30",
          description: "Introduction to the course structure and what you'll learn",
          resources: ["Course Syllabus.pdf", "Getting Started Guide.pdf"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          title: "Setting Up Your Environment",
          type: "video",
          duration: "15:20",
          description: "Step-by-step guide to setting up your development environment",
          resources: ["Setup Checklist.pdf", "Required Software.txt"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    },
    {
      title: "Core Concepts",
      lessons: [
        {
          title: "Fundamental Principles",
          type: "video",
          duration: "22:45",
          description: "Deep dive into the fundamental concepts you need to master",
          resources: ["Concept Notes.pdf", "Practice Exercises.pdf"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        },
        {
          title: "Practical Examples",
          type: "video",
          duration: "18:15",
          description: "Real-world examples and use cases",
          resources: ["Example Code.zip", "Reference Materials.pdf"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        },
        {
          title: "Quiz: Core Concepts",
          type: "quiz",
          duration: "10:00",
          description: "Test your understanding of the core concepts",
          resources: [],
        },
      ],
    },
    {
      title: "Advanced Topics",
      lessons: [
        {
          title: "Advanced Techniques",
          type: "video",
          duration: "25:30",
          description: "Advanced strategies and optimization techniques",
          resources: ["Advanced Guide.pdf", "Code Samples.zip"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        },
        {
          title: "Best Practices",
          type: "video",
          duration: "20:10",
          description: "Industry best practices and common pitfalls to avoid",
          resources: ["Best Practices Checklist.pdf"],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        },
        {
          title: "Final Project",
          type: "assignment",
          duration: "2:00:00",
          description: "Apply everything you've learned in a comprehensive project",
          resources: ["Project Brief.pdf", "Starter Files.zip", "Grading Rubric.pdf"],
        },
      ],
    },
  ],
};

export default AdminDashboard;
