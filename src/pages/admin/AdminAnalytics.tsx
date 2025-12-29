import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { PromysrPromise } from "@/types/promysr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DailyStats {
  date: string;
  promises: number;
  kept: number;
  broken: number;
  open: number;
  missed: number;
}

const AdminAnalytics = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: promises } = await supabase
        .from("promises")
        .select("created_at, status, updated_at");

      // Generate last 14 days
      const last14Days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });

      const stats: DailyStats[] = last14Days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayPromises = promises?.filter(p =>
          format(new Date(p.created_at), "yyyy-MM-dd") === dateStr
        ) || [];

        // Corrected Status Logic (Case Sensitive from DB)
        const dayKept = promises?.filter(p =>
          p.status === 'Closed' && format(new Date(p.updated_at), "yyyy-MM-dd") === dateStr
        ) || [];

        const dayMissed = promises?.filter(p =>
          p.status === 'Missed' && format(new Date(p.updated_at), "yyyy-MM-dd") === dateStr
        ) || [];

        const dayOpen = dayPromises.filter(p => p.status === 'Open').length;

        return {
          date: format(day, "MMM d"),
          promises: dayPromises.length,
          kept: dayKept.length,
          broken: 0, // Deprecated/Unused
          open: dayOpen,
          missed: dayMissed.length
        };
      });

      setDailyStats(stats);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [riskUsers, setRiskUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUserRankings();
  }, []);

  const loadUserRankings = async () => {
    // 1. Get Profiles
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');

    // 2. Get Promise Counts
    const { data: promises } = await supabase.from('promises').select('leader_id');
    const promiseCounts: Record<string, number> = {};
    promises?.forEach(p => {
      promiseCounts[p.leader_id] = (promiseCounts[p.leader_id] || 0) + 1;
    });

    // 3. Get Email Counts (by email string)
    const { data: emails } = await supabase.from('emails_log').select('recipient_email');
    const emailCounts: Record<string, number> = {};
    emails?.forEach(e => {
      const em = e.recipient_email?.toLowerCase();
      if (em) emailCounts[em] = (emailCounts[em] || 0) + 1;
    });

    // 4. Combine
    const stats = (profiles || []).map(p => {
      const pCount = promiseCounts[p.id] || 0;
      const eCount = emailCounts[p.email?.toLowerCase() || ""] || 0;
      return {
        ...p,
        pCount,
        eCount,
        score: pCount + eCount
      };
    });

    // 5. Rank
    const sorted = [...stats].sort((a, b) => b.score - a.score);
    setTopUsers(sorted.slice(0, 5));
    setRiskUsers(stats.filter(s => s.pCount === 0).slice(0, 5));
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await supabase
        .from("promises")
        .select("created_at, status, updated_at, promise_text, owner_email");

      const promises = data as unknown as PromysrPromise[];

      if (!promises) return;

      const csvContent = [
        ["Date Created", "Status", "Updated At", "Owner", "Promise"],
        ...promises.map(p => [
          format(new Date(p.created_at), "yyyy-MM-dd HH:mm:ss"),
          p.status,
          format(new Date(p.updated_at), "yyyy-MM-dd HH:mm:ss"),
          p.owner_email || "Unknown",
          // Escape quotes for CSV safety
          `"${(p.promise_text || "").replace(/"/g, '""')}"`
        ])
      ].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `analytics_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // AGGREGATE STATS for Pie Chart
  const totalKept = dailyStats.reduce((acc, curr) => acc + curr.kept, 0);
  const totalMissed = dailyStats.reduce((acc, curr) => acc + curr.missed, 0);
  const pieData = [
    { name: 'Met', value: totalKept, color: '#22c55e' },
    { name: 'Not Met', value: totalMissed, color: '#ef4444' }
  ];

  return (
    <div className="p-8 pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform activity over the last 14 days</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* PIE CHART: MET VS NOT MET */}
        <Card className="md:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Promises Met vs Not Met</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {totalKept + totalMissed === 0 ? (
                <div className="text-center text-muted-foreground">No closed promises yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold">
                {totalKept + totalMissed > 0
                  ? Math.round((totalKept / (totalKept + totalMissed)) * 100) + '%'
                  : '0%'}
              </div>
              <div className="text-xs text-muted-foreground">Reliability Ratio</div>
            </div>
          </CardContent>
        </Card>

        {/* RANKINGS */}
        <div className="md:col-span-3 grid md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Top Power Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Promises</TableHead>
                    <TableHead className="text-right">Emails</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-xs">
                        {u.full_name || u.email}
                      </TableCell>
                      <TableCell className="text-right text-xs">{u.pCount}</TableCell>
                      <TableCell className="text-right text-xs">{u.eCount}</TableCell>
                      <TableCell className="text-right font-bold">{u.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-center p-4 text-muted-foreground text-sm">
                Use the <b>Users</b> tab for full detailed reports.
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                ⚠️ At Risk (Zero Activity)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Emailed?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskUsers.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-xs">
                        {u.full_name || u.email}
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.eCount > 0 ? "Yes" : "No contact"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* BAR CHART: ACTIVITY */}
        <Card className="md:col-span-3 shadow-md">
          <CardHeader>
            <CardTitle>Daily Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="kept" stackId="a" fill="#22c55e" name="Met (Closed)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="open" stackId="a" fill="#3b82f6" name="Open" />
                  <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* TOP USERS */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Top Power Users (Promises + Emails)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Coming soon (requires joining Profiles + Promises via SQL or advanced fetching).</p>
              {/* Placeholder for now to avoid breaking build with complex joins in one step */}
            </div>
          </CardContent>
        </Card>

        {/* INACTIVE USERS */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>At Risk (Zero Activity)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">List of users who haven't created a promise yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-6 mt-6 pt-6 border-t text-sm text-muted-foreground justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <span>Promises Created</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-success font-medium">+</span>
          <span>Kept</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-destructive font-medium">-</span>
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;