import { Users, Zap, Target } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "73%",
    label: "Commitments Lost",
    description: "of meeting commitments never get tracked",
  },
  {
    icon: Zap,
    value: "24hr",
    label: "Response Time",
    description: "average handshake confirmation",
  },
  {
    icon: Target,
    value: "94%",
    label: "Accountability Rate",
    description: "with Promysr tracking active",
  },
];

export function Stats() {
  return (
    <section className="py-16 px-6 border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="flex items-start gap-4 opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm font-medium text-foreground">{stat.label}</div>
                <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}