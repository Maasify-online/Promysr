import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, X, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        query: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animate bubble in after a small delay
    useEffect(() => {
        const timer = setTimeout(() => setShowBubble(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message sent to Promysr Support!", {
            description: "We usually reply within 24 hours."
        });

        setFormData({ name: "", email: "", phone: "", query: "" });
        setIsSubmitting(false);
        setIsOpen(false);
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

            {/* CHAT WINDOW */}
            <div
                className={cn(
                    "pointer-events-auto transition-all duration-300 origin-bottom-right shadow-2xl rounded-2xl overflow-hidden border border-border bg-card w-[350px] md:w-[380px]",
                    isOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-90 translate-y-10 h-0 w-0 overflow-hidden" // Hiding functionality when closed
                )}
            >
                {isOpen && (
                    <>
                        <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
                            <div>
                                <h3 className="font-bold flex items-center gap-2">
                                    <Smile className="w-5 h-5" /> PromySr Help Team
                                </h3>
                                <p className="text-xs text-primary-foreground/80">We typically reply in a few minutes.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-8 w-8"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-4 bg-muted/30 max-h-[70vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="s_name">Name</Label>
                                    <Input
                                        id="s_name"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s_email">Email</Label>
                                    <Input
                                        id="s_email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s_phone">Phone (Optional)</Label>
                                    <Input
                                        id="s_phone"
                                        type="tel"
                                        placeholder="+1 234..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s_query">How can we help?</Label>
                                    <Textarea
                                        id="s_query"
                                        placeholder="Describe your issue..."
                                        className="min-h-[100px]"
                                        value={formData.query}
                                        onChange={e => setFormData({ ...formData, query: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Sending..." : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" /> Send Message
                                        </>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground pt-2">
                                    Queries are sent directly to info@promysr.com
                                </p>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* FLOATING ACTION BUTTON AREA */}
            <div className="flex items-center gap-4 pointer-events-auto">

                {/* ENGAGEMENT BUBBLE */}
                <div
                    className={cn(
                        "bg-white dark:bg-zinc-800 shadow-xl rounded-2xl rounded-tr-sm px-4 py-3 transform transition-all duration-500",
                        showBubble && !isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                    )}
                >
                    <p className="font-medium text-sm text-foreground flex items-center gap-1 animate-pulse-slow">
                        How can we help? <span className="animate-bounce inline-block delay-1000 origin-bottom">👋</span>
                    </p>
                </div>

                {/* BUTTON */}
                <Button
                    onClick={toggleOpen}
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
                        isOpen ? "bg-muted text-muted-foreground rotate-90" : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
                </Button>
            </div>

            <style>{`
        @keyframes bounce-slow {
             0%, 100% { transform: translateY(0); }
             50% { transform: translateY(-5px); }
        }
        .animate-pulse-slow {
             /* Custom subtle attention grabber */
        }
      `}</style>

        </div>
    );
}
