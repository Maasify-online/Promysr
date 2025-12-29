import { CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { PromysrPromise } from "@/types/promysr";

interface DashboardStatsProps {
  incoming: PromysrPromise[]; // I Owe
  outgoing: PromysrPromise[]; // They Owe
}

export function DashboardStats({ incoming, outgoing }: DashboardStatsProps) {
  // Stats for "My Integrity" (Based on what I Owe)
  const myKept = incoming.filter(p => p.status === 'Closed').length;
  const myMissed = incoming.filter(p => p.status === 'Missed').length;
  const myOpen = incoming.filter(p => p.status === 'Open').length;

  const myIntegrityScore = myKept + myMissed > 0
    ? Math.round((myKept / (myKept + myMissed)) * 100)
    : 100;

  // Stats for "Their Reliability" (Based on what They Owe)
  const theirOpen = outgoing.filter(p => p.status === 'Open').length;
  const theirMissed = outgoing.filter(p => p.status === 'Missed').length;

  const statItems = [
    {
      label: "My Integrity",
      value: `${myIntegrityScore}%`,
      icon: CheckCircle2,
      color: myIntegrityScore >= 80 ? "text-success" : myIntegrityScore >= 50 ? "text-warning" : "text-destructive",
      bgColor: myIntegrityScore >= 80 ? "bg-success/10" : myIntegrityScore >= 50 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      label: "I Owe (Active)",
      value: myOpen.toString(),
      icon: ArrowDownLeft,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "They Owe (Active)",
      value: theirOpen.toString(),
      icon: ArrowUpRight,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "My Missed",
      value: myMissed.toString(),
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Bad Debt (Them)",
      value: theirMissed.toString(),
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}