import { Button } from "@/components/ui/button";
import { Download, Users, User, FileSpreadsheet, Upload, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { PromysrPromise } from "@/types/promysr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { parseISO, compareDesc } from "date-fns";
import { useState } from "react";

interface AnalyticsViewProps {
    promises: PromysrPromise[];
    userEmail?: string;
    userRole?: 'admin' | 'member';
}

export function AnalyticsView({ promises, userEmail, userRole = 'member' }: AnalyticsViewProps) {
    const [viewMode, setViewMode] = useState<'me' | 'org'>(userRole === 'admin' ? 'org' : 'me');
    const [hasEnrichedData, setHasEnrichedData] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string>('All');

    // MOCK DATA for demo purposes since backend schema update isn't requested yet
    const DEPARTMENTS = ['All', 'Sales', 'Engineering', 'Marketing', 'Product'];
    const LOCATIONS = ['All', 'New York', 'London', 'Remote', 'Bangalore'];

    // FILTER LOGIC
    const safePromises = Array.isArray(promises) ? promises : [];

    // In a real app, we would filter by the enriched 'department' field here
    const filteredPromises = viewMode === 'me'
        ? safePromises.filter(p => p.owner_email === userEmail)
        : safePromises;

    // 1. CALCULATE METRICS
    const closedCount = filteredPromises.filter(p => p.status === 'Closed').length;
    const missedCount = filteredPromises.filter(p => p.status === 'Missed').length;
    const openCount = filteredPromises.filter(p => p.status === 'Open').length;
    const totalClosedMissed = closedCount + missedCount;

    const reliabilityScore = totalClosedMissed > 0
        ? Math.round((closedCount / totalClosedMissed) * 100)
        : 100;

    // 2. STREAK LOGIC
    const missedDates = filteredPromises
        .filter(p => p.status === 'Missed')
        .map(p => parseISO(p.due_date))
        .sort(compareDesc);

    let streakDays = 0;
    if (missedDates.length === 0) {
        streakDays = filteredPromises.length > 0 ? 999 : 0;
    } else {
        const lastMiss = missedDates[0];
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastMiss.getTime());
        streakDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 3. CHART DATA
    const data = [
        { name: 'On Time', value: closedCount, color: '#22c55e' },
        { name: 'Missed', value: missedCount, color: '#ef4444' },
        { name: 'Open', value: openCount, color: '#3b82f6' },
    ];

    const handleEnrichData = () => {
        // Simulate CSV Upload / Data Processing
        const toastId = toast.loading("Parsing CSV and enriching profile data...");
        setTimeout(() => {
            setHasEnrichedData(true);
            toast.dismiss(toastId);
            toast.success("Data Enriched!", { description: "You can now filter by Department and Location." });
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER & CONTROLS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* EXPORT CSV */}
                    <Button
                        variant="outline"
                        onClick={() => {
                            const headers = ["ID", "Promise", "Owner", "Due Date", "Status"];
                            const rows = filteredPromises.map(p => [
                                p.id,
                                `"${p.promise_text.replace(/"/g, '""')}"`,
                                p.owner_email,
                                p.due_date,
                                p.status
                            ]);
                            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `promysr_export_${new Date().toISOString().split('T')[0]}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>

                    {/* ENRICH DATA BUTTON (Pro feature simulation) */}
                    {!hasEnrichedData && viewMode === 'org' && (
                        <Button onClick={handleEnrichData} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
                            <Upload className="w-4 h-4 mr-2" /> Enrich Data (CSV)
                        </Button>
                    )}

                    {/* FILTERS (Visible only after enrichment) */}
                    {hasEnrichedData && viewMode === 'org' && (
                        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border/50">
                            <select
                                className="bg-transparent text-sm font-medium px-2 py-1 outline-none text-foreground"
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                            >
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className="text-muted-foreground/30">|</span>
                            <select className="bg-transparent text-sm font-medium px-2 py-1 outline-none text-foreground">
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    )}

                    {/* VIEW TOGGLE */}
                    {userRole === 'admin' && (
                        <div className="bg-muted p-1 rounded-lg flex text-sm font-medium shrink-0">
                            <button
                                onClick={() => setViewMode('me')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'me' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <User className="w-4 h-4" /> Me
                            </button>
                            <button
                                onClick={() => setViewMode('org')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'org' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Users className="w-4 h-4" /> Org
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                {/* KPI CARDS */}
                <Card className="lg:col-span-1 shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Reliability Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${reliabilityScore >= 90 ? 'text-success' : reliabilityScore >= 70 ? 'text-warning' : 'text-destructive'}`}>
                                {reliabilityScore}%
                            </span>
                            <span className="text-sm text-muted-foreground">overall</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {viewMode === 'org' ? 'Clean Streak' : 'Current Streak'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {streakDays === 999 ? "∞" : streakDays} <span className="text-sm font-normal text-muted-foreground">days</span>
                        </div>
                    </CardContent>
                </Card>

                {/* DISTRIBUTION CHART */}
                <Card className="md:col-span-2 lg:col-span-2 shadow-sm flex flex-col">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-medium">Promise Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[150px] flex items-center justify-center">
                        {filteredPromises.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm">No data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Legend */}
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground ml-4">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> On Track</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Open</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Missed</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* DATA ENRICHMENT CTA (Empty State) */}
            {
                !hasEnrichedData && viewMode === 'org' && (
                    <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-8 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Missing Department Data</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Upload a CSV with columns <code>email, department, location</code> to unlock detailed breakdown by team and office.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" onClick={() => {
                                const csvContent = "Email,Department,Location\njohn@example.com,Sales,New York\njane@example.com,Engineering,Remote";
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", "promysr_dept_template.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}>
                                <Download className="w-4 h-4 mr-2" /> Download Template
                            </Button>
                            <Button onClick={handleEnrichData}>
                                Upload Employee CSV
                            </Button>
                        </div>
                    </div>
                )
            }

            {/* ADVANCED REPORT (Mocked) */}
            {
                hasEnrichedData && viewMode === 'org' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            Breakdown by {selectedDept === 'All' ? 'Department' : selectedDept}
                        </h3>
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="p-3 pl-4">Department</th>
                                        <th className="p-3">Head Count</th>
                                        <th className="p-3">Reliability</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="p-3 pl-4 font-medium">Sales</td>
                                        <td className="p-3">12</td>
                                        <td className="p-3 text-success font-bold">94%</td>
                                        <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Excellent</span></td>
                                    </tr>
                                    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="p-3 pl-4 font-medium">Engineering</td>
                                        <td className="p-3">24</td>
                                        <td className="p-3 text-warning font-bold">82%</td>
                                        <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Average</span></td>
                                    </tr>
                                    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="p-3 pl-4 font-medium">Marketing</td>
                                        <td className="p-3">5</td>
                                        <td className="p-3 text-success font-bold">98%</td>
                                        <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Top Tier</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
