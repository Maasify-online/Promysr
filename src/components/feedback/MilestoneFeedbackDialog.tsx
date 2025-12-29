import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MilestoneFeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    milestone: number;
    userId: string;
    onSubmitted: () => void;
}

export function MilestoneFeedbackDialog({ open, onOpenChange, milestone, userId, onSubmitted }: MilestoneFeedbackDialogProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a star rating");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback' as any)
                .insert({
                    user_id: userId,
                    milestone: milestone,
                    rating: rating,
                    comment: comment,
                });

            if (error) throw error;

            toast.success("Thank you for your feedback!");
            onSubmitted(); // Callback to close and mark as done locally if needed
            onOpenChange(false);
        } catch (error) {
            console.error("Feedback error:", error);
            toast.error("Failed to submit feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2 w-fit">
                        <Star className="w-8 h-8 text-primary fill-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Congratulations!</DialogTitle>
                    <DialogDescription className="text-center">
                        You've completed <strong>{milestone} actions</strong> on PromySr.
                        <br />
                        How has your experience been so far?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Star Rating */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-8 h-8 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Comment Area */}
                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Anything we can improve? (Optional)
                        </label>
                        <Textarea
                            placeholder="I love the detailed analytics..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting ? "Sending..." : "Submit Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
