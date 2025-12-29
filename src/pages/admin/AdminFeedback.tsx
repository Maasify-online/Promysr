import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackItem {
    id: string;
    user_id: string;
    milestone: number;
    rating: number;
    comment: string | null;
    created_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
}

export default function AdminFeedback() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                // Fetch feedback with user details
                const { data, error } = await supabase
                    .from('feedback' as any)
                    .select('*, profiles(full_name, email)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                // Force cast as we know the structure matches
                setFeedback((data || []) as unknown as FeedbackItem[]);
            } catch (error) {
                console.error("Error fetching feedback:", error);
                toast.error("Failed to load feedback");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            />
        ));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Feedback</h2>
                <p className="text-muted-foreground">Track user sentiment at key milestones.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Milestone Feedback</CardTitle>
                    <CardDescription>
                        Responses collected when users hit 50, 100, and 500 actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Milestone</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Loading feedback...
                                    </TableCell>
                                </TableRow>
                            ) : feedback.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No feedback received yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                feedback.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.profiles?.full_name || 'Unknown User'}</span>
                                                <span className="text-xs text-muted-foreground">{item.profiles?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                {item.milestone} Actions
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-0.5">
                                                {renderStars(item.rating)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            {item.comment ? (
                                                <span className="text-sm">{item.comment}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No comment</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
