import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PromysrPromise } from "@/types/promysr";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isToday, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle, Flame, Ghost, Star, TrendingUp } from "lucide-react";

interface LeaderViewProps {
    promises: PromysrPromise[];
}

export function LeaderView({ promises }: LeaderViewProps) {
    // 1. MORNING BRIEF (Promises Due Today)
    const todayPromises = promises.filter(p => p.status === 'Open' && isToday(parseISO(p.due_date)));

    // 2. PERFORMANCE MATRIX CALCULATION
    const peopleMap = new Map<string, { name: string, email: string, missed: number, closed: number, total: number }>();

    promises.forEach(p => {
        const key = p.owner_email || 'Unknown';
        const current = peopleMap.get(key) || {
            name: p.owner_name || key.split('@')[0],
            email: key,
            missed: 0,
            closed: 0,
            total: 0
        };

        current.total++;
        if (p.status === 'Missed') current.missed++;
        if (p.status === 'Closed') current.closed++;

        peopleMap.set(key, current);
    });

    const matrix = Array.from(peopleMap.values()).map(p => {
        const reliability = p.closed / (p.total - (p.total - p.closed - p.missed) || 1); // Only count closed/missed for score? Or just closed/total? Sticking to Closed / (Closed+Missed) is standard integrity.
        // Let's use Closed / (Closed + Missed)
        const validPromises = p.closed + p.missed;
        const score = validPromises > 0 ? (p.closed / validPromises) * 100 : 100;

        let archetype = 'Steady';
        let icon = CheckCircle;
        let color = 'text-muted-foreground';

        // THRESHOLDS
        const HIGH_VOL = 5;
        const HIGH_REL = 80;

        if (score >= HIGH_REL && p.total >= HIGH_VOL) { archetype = 'Star'; icon = Star; color = 'text-warning'; }
        else if (score < HIGH_REL && p.total >= HIGH_VOL) { archetype = 'Chaos Agent'; icon = Flame; color = 'text-destructive'; }
        else if (score < HIGH_REL && p.total < HIGH_VOL) { archetype = 'Ghost'; icon = Ghost; color = 'text-muted-foreground'; }
        else { archetype = 'Steady'; icon = TrendingUp; color = 'text-success'; } // High Rel, Low Vol

        return { ...p, score, archetype, icon, color };
    });

    // Sort by Risk (Chaos Agents first)
    matrix.sort((a, b) => {
        const riskOrder: Record<string, number> = { 'Chaos Agent': 0, 'Ghost': 1, 'Star': 2, 'Steady': 3 };
        return riskOrder[a.archetype] - riskOrder[b.archetype];
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Leader Command</h2>
                    <p className="text-muted-foreground">Risk analysis and daily briefing.</p>
                </div>
            </div>

            {/* SECTION 1: MORNING BRIEF */}
            <Card className="border-l-4 border-l-primary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Morning Brief <Badge variant="secondary">{todayPromises.length} Due Today</Badge>
                    </CardTitle>
                    <CardDescription>Promises from your team that are due before midnight.</CardDescription>
                </CardHeader>
                <CardContent>
                    {todayPromises.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No critical deadlines today. All clear.</p>
                    ) : (
                        <div className="space-y-2">
                            {todayPromises.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-[10px]">{p.owner_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{p.promise_text}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">{p.owner_email}</span>
                                        {/* Leader Action Placeholder */}
                                        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Nudge</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECTION 2: PERFORMANCE MATRIX */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Matrix</CardTitle>
                    <CardDescription>Classifying team members by Velocity and Reliability.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Archetype</TableHead>
                                <TableHead>Reliability</TableHead>
                                <TableHead>Velocity (Total)</TableHead>
                                <TableHead>Risk Level</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrix.map((p) => (
                                <TableRow key={p.email}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarFallback>{p.name.substring(0, 2)}</AvatarFallback></Avatar>
                                            <div className="flex flex-col">
                                                <span>{p.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{p.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`flex items-center gap-1.5 font-medium ${p.color}`}>
                                            <p.icon className="w-4 h-4" /> {p.archetype}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-bold ${p.score >= 80 ? 'text-success' : p.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                                            {Math.round(p.score)}%
                                        </span>
                                    </TableCell>
                                    <TableCell>{p.total} promises</TableCell>
                                    <TableCell>
                                        {p.archetype === 'Chaos Agent' && <Badge variant="destructive">High Risk</Badge>}
                                        {p.archetype === 'Ghost' && <Badge variant="secondary">Disengaged</Badge>}
                                        {p.archetype === 'Star' && <Badge className="bg-success/15 text-success hover:bg-success/25 border-hidden shadow-none">Optimal</Badge>}
                                        {p.archetype === 'Steady' && <span className="text-muted-foreground text-sm">Low</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
