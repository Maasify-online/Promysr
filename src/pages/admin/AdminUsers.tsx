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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Trash2, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone?: string;
  subscription_plan: string;
  account_status?: string; // New field
  created_at: string;
  promiseCount: number;
  keptCount: number;
  brokenCount: number;
  emails_used: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, disabled

  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
  const [userToView, setUserToView] = useState<UserWithStats | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all promises to calculate stats
      const { data: promises, error: promisesError } = await supabase
        .from("promises")
        .select("leader_id, status");

      if (promisesError) throw promisesError;

      // Get email usage stats (Group by recipient)
      const { data: emailLogs, error: emailError } = await supabase
        .from("emails_log")
        .select("recipient_email");

      const emailCounts: Record<string, number> = {};
      if (emailLogs) {
        emailLogs.forEach(log => {
          const email = log.recipient_email?.toLowerCase();
          if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
        });
      }

      // Calculate stats per user
      const usersWithStats: UserWithStats[] = (profiles || []).map(profile => {
        const userPromises = promises?.filter(p => p.leader_id === profile.id) || [];
        const userEmailLower = profile.email?.toLowerCase() || "";

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone: "—",
          subscription_plan: (profile as any).subscription_status || "trial",
          account_status: (profile as any).account_status || "active",
          created_at: profile.created_at,
          promiseCount: userPromises.length,
          keptCount: userPromises.filter(p => p.status === 'kept').length,
          brokenCount: userPromises.filter(p => p.status === 'broken').length,
          emails_used: emailCounts[userEmailLower] || 0 // Real count
        };
      });

      setUsers(usersWithStats);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query) ||
        u.company_name?.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(u => u.account_status === statusFilter);
    }

    setFilteredUsers(result);
  };

  const handleToggleStatus = async (user: UserWithStats) => {
    const newStatus = user.account_status === "active" ? "disabled" : "active";
    try {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({ account_status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`User ${newStatus === 'active' ? 'activated' : 'disabled'} successfully`);

      // Optimistic update
      setUsers(users.map(u => u.id === user.id ? { ...u, account_status: newStatus } : u));
    } catch (error: any) {
      // If RLS blocks it, it might fail silently or throw, so we catch it
      toast.error("Failed to update status: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast.success("User deleted successfully");
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const getIntegrityBadge = (kept: number, broken: number) => {
    if (kept + broken === 0) {
      return <Badge variant="outline">No data</Badge>;
    }
    const rate = Math.round((kept / (kept + broken)) * 100);
    if (rate >= 80) {
      return <Badge className="bg-success/10 text-success border-success/20">{rate}%</Badge>;
    }
    if (rate >= 50) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">{rate}%</Badge>;
    }
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{rate}%</Badge>;
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
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage (Email / Promises)</TableHead>
                <TableHead>Integrity</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || "Guest User"}</p>
                      <p className="text-xs text-muted-foreground">{user.company_name || "Independent"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.subscription_plan?.includes('pro') ? 'default' :
                        user.subscription_plan?.includes('trial') ? 'secondary' : 'outline'
                    }>
                      {user.subscription_plan?.split('_')[0].toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{user.email}</p>
                      <p className="text-muted-foreground text-xs">{user.phone || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.account_status === 'disabled' ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        <span className="font-medium">{user.emails_used}</span> emails sent
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.promiseCount} promises logged
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getIntegrityBadge(user.keptCount, user.brokenCount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUserToView(user)}
                      >
                        <span className="sr-only">View Details</span>
                        <Search className="h-4 w-4 text-primary" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.account_status === 'active' ? (
                              <>
                                <Ban className="mr-2 h-4 w-4" /> Disable Account
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" /> Activate Account
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer account
              <b> {userToDelete?.email}</b> and remove their data from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* USER DETAIL DIALOG (Correct Placement) */}
      <Dialog open={!!userToView} onOpenChange={() => setUserToView(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {userToView?.full_name || "Guest"}
              <Badge variant="outline">{userToView?.subscription_plan}</Badge>
            </DialogTitle>
            <DialogDescription>
              {userToView?.email} • Joined {userToView?.created_at && format(new Date(userToView.created_at), "PPP")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg border text-center">
              <div className="text-2xl font-bold">{userToView?.promiseCount}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Promises</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border text-center">
              <div className="text-2xl font-bold">{userToView?.emails_used}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Emails Sent</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border text-center">
              <div className="text-2xl font-bold">
                {userToView && Math.round((userToView.keptCount / (userToView.keptCount + userToView.brokenCount || 1)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Integrity Rate</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Activity Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span>Account Status</span>
                <Badge variant={userToView?.account_status === 'active' ? "default" : "destructive"}>
                  {userToView?.account_status?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span>Promises Kept</span>
                <span className="text-green-600 font-bold">{userToView?.keptCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900 text-sm">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Customer Insight</h4>
            <p className="text-blue-700 dark:text-blue-400">
              {userToView?.promiseCount === 0 ? "This user hasn't started yet. Consider sending an activation email or offer." :
                (userToView?.keptCount || 0) > (userToView?.brokenCount || 0) ? "This user is highly engaged and reliable. A prime candidate for Pro tier." :
                  "This user struggles to keep promises. They might need accountabilty coaching features."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;