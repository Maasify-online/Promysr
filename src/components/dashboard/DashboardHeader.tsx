import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Plus, Settings, BarChart2 } from "lucide-react";
import type { Profile } from "@/pages/Dashboard";

interface DashboardHeaderProps {
  profile: Profile | null;
  onCreateClick: () => void;
  onReportsClick?: () => void;
}

export function DashboardHeader({ profile, onCreateClick, onReportsClick }: DashboardHeaderProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            Prom<span className="text-accent">ysr</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {onReportsClick && (
            <Button variant="ghost" size="icon" onClick={onReportsClick} title="Integrity Report">
              <BarChart2 className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}

          <Button onClick={onCreateClick} className="rounded-full font-medium shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            New Promise
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
            <span className="text-sm text-muted-foreground">
              {profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}