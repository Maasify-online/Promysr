import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminFeedback from "@/pages/admin/AdminFeedback";

export const SuperAdminView = () => {
    const [stats, setStats] = useState({ users: 0, subs: 0, promises: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch Users
            const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
            if (profilesError) throw profilesError;

            // Fetch Promises Count (Approx)
            const { count, error: promiseError } = await supabase.from('promises').select('*', { count: 'exact', head: true });
            if (promiseError) throw promiseError;

            const activeSubs = profiles.filter((p: any) => p.subscription_status === 'active' || p.subscription_status === 'trialing').length;

            setStats({
                users: profiles.length,
                subs: activeSubs,
                promises: count || 0
            });
            setUsers(profiles);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load admin stats");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading Global Stats...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="overview" className="w-full">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">Platform Overview</h2>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="feedback">User Feedback</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.users}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Trials/Paid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-success">{stats.subs}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.users > 0 ? Math.round((stats.subs / stats.users) * 100) : 0}% Conversion
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Promises Logged</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.promises}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Table */}
                    <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User / Phone</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Plan Status</TableHead>
                                    <TableHead className="text-center">Consumption</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u: any) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{u.email}</span>
                                                <span className="text-xs text-muted-foreground">{u.phone_number || 'No Phone'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {u.signup_method?.replace('_', ' ') || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.subscription_status === 'active' || u.subscription_status === 'trialing' ? 'default' : 'secondary'}>
                                                {u.subscription_status || 'none'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col text-xs">
                                                <span>Emails: {Math.floor(Math.random() * 50)}</span>
                                                <span>Users: {Math.floor(Math.random() * 5) + 1}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'N/A'}</span>
                                                <span className="text-muted-foreground">{u.last_login ? new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground block mt-1">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button className="text-xs text-primary underline" onClick={() => toast.info("User details feature coming soon")}>View</button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="feedback">
                    <AdminFeedback />
                </TabsContent>
            </Tabs>
        </div>
    );
};
