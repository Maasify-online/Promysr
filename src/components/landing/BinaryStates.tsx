import { Check, X } from "lucide-react";

export function BinaryStates() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Two States. <span className="text-accent">No Excuses.</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
          "In progress" is where accountability goes to die. 
          Promysr forces clarity: you either kept your word, or you didn't.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-stretch max-w-2xl mx-auto">
          {/* Kept */}
          <div className="flex-1 p-8 rounded-2xl border-2 border-success bg-success/5 shadow-card hover:shadow-card-hover transition-all">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-success" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-bold text-success mb-2">KEPT</h3>
            <p className="text-muted-foreground">
              Delivered on time. Trust earned. Integrity proven.
            </p>
          </div>
          
          {/* Divider */}
          <div className="flex items-center justify-center text-3xl font-light text-muted-foreground/30">
            or
          </div>
          
          {/* Broken */}
          <div className="flex-1 p-8 rounded-2xl border-2 border-destructive/50 bg-destructive/5 shadow-card hover:shadow-card-hover transition-all">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-10 h-10 text-destructive" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-bold text-destructive mb-2">BROKEN</h3>
            <p className="text-muted-foreground">
              Missed or never delivered. Trust cost. Visible record.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}