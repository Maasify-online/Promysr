import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, User, Shield, Briefcase, Zap, AlertTriangle, ListX, Clock, Ban } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-primary/20 via-blue-400/10 to-transparent rounded-full blur-3xl opacity-50 animate-blob mix-blend-multiply" />
        <div className="absolute top-[20%] right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl opacity-40 animate-blob animation-delay-2000 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-40 animate-blob animation-delay-4000 mix-blend-multiply" />
      </div>

      {/* 1. NAVBAR */}
      {/* 1. NAVBAR */}
      <header className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-border/20 transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/promysr-logo.png" alt="PromySr Logo" className="h-8 w-auto md:h-10 transition-transform group-hover:scale-105" />
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden md:inline-flex hover:bg-primary/5">Login</Button>
            <Button size="sm" onClick={() => navigate('/signup')} className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              <span className="hidden sm:inline">Start Closing Loops</span>
              <span className="sm:hidden">Get Started</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-16">

        {/* 2. HERO */}
        <section className="container max-w-4xl mx-auto px-4 text-center space-y-6 mb-24 relative">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-center mb-6">
              <img src="/promysr-logo.png" alt="PromySr Logo" className="h-20 md:h-32 w-auto animate-float" />
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-balance leading-[1.1] md:leading-[1.15] pt-2">
              The Most Expensive Sentence at Work: <br />
              <span className="promysr-gradient-text animate-shimmer italic pb-2 md:pb-4 px-1 inline-block leading-normal">“Let Me Follow Up.”</span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed text-balance animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-backwards">
            PromySr closes loops so promises don’t slip through.
          </p>

          <div className="flex flex-col items-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-backwards">
            <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl shadow-primary/30 group hover:scale-105 transition-all duration-300 bg-gradient-to-r from-accent to-primary hover:opacity-90 border-t border-white/20 relative overflow-hidden" onClick={() => navigate('/signup')}>
              <span className="relative z-10 flex items-center">Start Closing Loops <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
            </Button>
            <p className="text-sm font-medium text-muted-foreground opacity-80">
              ₹999 / month · 7-day trial · No credit card required
            </p>
          </div>
        </section>

        {/* 3. THE PROBLEM */}
        <section id="problem" className="container max-w-5xl mx-auto px-4 mb-16 md:mb-24">
          <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-backwards">
            <h2 className="text-xs font-bold tracking-widest text-accent uppercase">The Problem</h2>
            <h3 className="text-3xl md:text-4xl font-bold promysr-gradient-text">Every week, promises are made.</h3>
            <p className="text-xl text-muted-foreground italic">"I'll get back." - "We'll approve this." - "Let's do it by Friday."</p>
            <p className="text-lg font-medium pt-4">And then… nothing happens.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: User, title: "No Owner", desc: "If everyone is responsible, no one is.", delay: "0ms" },
              { icon: Clock, title: "No Reminder", desc: "Buried in Slack, lost in email threads.", delay: "150ms" },
              { icon: Ban, title: "No Closure", desc: "It stays open forever, draining mental energy.", delay: "300ms" }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-card border border-border/50 text-center space-y-4 hover:shadow-xl hover:shadow-destructive/5 hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: item.delay }}>
                <div className="w-14 h-14 rounded-2xl bg-destructive/5 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors duration-300 flex items-center justify-center mx-auto shadow-sm">
                  <item.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold">{item.title}</h4>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
              Work doesn’t fail because people forget. <br className="hidden md:block" />
              <span className="text-destructive relative inline-block">
                It fails because no one follows up.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-destructive/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h3>
          </div>
        </section>

        {/* 4. THE SOLUTION */}
        {/* 4. THE SOLUTION */}
        <section id="solution" className="bg-gradient-to-b from-muted/30 to-background py-16 md:py-24 mb-16 md:mb-24 border-y border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-xs font-bold tracking-widest text-accent uppercase">The Solution</h2>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight promysr-gradient-text">PromySr tracks promises - not tasks.</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Write the Promise", desc: "One line. Specific. Measurable." },
                { step: "2", title: "Assign One Owner", desc: "Single point of accountability." },
                { step: "3", title: "Set a Due Date", desc: "Deadlines drive action." },
                { step: "4", title: "We Remind", desc: "Until it's closed. No nagging required." }
              ].map((s, i) => (
                <div key={s.step} className="group relative p-8 bg-background rounded-2xl border border-border hover:border-primary/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                  <span className="absolute -top-6 -left-2 text-8xl font-black text-muted/20 group-hover:text-accent/10 transition-colors select-none z-0">{s.step}</span>
                  <div className="relative z-10 pt-4">
                    <h4 className="font-bold text-xl mb-3">{s.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 text-center space-y-2">
              <h4 className="text-2xl font-bold">No chasing. No awkward follow-ups.</h4>
              <p className="text-xl promysr-gradient-text font-medium bg-primary/5 inline-block px-4 py-2 rounded-lg">Just things getting done.</p>
            </div>
          </div>
        </section>

        {/* 5. DIFFERENTIATION */}
        <section className="container max-w-5xl mx-auto px-4 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold leading-tight">Most tools manage work.<br /><span className="promysr-gradient-text">PromySr manages responsibility.</span></h2>
              <p className="text-lg text-muted-foreground">This isn’t a to-do list. It’s an accountability engine designed for leaders who are tired of micromanaging.</p>
              <Button variant="outline" size="lg" className="rounded-full group" onClick={() => navigate('/signup')}>
                See the difference <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="space-y-4">
              {[
                "One owner only",
                "Due date mandatory",
                "Missed promises are visible",
                "Only the owner can close it"
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-sm hover:border-success/30 hover:shadow-md transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 group-hover:bg-success group-hover:text-white transition-colors">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-lg">{feat}</span>
                </div>
              ))}
            </div>

            {/* Comparison Redesign: Versus Cards */}
            <div className="col-span-1 md:col-span-2 mt-24 max-w-4xl mx-auto w-full">
              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-background border rounded-full p-2 hidden md:block">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-black text-xs text-muted-foreground">VS</div>
                </div>

                {/* The Old Way */}
                <div className="p-8 rounded-3xl bg-muted/30 border border-border/50 space-y-6 opacity-70 hover:opacity-100 transition-opacity">
                  <h3 className="text-xl font-bold text-muted-foreground">The Old Way</h3>
                  <ul className="space-y-4">
                    {[
                      "Unclear Tasks → Constant updates",
                      "Ownership optional (Accountability Gap)",
                      "Humans chase humans",
                      "Misses disappear into void",
                      "Activity logs (No trust score)"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground line-through decoration-destructive/30 decoration-2">
                        <X className="w-5 h-5 text-destructive/40 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The PromySr Way */}
                <div className="p-8 rounded-3xl bg-card border border-primary/20 shadow-xl shadow-primary/5 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-accent/10 rounded-bl-2xl text-xs font-bold text-accent">RECOMMENDED</div>
                  <h3 className="text-xl font-bold text-foreground">The PromySr Way</h3>
                  <ul className="space-y-4">
                    {[
                      "Promises → Clear Outcomes",
                      "Ownership Enforced (Single Owner)",
                      "System Follows Up Automatically",
                      "Misses Are Visible & Tracked",
                      "Trust is Measured (Integrity Score)"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 font-medium">
                        <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 6. AUDIENCE */}
        <section className="container max-w-5xl mx-auto px-4 mb-24 text-center">
          <h2 className="text-3xl font-bold mb-12 promysr-gradient-text">Who PromySr Is For?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Founders", icon: Shield, color: "text-primary", bg: "bg-primary/10" },
              { label: "Agency Owners", icon: Briefcase, color: "text-accent", bg: "bg-accent/10" },
              { label: "Sales Managers", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
              { label: "Account Managers", icon: User, color: "text-accent", bg: "bg-accent/10" }
            ].map((p, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-background hover:bg-muted/50 transition-all border border-border/50 hover:border-border flex flex-col items-center gap-4 cursor-default shadow-sm hover:shadow-lg">
                <div className={`w-14 h-14 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <p.icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-lg">{p.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-xl text-muted-foreground max-w-2xl mx-auto bg-muted/30 p-6 rounded-2xl">
            Anyone tired of reminding people. If you’ve ever said <span className="text-foreground font-semibold">“Let me follow up”</span> - PromySr is for you.
          </p>
        </section>

        {/* 7. HOW IT WORKS */}
        <section className="bg-primary/5 py-24 mb-32 border-y border-primary/10">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-16 promysr-gradient-text">How It Works?</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { title: "Create a PromySr", desc: "Log the commitment in seconds.", step: "Step 1" },
                { title: "Assign One Owner", desc: "Tag the person responsible.", step: "Step 2" },
                { title: "We Remind", desc: "Automatic nudges until it's done.", step: "Step 3" }
              ].map((item, i) => (
                <div key={i} className="bg-background p-8 rounded-2xl shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">{item.step}</span>
                  <h3 className="text-2xl font-bold mt-2 mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-16 text-lg font-medium inline-block border-b-2 border-primary/20 pb-1">That’s it. You’re live in under 60 seconds.</p>
          </div>
        </section>

        {/* 8. PRICING */}
        <section className="container max-w-7xl mx-auto px-4 mb-32" id="pricing">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-sm font-bold tracking-widest text-accent uppercase">Transparent Pricing</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight promysr-gradient-text">Invest in Integrity.</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Costs less than a single missed deadline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* BASIC */}
            <div className="relative group p-6 rounded-3xl bg-background border border-border flex flex-col hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-md">Starter</span>
              </div>
              <h4 className="text-2xl font-bold mb-2">Basic</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold tracking-tight">₹999</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 10 Users', '100 Promises / mo', 'Team Pulse View', 'Email Reminders'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/signup')}>Start 7-Day Trial</Button>
            </div>

            {/* PRO */}
            <div className="relative group p-6 rounded-3xl bg-card border-2 border-primary shadow-2xl shadow-primary/10 flex flex-col transform hover:-translate-y-2 transition-transform duration-300 z-10">
              <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">Most Popular</span>
              </div>
              <div className="mb-4 mt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">Growth</span>
              </div>
              <h4 className="text-2xl font-bold mb-2">Pro</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold tracking-tight">₹1999</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 25 Users', 'Unlimited Promises', 'Analytics & Trends', 'User Dashboards'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg" onClick={() => navigate('/signup')}>Start 7-Day Trial</Button>
            </div>

            {/* ULTIMATE */}
            <div className="relative group p-6 rounded-3xl bg-background border border-border flex flex-col hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-md">Scale</span>
              </div>
              <h4 className="text-2xl font-bold mb-2">Ultimate</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold tracking-tight">₹3999</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 100 Users', 'Everything in Pro', 'Priority Support', 'Whatsapp Enablement'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/signup')}>Start 7-Day Trial</Button>
            </div>

            {/* CUSTOM */}
            <div className="relative group p-6 rounded-3xl bg-muted/20 border border-dashed border-border flex flex-col hover:border-primary/30 transition-all duration-300">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">Enterprise</span>
              </div>
              <h4 className="text-2xl font-bold mb-2">Custom</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-bold tracking-tight text-muted-foreground">Contact Us</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {['100+ Users', 'SSO & Audit Logs', 'Dedicated Success Mgr', 'Custom Contracts'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" className="w-full rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = 'mailto:sales@promysr.com'}>Contact Sales</Button>
            </div>

          </div>
        </section>

        {/* 9. WHAT WE DON'T DO */}
        <section className="container max-w-4xl mx-auto px-4 mb-32 text-center">
          <h2 className="text-2xl font-bold mb-10">What PromySr Doesn't Do</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['No Noise', 'No Complex Setup', 'No Unnecessary Features', 'No Micromanagement'].map((no) => (
              <span key={no} className="px-6 py-3 rounded-full bg-muted/60 text-foreground border border-border/50 font-medium flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors cursor-default">
                <X className="w-4 h-4 opacity-70" /> {no}
              </span>
            ))}
          </div>
          <p className="mt-10 text-xl font-medium tracking-tight">Just clean follow-ups that actually close.</p>
        </section>

        {/* 10. FAQ SECTION (NEW) */}
        <section className="container max-w-3xl mx-auto px-4 mb-32">
          <h2 className="text-3xl font-bold text-center mb-12 promysr-gradient-text">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is there a free trial?", a: "Yes! You get a 7-day all-access free trial to the Pro plan. No credit card required to start." },
              { q: "Can I upgrade later?", a: "Absolutely. You can switch plans or cancel at any time from your dashboard settings." },
              { q: "What happens if I miss a promise?", a: "PromySr marks it as 'Missed'. It stays visible until you close it or renegotiate. This builds accountability." },
              { q: "Do you have a mobile app?", a: "PromySr is a fully responsive Progressive Web App (PWA). You can install it on your home screen for an app-like experience." }
            ].map((item, i) => (
              <div key={i} className="group border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:bg-muted/5 transition-all cursor-default">
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  {item.q}
                  <span className="text-primary/50 group-hover:text-primary transition-colors text-xl">+</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="container max-w-2xl mx-auto px-4 text-center mb-24 space-y-10">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Stop chasing. <br />
            <span className="promysr-gradient-text">Start closing.</span>
          </h2>
          <div className="flex flex-col items-center gap-5">
            <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-2xl shadow-primary/40 animate-pulse hover:animate-none bg-gradient-to-r from-accent to-primary text-primary-foreground hover:scale-105 transition-transform" onClick={() => navigate('/signup')}>
              Start Using PromySr →
            </Button>
            <p className="text-sm font-medium text-muted-foreground">
              ₹999 / month · 7-day trial
            </p>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 py-12 bg-muted/10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <img src="/promysr-logo.png" alt="PromySr Logo" className="h-8 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
            <div className="h-8 w-px bg-border/50" />
            <a href="https://www.maasify.online" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-start gap-1 opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Powered By</span>
              <img src="/maasify-logo.png" alt="MaaSify" className="h-12 w-auto grayscale group-hover:grayscale-0 transition-all mix-blend-multiply" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 PromySr Inc. Built strictly for closers.</p>
        </div>
      </footer>

    </div>
  );
};

export default Index;