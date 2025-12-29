import { FileText, Handshake, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Log the Promise",
    description: "Record the commitment. Who promised what, and by when. Simple as that.",
  },
  {
    number: "02",
    icon: Handshake,
    title: "Get the Handshake",
    description: "The owner receives an email. One click to accept. Or negotiate a new date.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Track the Outcome",
    description: "Did they deliver? Two states only: Kept or Broken. No hiding in progress.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-secondary/30" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three steps. No complexity. Just accountability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="relative opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-card border border-border shadow-card mb-6 relative">
                  <step.icon className="w-12 h-12 text-primary" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}