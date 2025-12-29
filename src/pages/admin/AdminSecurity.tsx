import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuthLog {
    id: string;
    email: string;
    event_type: string;
    details: string;
    ip_address: string;
    created_at: string;
}

const AdminSecurity = () => {
    const [logs, setLogs] = useState<AuthLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuthLog[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [searchQuery, logs]);

    const loadLogs = async () => {
        try {
            const { data, error } = await (supabase
                .from("auth_logs") as any)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;
            setLogs(data || []);
            setFilteredLogs(data || []);
        } catch (error) {
            console.error("Error loading auth logs:", error);
            // Fail silently for now as table might not be populated heavily yet
        } finally {
            setIsLoading(false);
        }
    };

    const filterLogs = () => {
        if (!searchQuery) {
            setFilteredLogs(logs);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = logs.filter(log =>
            log.email?.toLowerCase().includes(query) ||
            log.event_type.toLowerCase().includes(query) ||
            log.ip_address?.toLowerCase().includes(query)
        );
        setFilteredLogs(filtered);
    };

    const getEventBadge = (type: string) => {
        if (type.includes('failed') || type.includes('error')) {
            return <Badge variant="destructive">Failed Attempt</Badge>;
        }
        if (type.includes('success') || type.includes('login')) {
            return <Badge className="bg-success/10 text-success border-success/20">Login Success</Badge>;
        }
        return <Badge variant="secondary">{type}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-primary" />
                        Security Audit
                    </h1>
                    <p className="text-muted-foreground">Login attempts, failures, and security events</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-9 w-[300px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-16 text-center">
                    <p className="text-muted-foreground mb-4">No security logs recorded yet.</p>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            // Seed some dummy logs for demo
                            const dummyLogs = [
                                { email: 'admin@acme.com', event_type: 'login_success', details: 'Authenticated via Password', ip_address: '192.168.1.1', created_at: new Date().toISOString() },
                                { email: 'hacker@unknown.com', event_type: 'login_failed', details: 'Invalid Password', ip_address: '10.0.0.55', created_at: new Date(Date.now() - 3600000).toISOString() },
                            ];
                            const { error } = await supabase.from('auth_logs').insert(dummyLogs);
                            if (error) toast.error("Failed to seed logs: " + error.message);
                            else {
                                toast.success("Seeded demo logs!");
                                loadLogs();
                            }
                        }}
                    >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Seed Demo Logs
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>User / Email</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{getEventBadge(log.event_type)}</TableCell>
                                    <TableCell className="font-medium">{log.email || "Unknown"}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                        {log.details || "—"}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{log.ip_address || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(log.created_at), "MMM d, h:mm:ss a")}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default AdminSecurity;
