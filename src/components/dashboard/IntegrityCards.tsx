import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromysrPromise } from "@/types/promysr";
import { CheckCircle2, Circle, Clock, Target } from "lucide-react";

interface IntegrityCardsProps {
    promises: PromysrPromise[];
    userEmail: string | undefined;
}

export function IntegrityCards({ promises, userEmail }: IntegrityCardsProps) {
    if (!userEmail) return null;

    // 1. My Commitments (Where I am owner)
    const myPromises = promises.filter(p => p.owner_email === userEmail);
    const myClosed = myPromises.filter(p => p.status === 'Closed').length;
    const myMissed = myPromises.filter(p => p.status === 'Missed').length;
    const myOpen = myPromises.filter(p => p.status === 'Open').length;

    // Integrity Score: Closed / (Closed + Missed)
    const totalFinished = myClosed + myMissed;
    const integrityScore = totalFinished > 0
        ? Math.round((myClosed / totalFinished) * 100)
        : 100; // Start at 100% until proven otherwise

    // 2. Pending Reviews (Where I am leader and status is Open)
    // These are promises others made to me that I need to track
    const pendingReviews = promises.filter(p => p.leader_id === userEmail && p.status === 'Open').length;

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Integrity Score</CardTitle>
                    <Target className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold promysr-gradient-text">{integrityScore}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Based on {totalFinished} completed promises
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Promises</CardTitle>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{myOpen}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Promises you need to deliver
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingReviews}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Promises owed to you
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
