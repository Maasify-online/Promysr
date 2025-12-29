export function Problem() {
  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          The <span className="text-accent">Accountability Gap</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
          Every day, countless commitments are made in meetings, emails, and conversations. 
          Most disappear without a trace.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow">
            <div className="text-5xl font-bold text-primary mb-4">73%</div>
            <p className="text-muted-foreground">
              of commitments made in meetings are never tracked or followed up on
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow">
            <div className="text-5xl font-bold text-destructive mb-4">∞</div>
            <p className="text-muted-foreground">
              open loops. Deadlines slip. Trust erodes silently over time.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow">
            <div className="text-5xl font-bold text-accent mb-4">0</div>
            <p className="text-muted-foreground">
              visibility for leaders into who keeps their word and who doesn't
            </p>
          </div>
        </div>
        
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20">
          <p className="text-xl md:text-2xl font-medium text-foreground">
            "I'll get that to you by Friday" shouldn't be a hope.
            <br />
            <span className="text-accent font-bold">It should be a contract.</span>
          </p>
        </div>
      </div>
    </section>
  );
}