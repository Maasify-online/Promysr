import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  LogOut,
  ChevronLeft,
  UserPlus,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Waitlist", icon: UserPlus, href: "/admin/waitlist" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Email Logs", icon: Mail, href: "/admin/emails" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "Security", icon: ShieldAlert, href: "/admin/security" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check for Mock Admin override (Hardcoded Admin)
      const isMockAdmin = localStorage.getItem("promysr_admin_mock") === "true";
      if (isMockAdmin) {
        setIsAdmin(true);
        setShowLogin(false);
        return;
      }

      // If not mock admin, show login
      setIsAdmin(false);
      setShowLogin(true);
    } catch (err) {
      console.error("Admin access check failed:", err);
      setIsAdmin(false);
      setShowLogin(true);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Simple Hardcoded Check
      if (email === "admin" && password === "admin") {
        localStorage.setItem("promysr_admin_mock", "true");
        await checkAdminAccess(); // Will set isAdmin=true based on flag
        return; // Return early, strictly client-side
      }

      // 2. Optional: Keep real login for other potential admins, but primary is hardcoded now
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error("Login failed", { description: error.message });
      } else {
        await checkAdminAccess();
      }
    } catch (err: any) {
      toast.error("Unexpected error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogin(true);
    setIsAdmin(null);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">
                Prom<span className="text-primary">ysr</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <CardTitle className="text-2xl">Platform Access</CardTitle>
            <CardDescription>
              Enter your credentials to access the secure admin portal.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAdminLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Username or Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Sign In to Console"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Verifying privileges...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2">
          <LogOut className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You are logged in, but you do not have permission to access the Platform Admin tool.
        </p>
        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              Prom<span className="text-accent">ysr</span>
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          {/* Back to Dashboard Removed */}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;