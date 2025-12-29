export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              Prom<span className="text-accent">ysr</span>
            </span>
            <span className="text-[8px] text-muted-foreground align-super">™</span>
          </div>
          
          <p className="text-muted-foreground text-sm">
            Turning promises into contracts.
          </p>
          
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Promysr. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}