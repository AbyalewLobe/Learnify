import { Link } from "react-router-dom";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-subtle py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">Simple & Transparent</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Pricing that grows
            <span className="text-primary block">with your success</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Keep 90% of your earnings. No hidden fees, no subscriptions. Only pay when you earn.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 hover-lift">
              <CardHeader className="text-center pb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl mb-2">Creator Plan</CardTitle>
                <p className="text-muted-foreground">Everything you need to succeed</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Revenue Split */}
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <div className="text-5xl font-bold mb-2">
                    <span className="text-primary">90%</span>
                    <span className="text-muted-foreground text-3xl ml-2">/ 10%</span>
                  </div>
                  <div className="text-muted-foreground">
                    You keep 90% of every sale
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    We take 10% to maintain the platform
                  </div>
                </div>

                {/* Example */}
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 space-y-3">
                  <div className="font-semibold text-accent">Example Earnings</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Course Price</span>
                      <span className="font-medium">$49.99</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee (10%)</span>
                      <span className="font-medium">-$5.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Your Earnings</span>
                      <span className="text-accent text-lg">$44.99</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="font-semibold text-lg">What's Included</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-accent" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6 text-center">
                  <Button size="lg" asChild className="gradient-primary shadow-glow">
                    <Link to="/auth?mode=signup">
                      Start Teaching Today <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    No credit card required • Start for free
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to start earning?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of creators already earning on Learnify
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg">
            <Link to="/auth?mode=signup">
              Create Your First Course <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const features = [
  "Unlimited course uploads",
  "HD video hosting",
  "Student analytics dashboard",
  "Course builder tools",
  "Automated payments",
  "Marketing support",
  "Student messaging",
  "Certificate generation",
  "Custom pricing control",
  "Revenue tracking",
  "Promotional tools",
  "24/7 creator support",
];

const faqs = [
  {
    question: "How do payments work?",
    answer: "When a student purchases your course, you receive 90% of the sale. Payments are processed securely and transferred to your account on a regular schedule.",
  },
  {
    question: "Are there any upfront costs?",
    answer: "No! It's completely free to create and publish courses. You only pay the 10% platform fee when you make a sale.",
  },
  {
    question: "Can I set my own course prices?",
    answer: "Yes, you have complete control over your course pricing. Set one-time prices, run promotions, or offer discounts as you see fit.",
  },
  {
    question: "How often do I get paid?",
    answer: "Earnings are transferred to your account monthly. You can track your revenue in real-time through your creator dashboard.",
  },
  {
    question: "What about transaction fees?",
    answer: "The 10% platform fee covers all transaction processing, hosting, and platform maintenance. There are no additional hidden fees.",
  },
  {
    question: "Can I offer my courses for free?",
    answer: "Absolutely! You can set any course to free if you want to build your audience or give back to the community.",
  },
];

export default Pricing;
