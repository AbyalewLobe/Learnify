import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Users, TrendingUp, Video, Clock, CheckCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Teach = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative gradient-primary text-primary-foreground py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold">
              Share Your Knowledge,<br />Earn While You Teach
            </h1>
            <p className="text-xl opacity-90">
              Join thousands of creators who are building successful online courses and changing lives through education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg">
                <Link to="/creator">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/marketplace">
                  See Example Courses
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {creatorStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Teach on Learnify?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, market, and sell your courses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover-lift">
                <CardContent className="p-6 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Teaching in 3 Simple Steps
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6 items-start">
                <div className="shrink-0">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-glow">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Success Stories from Our Creators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1 text-accent">
                      <Users className="h-4 w-4" />
                      <span>{testimonial.students} students</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <DollarSign className="h-4 w-4" />
                      <span>${testimonial.earnings}k earned</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Teaching Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our community of successful creators and make an impact while earning.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg shadow-glow">
            <Link to="/auth?mode=signup">
              Become a Creator <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const creatorStats = [
  { value: "5,000+", label: "Active Creators" },
  { value: "$2M+", label: "Paid to Creators" },
  { value: "50K+", label: "Students Taught" },
  { value: "90%", label: "Revenue Share" },
];

const benefits = [
  {
    icon: DollarSign,
    title: "Earn 90% Revenue",
    description: "Keep most of what you earn. We only take a small 10% platform fee to maintain our services.",
  },
  {
    icon: Users,
    title: "Built-in Audience",
    description: "Reach thousands of eager learners actively searching for courses in your niche.",
  },
  {
    icon: Video,
    title: "Easy Course Builder",
    description: "Create structured courses with our intuitive builder. Upload videos, add resources, and organize content effortlessly.",
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track your course performance with detailed analytics on students, revenue, and engagement.",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Create and update your courses on your own time. You're in control of your content and schedule.",
  },
  {
    icon: CheckCircle,
    title: "Full Support",
    description: "Get help from our dedicated creator support team and access resources to grow your teaching business.",
  },
];

const steps = [
  {
    title: "Create Your Course",
    description: "Use our intuitive course builder to structure your content, upload videos, and add resources. Set your pricing and make it your own.",
  },
  {
    title: "Get Approved",
    description: "Submit your course for a quick review. We'll make sure it meets our quality standards and provide feedback if needed.",
  },
  {
    title: "Start Earning",
    description: "Once approved, your course goes live on our marketplace. Start earning as students enroll and track your success with detailed analytics.",
  },
];

const testimonials = [
  {
    name: "John Smith",
    role: "Web Development Instructor",
    quote: "Teaching on Learnify has been life-changing. I've reached over 12,000 students and built a sustainable income stream.",
    students: "12.4K",
    earnings: "85",
  },
  {
    name: "Sarah Williams",
    role: "Design Expert",
    quote: "The platform makes it so easy to create and manage courses. I love seeing the impact my content has on students.",
    students: "8.9K",
    earnings: "62",
  },
  {
    name: "Mike Johnson",
    role: "Marketing Specialist",
    quote: "I started as a student and became a creator. The analytics help me understand what works and continuously improve.",
    students: "15.6K",
    earnings: "110",
  },
];

export default Teach;
