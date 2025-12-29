import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Mail, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: any;
    onUpdate?: () => void;
}

export function ProfileSettingsDialog({ open, onOpenChange, profile, onUpdate }: ProfileSettingsDialogProps) {
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({
            full_name: fullName
        }).eq('id', profile.id);

        if (error) {
            toast.error("Failed to update profile");
        } else {
            toast.success("Profile updated");
            if (onUpdate) onUpdate();
            onOpenChange(false);
        }
        setIsLoading(false);
    };

    const handlePasswordReset = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) {
            toast.error("Failed to send reset email");
        } else {
            toast.success("Password reset email sent to " + profile.email);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="text-lg">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm">Change Avatar</Button>
                            {/* Avatar upload is complex, sticking to URL or future implementation */}
                        </div>

                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={profile?.email} disabled className="bg-muted" />
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 py-4">
                        <div className="p-4 border rounded-lg bg-yellow-50/50 space-y-2">
                            <div className="flex items-center gap-2 font-medium text-yellow-800">
                                <Lock className="w-4 h-4" /> Password
                            </div>
                            <p className="text-sm text-muted-foreground">
                                To change your password, we'll send a secure link to your email.
                            </p>
                            <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={isLoading}>
                                Send Reset Link
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleUpdateProfile} disabled={isLoading}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
