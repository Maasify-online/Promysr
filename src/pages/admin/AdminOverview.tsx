import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Mail, UserPlus } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPromises: number;
  promisesKept: number;
  promisesBroken: number;
  waitlistCount: number;
  emailsSent: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPromises: 0,
    promisesKept: 0,
    promisesBroken: 0,
    waitlistCount: 0,
    emailsSent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get promises stats
      const { data: promises } = await supabase
        .from("promises")
        .select("status");

      const promisesKept = promises?.filter(p => p.status === 'kept').length || 0;
      const promisesBroken = promises?.filter(p => p.status === 'broken').length || 0;

      // Get waitlist count
      const { count: waitlistCount } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });

      // Get email count
      const { count: emailCount } = await supabase
        .from("emails_log")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: userCount || 0,
        totalPromises: promises?.length || 0,
        promisesKept,
        promisesBroken,
        waitlistCount: waitlistCount || 0,
        emailsSent: emailCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const integrityRate = stats.promisesKept + stats.promisesBroken > 0
    ? Math.round((stats.promisesKept / (stats.promisesKept + stats.promisesBroken)) * 100)
    : 0;

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Waitlist", value: stats.waitlistCount, icon: UserPlus, color: "text-accent" },
    { title: "Total Promises", value: stats.totalPromises, icon: FileText, color: "text-foreground" },
    { title: "Emails Sent", value: stats.emailsSent, icon: Mail, color: "text-muted-foreground" },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Platform-wide statistics and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Promise Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Promises Kept</span>
              <span className="font-bold text-success">{stats.promisesKept}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Promises Broken</span>
              <span className="font-bold text-destructive">{stats.promisesBroken}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">Platform Integrity Rate</span>
              <span className={`font-bold text-xl ${integrityRate >= 80 ? 'text-success' : integrityRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                {integrityRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to manage waitlist entries, view users, and monitor email delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;