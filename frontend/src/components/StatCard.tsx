import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  delay?: number;
}

export const StatCard = ({ icon: Icon, value, label, color = "primary", delay = 0 }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  
  useEffect(() => {
    if (isNaN(numericValue)) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [numericValue]);

  const formatValue = () => {
    if (typeof value === 'string') {
      if (value.includes('K')) return `${(displayValue / 1000).toFixed(1)}K`;
      if (value.includes('%')) return `${displayValue}%`;
      if (value.includes('$')) return `$${displayValue.toLocaleString()}`;
      if (value.includes('h')) return `${displayValue}h`;
    }
    return displayValue;
  };

  return (
    <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-lg bg-${color}/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold">
            {isNaN(numericValue) ? value : formatValue()}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};
