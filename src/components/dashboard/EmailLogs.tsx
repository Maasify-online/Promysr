import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EmailLog {
    id: string;
    email_type: string;
    recipient_email: string;
    subject: string;
    sent_at: string;
    status: string;
}

export function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('emails_log')
                .select('*')
                .order('sent_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching email logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle className="h-4 w-4 text-blue-500" />;
            case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Activity Logs
                        </CardTitle>
                        <CardDescription>
                            Recent emails sent by the system (Last 50)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                        {loading ? 'Loading...' : `${logs.length} Logs`}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No email logs found yet.</p>
                        <p className="text-xs mt-1">Sent emails will appear here.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-card hover:bg-slate-50 transition-colors gap-3">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wider">
                                                {log.email_type.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-sm font-medium truncate">{log.subject}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span className="font-medium text-slate-700">To: {log.recipient_email}</span>
                                            <span>•</span>
                                            <span>{format(new Date(log.sent_at), 'PPP p')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full w-fit">
                                        {getStatusIcon(log.status)}
                                        <span className="text-xs font-medium capitalize">{log.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
