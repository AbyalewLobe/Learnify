import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Heart, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-subtle py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold">
              Empowering Learning,<br />
              <span className="text-primary">One Course at a Time</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to make quality education accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
              <p className="text-xl text-muted-foreground">
                At Learnify, we believe that everyone deserves access to quality education. We're building a platform that connects passionate creators with curious learners, making it easy for anyone to teach or learn new skills.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Our Vision</h3>
                  <p className="text-muted-foreground">
                    To become the world's most trusted online learning platform, where anyone can acquire the skills they need to succeed in their career and life.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">Our Values</h3>
                  <p className="text-muted-foreground">
                    We prioritize quality, accessibility, and community. Every decision we make is guided by our commitment to learners and creators.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Drives Us
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Our Story</h2>
            
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Learnify was founded in 2023 with a simple idea: make it easy for experts to share their knowledge and for learners to access quality education from anywhere in the world.
              </p>
              
              <p>
                We noticed that traditional education was expensive, inflexible, and often out of reach for many people. Meanwhile, talented professionals had valuable knowledge to share but lacked the platform to reach students effectively.
              </p>
              
              <p>
                Today, Learnify has grown into a thriving community of over 50,000 students and 5,000 creators. We've facilitated millions of dollars in transactions and helped countless people acquire new skills, change careers, and achieve their goals.
              </p>
              
              <p>
                But we're just getting started. We're constantly improving our platform, adding new features, and working to make online education more accessible, engaging, and effective.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              By The Numbers
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-5xl font-bold">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const values = [
  {
    icon: Users,
    title: "Community First",
    description: "We build for our community of learners and creators, listening to their needs.",
  },
  {
    icon: Target,
    title: "Quality Focus",
    description: "Every course is reviewed to ensure high standards and valuable learning outcomes.",
  },
  {
    icon: Heart,
    title: "Accessibility",
    description: "Education should be available to everyone, regardless of background or location.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We constantly evolve our platform with new features and improvements.",
  },
];

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "5K+", label: "Expert Creators" },
  { value: "10K+", label: "Courses Available" },
  { value: "4.8", label: "Avg. Course Rating" },
];

export default About;
