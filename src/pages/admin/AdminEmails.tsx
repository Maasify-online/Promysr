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
import { Loader2, Search, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  sent_at: string;
  promise_id: string | null;
}

const AdminEmails = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [searchQuery, emails]);

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("emails_log")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setEmails(data || []);
      setFilteredEmails(data || []);
    } catch (error) {
      console.error("Error loading emails:", error);
      toast.error("Failed to load email logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmails = () => {
    if (!searchQuery) {
      setFilteredEmails(emails);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = emails.filter(email =>
      email.recipient_email.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.status.toLowerCase().includes(query)
    );
    setFilteredEmails(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success/10 text-success border-success/20">Delivered</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      default:
        return <Badge className="bg-primary/10 text-primary border-primary/20">Sent</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      handshake: "bg-accent/10 text-accent border-accent/20",
      reminder: "bg-warning/10 text-warning border-warning/20",
      digest: "bg-primary/10 text-primary border-primary/20",
      negotiation: "bg-secondary text-secondary-foreground",
    };
    return <Badge className={colors[type] || "bg-muted text-muted-foreground"}>{type}</Badge>;
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
          <h1 className="text-3xl font-bold">Email Logs</h1>
          <p className="text-muted-foreground">Recent email activity ({emails.length} items)</p>
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

      {filteredEmails.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No email logs found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>{getTypeBadge(email.email_type)}</TableCell>
                  <TableCell className="font-medium">{email.recipient_email}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {email.subject}
                  </TableCell>
                  <TableCell>{getStatusBadge(email.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(email.sent_at), "MMM d, h:mm a")}
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

export default AdminEmails;