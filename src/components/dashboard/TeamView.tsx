import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PromiseInput } from "./PromiseInput";
import type { PromysrPromise, OrganizationMember } from "@/types/promysr";
import { Badge } from "@/components/ui/badge";

interface TeamViewProps {
    promises: PromysrPromise[];
    currentUserEmail?: string;
    members?: OrganizationMember[];
    userRole?: 'admin' | 'member';
    onInvite?: (email: string, name: string) => void;
    onBulkInvite?: (users: { email: string; name: string }[]) => void;
    onAddPromise?: (data: any) => Promise<void>;
    subscriptionPlan?: string;
    activePromisesCount?: number;
}

import { ArrowLeft, User, Plus, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function TeamView({
    promises,
    currentUserEmail,
    members = [],
    userRole = 'member',
    onInvite,
    onBulkInvite,
    onAddPromise,
    subscriptionPlan = 'starter_999',
    activePromisesCount = 0
}: TeamViewProps) {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [leaderboardFilter, setLeaderboardFilter] = useState<'All' | 'On Track' | 'Closed' | 'Missed'>('All');
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onInvite && inviteEmail) {
            onInvite(inviteEmail, inviteName);
            setInviteEmail("");
            setInviteName("");
            setIsInviteOpen(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "promysr_team_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkSubmit = async () => {
        if (!bulkFile || !onBulkInvite) return;

        const text = await bulkFile.text();
        const lines = text.split('\n');
        const users: { name: string; email: string }[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const [name, email] = line.split(',').map(s => s.trim());
                if (name && email) {
                    users.push({ name, email });
                }
            }
        }

        if (users.length > 0) {
            onBulkInvite(users);
            setIsBulkOpen(false);
            setBulkFile(null);
        }
    };

    // 1. Group by Person (Owner)
    const peopleMap = new Map<string, { name: string, email: string, notAchieved: number, onTrack: number, closed: number, total: number }>();

    // Seed from Members if available
    members.forEach(m => {
        const email = m.profile?.email || 'Unknown';
        peopleMap.set(email, {
            name: m.profile?.full_name || email.split('@')[0],
            email: email,
            notAchieved: 0,
            onTrack: 0,
            closed: 0,
            total: 0
        });
    });

    promises.forEach(p => {
        const key = p.owner_email || 'Unknown';
        const current = peopleMap.get(key) || {
            name: p.owner_name || key.split('@')[0],
            email: key,
            notAchieved: 0,
            onTrack: 0,
            closed: 0,
            total: 0
        };

        current.total++;
        if (p.status === 'Missed') current.notAchieved++;
        else if (p.status === 'Closed') current.closed++;
        else current.onTrack++;

        peopleMap.set(key, current);
    });

    const people = Array.from(peopleMap.values());

    // 2. DRILL DOWN VIEW
    if (selectedUser) {
        const userPromises = promises.filter(p => (p.owner_email === selectedUser));
        const userData = peopleMap.get(selectedUser);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{userData?.name || selectedUser}</h2>
                        <p className="text-muted-foreground">{selectedUser}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Promises Made</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{userData?.total || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">On Track</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">{userData?.onTrack || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Missed</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-red-600">{userData?.notAchieved || 0}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Promise Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Promise</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userPromises.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.promise_text}</TableCell>
                                        <TableCell>{format(parseISO(p.due_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={p.status === 'Missed' ? 'destructive' : p.status === 'Closed' ? 'secondary' : 'default'}>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {userPromises.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No promises found for this user.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 3. MAIN GRID VIEW
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {onAddPromise && (
                <div className="mb-8">
                    <PromiseInput
                        onSubmit={onAddPromise}
                        userEmail={currentUserEmail}
                        userRole={userRole}
                        members={members}
                        subscriptionPlan={subscriptionPlan}
                        promiseCount={activePromisesCount}
                    />
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                {/* ADD MEMBER ACTIONS */}
                {userRole === 'admin' && (
                    <div className="flex gap-2">
                        {/* BULK IMPORT */}
                        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Upload className="w-4 h-4" /> Bulk Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Bulk Import Team</DialogTitle>
                                    <DialogDescription>
                                        Upload a CSV file to add multiple members at once.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded text-green-700">
                                                <FileSpreadsheet className="w-5 h-5" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium">CSV Template</p>
                                                <p className="text-muted-foreground">Name, Email format</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Upload CSV</label>
                                        <Input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleBulkSubmit} disabled={!bulkFile}>Import Members</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* SINGLE INVITE */}
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" /> Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite Team Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to join your organization.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            required
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input
                                            placeholder="colleague@company.com"
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit">Send Invite</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* LEADERBOARD WIDGET */}
                <div className="w-full md:w-auto min-w-[300px] bg-card border rounded-xl p-4 shadow-sm hidden md:block">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-600">
                                <User className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-sm">Top Performers</h3>
                        </div>
                        <select
                            className="bg-background text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                            value={leaderboardFilter}
                            onChange={(e) => setLeaderboardFilter(e.target.value as any)}
                        >
                            <option value="All">All Activity</option>
                            <option value="On Track">On Track</option>
                            <option value="Closed">Closed</option>
                            <option value="Missed">Missed</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        {people
                            .sort((a, b) => {
                                if (leaderboardFilter === 'On Track') return b.onTrack - a.onTrack;
                                if (leaderboardFilter === 'Closed') return b.closed - a.closed;
                                if (leaderboardFilter === 'Missed') return b.notAchieved - a.notAchieved;
                                return (b.closed + b.onTrack) - (a.closed + a.onTrack);
                            })
                            .slice(0, 3)
                            .map((p, i) => (
                                <div key={p.email} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
                                            #{i + 1}
                                        </span>
                                        <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${leaderboardFilter === 'Missed'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-secondary'
                                        }`}>
                                        {leaderboardFilter === 'All' && `${p.closed + p.onTrack} Active`}
                                        {leaderboardFilter === 'On Track' && `${p.onTrack} On Track`}
                                        {leaderboardFilter === 'Closed' && `${p.closed} Closed`}
                                        {leaderboardFilter === 'Missed' && `${p.notAchieved} Missed`}
                                    </span>
                                </div>
                            ))}
                        {people.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {people.map((person) => (
                    <Card
                        key={person.email}
                        className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => setSelectedUser(person.email)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20 group-hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {person.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium leading-none group-hover:text-primary transition-colors">
                                        {person.email === currentUserEmail ? "You" : person.name}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">{person.email}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-background group-hover:bg-background/80">
                                {person.total} Promises
                            </Badge>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div className="p-2 rounded bg-muted/30 group-hover:bg-background/50 transition-colors">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">On Track</p>
                                        <p className="text-xl font-bold text-primary">{person.onTrack}</p>
                                    </div>
                                    <div className="p-2 rounded bg-muted/30 group-hover:bg-background/50 transition-colors">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Closed</p>
                                        <p className="text-xl font-bold text-muted-foreground">{person.closed}</p>
                                    </div>
                                    <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 group-hover:bg-red-100/50 dark:group-hover:bg-red-900/10 transition-colors">
                                        <p className="text-red-600 dark:text-red-400 text-[10px] uppercase font-bold">Not Achieved</p>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{person.notAchieved}</p>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to view details &rarr;
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {people.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No team data found. Start making promises to see them here.
                    </div>
                )}
            </div>
        </div>
    );
}
