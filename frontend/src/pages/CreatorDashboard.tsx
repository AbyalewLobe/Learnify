import { Link } from "react-router-dom";
import { Plus, DollarSign, Users, TrendingUp, Eye, Video } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CreatorDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Creator Studio</h1>
              <p className="text-muted-foreground">Manage your courses and track your success</p>
            </div>
            <Button asChild className="gradient-primary shadow-glow">
              <Link to="/creator/course/new">
                <Plus className="mr-2 h-5 w-5" />
                Create New Course
              </Link>
            </Button>
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

          {/* Content Tabs */}
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Rating</TableHead>
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
                              <div>
                                <div className="font-medium">{course.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {course.lessons} lessons
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.students.toLocaleString()}</TableCell>
                          <TableCell>${course.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{course.rating}</span>
                              <span className="text-muted-foreground">({course.reviews})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/creator/course/${course.id}/edit`}>Edit</Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/course/${course.id}`}>View</Link>
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
                        <div className="text-3xl font-bold">$24,580</div>
                        <div className="text-sm text-accent">+12.5% this month</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">This Month</div>
                        <div className="text-3xl font-bold">$3,420</div>
                        <div className="text-sm text-accent">+8.2% vs last month</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Available to Withdraw</div>
                        <div className="text-3xl font-bold">$1,850</div>
                        <Button className="mt-2">Withdraw</Button>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                            <XAxis 
                              dataKey="month" 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent 
                                formatter={(value) => [`$${value}`, "Revenue"]}
                              />} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                              dot={{ fill: "hsl(var(--primary))", r: 4 }}
                              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Total Students</div>
                        <div className="text-3xl font-bold">12,453</div>
                        <div className="text-sm text-accent">+342 this month</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Avg. Completion Rate</div>
                        <div className="text-3xl font-bold">68%</div>
                        <div className="text-sm text-accent">+5% vs last month</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Avg. Rating</div>
                        <div className="text-3xl font-bold">4.8</div>
                        <div className="text-sm text-muted-foreground">Across all courses</div>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      <ChartContainer
                        config={{
                          students: {
                            label: "New Students",
                            color: "hsl(var(--accent))",
                          },
                        }}
                        className="h-full w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={studentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                            <XAxis 
                              dataKey="month" 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent 
                                formatter={(value) => [`${value} students`, "New Students"]}
                              />} 
                            />
                            <Bar 
                              dataKey="students" 
                              fill="hsl(var(--accent))"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    icon: DollarSign,
    value: "$24.5K",
    label: "Total Revenue",
    change: "+12.5%",
    trend: "up",
    color: "accent",
  },
  {
    icon: Users,
    value: "12.4K",
    label: "Total Students",
    change: "+342",
    trend: "up",
    color: "primary",
  },
  {
    icon: Video,
    value: "8",
    label: "Published Courses",
    change: "+2",
    trend: "up",
    color: "primary",
  },
  {
    icon: Eye,
    value: "45.2K",
    label: "Total Views",
    change: "+8.3%",
    trend: "up",
    color: "accent",
  },
];

const courses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    status: "Published",
    students: 12453,
    revenue: 18680,
    rating: 4.8,
    reviews: 3421,
    lessons: 142,
  },
  {
    id: "2",
    title: "React & TypeScript Complete Guide",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    status: "Published",
    students: 8932,
    revenue: 11234,
    rating: 4.9,
    reviews: 2156,
    lessons: 98,
  },
  {
    id: "3",
    title: "Advanced JavaScript Patterns",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500",
    status: "Draft",
    students: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
    lessons: 45,
  },
];

const revenueData = [
  { month: "Jan", revenue: 1850 },
  { month: "Feb", revenue: 2100 },
  { month: "Mar", revenue: 2400 },
  { month: "Apr", revenue: 2800 },
  { month: "May", revenue: 3100 },
  { month: "Jun", revenue: 3420 },
];

const studentData = [
  { month: "Jan", students: 245 },
  { month: "Feb", students: 298 },
  { month: "Mar", students: 356 },
  { month: "Apr", students: 412 },
  { month: "May", students: 478 },
  { month: "Jun", students: 542 },
];

export default CreatorDashboard;
