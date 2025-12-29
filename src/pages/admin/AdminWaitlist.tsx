import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WaitlistEntry {
  id: string;
  email: string;
  company_name: string | null;
  created_at: string;
}

const AdminWaitlist = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    const { data, error } = await supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading waitlist:", error);
      toast.error("Failed to load waitlist");
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("waitlist")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
    } else {
      setEntries(entries.filter(e => e.id !== id));
      toast.success("Entry deleted");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Email", "Company", "Signed Up"],
      ...entries.map(e => [
        e.email,
        e.company_name || "",
        format(new Date(e.created_at), "yyyy-MM-dd HH:mm")
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promysr-waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Waitlist exported");
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Waitlist</h1>
          <p className="text-muted-foreground">{entries.length} people waiting for access</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <p className="text-muted-foreground">No waitlist entries yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.company_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default AdminWaitlist;