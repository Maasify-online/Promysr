import { PromysrPromise } from "@/types/promysr";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ActivityFeedProps {
    promises: PromysrPromise[];
}

export function ActivityFeed({ promises }: ActivityFeedProps) {
    // Sort by most recently updated (or created)
    // Since we don't have a separate audit log, we use the promise itself
    // For 'Open', we use created_at. For 'Closed'/'Missed', we assume updated_at is the event time.
    const activity = [...promises].sort((a, b) => {
        const dateA = a.updated_at ? parseISO(a.updated_at) : parseISO(a.created_at);
        const dateB = b.updated_at ? parseISO(b.updated_at) : parseISO(b.created_at);
        return dateB.getTime() - dateA.getTime();
    }).slice(0, 10); // Last 10 items

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Accountability Trail
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time commitment tracking</p>
            </div>
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                    {activity.map((p) => {
                        const date = p.updated_at ? parseISO(p.updated_at) : parseISO(p.created_at);
                        const isClosed = p.status === 'Closed';
                        const isMissed = p.status === 'Missed';
                        const isPending = p.status === 'Pending Verification';

                        let action = "committed to";
                        let actionColor = "text-blue-600";

                        if (isClosed) {
                            action = "delivered on commitment";
                            actionColor = "text-green-600";
                        } else if (isMissed) {
                            action = "missed commitment";
                            actionColor = "text-red-600";
                        } else if (isPending) {
                            action = "submitted for verification";
                            actionColor = "text-amber-600";
                        }

                        return (
                            <div key={p.id} className="flex gap-4 relative group">
                                {/* Connector Line */}
                                <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-border group-last:hidden" />

                                <Avatar className="h-6 w-6 border bg-background shrink-0 z-10">
                                    <AvatarFallback className="text-[9px]">
                                        {p.owner_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1 pb-1">
                                    <p className="text-sm">
                                        <span className="font-medium text-foreground">{p.owner_name}</span>{" "}
                                        <span className={`${actionColor} font-medium`}>{action}</span>
                                    </p>
                                    <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 text-sm italic text-muted-foreground w-full break-words">
                                        "{p.promise_text}"
                                    </div>
                                    <p className="text-xs text-muted-foreground/60">
                                        {formatDistanceToNow(date, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
