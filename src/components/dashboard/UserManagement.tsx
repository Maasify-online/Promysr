import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationMember } from "@/types/promysr";
import { Lock, UserCog, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserManagementProps {
    members: OrganizationMember[];
    onToggleLogin: (userId: string, currentStatus: boolean) => void;
    onViewDashboard: (userId: string) => void;
}

export function UserManagement({ members, onToggleLogin, onViewDashboard }: UserManagementProps) {

    // Local state to simulate toggle functionality for the demo
    const [loginStatus, setLoginStatus] = useState<Record<string, boolean>>({});

    const handleToggle = (userId: string, current: boolean) => {
        // Optimistic UI update
        const newStatus = !current;
        setLoginStatus(prev => ({ ...prev, [userId]: newStatus }));
        onToggleLogin(userId, newStatus);

        if (newStatus) {
            toast.success("Login access granted");
        } else {
            toast.warning("Login access revoked");
        }
    };

    const handleViewDashboard = (member: OrganizationMember) => {
        toast.info(`Opening ${member.profile?.full_name}'s Dashboard...`, {
            description: "Impersonation mode activated."
        });
        onViewDashboard(member.user_id);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    <UserCog className="w-3 h-3 mr-1" />
                    Premium Feature
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => {
                    // Check local state or default to true
                    const isLoginEnabled = loginStatus[member.user_id] !== undefined ? loginStatus[member.user_id] : true;

                    return (
                        <Card key={member.user_id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                    <AvatarFallback className="bg-muted text-foreground">
                                        {member.profile?.full_name?.substring(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <CardTitle className="text-base truncate">
                                        {member.profile?.full_name || 'Unknown User'}
                                    </CardTitle>
                                    <CardDescription className="text-xs truncate">
                                        {member.profile?.email}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                                        <span className="font-medium">Role</span>
                                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {member.role === 'admin' ? 'Leader' : 'Member'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                                        <span className="font-medium">Login Access</span>
                                        <Switch
                                            checked={isLoginEnabled}
                                            onCheckedChange={() => handleToggle(member.user_id, isLoginEnabled)}
                                        />
                                    </div>

                                    <Button
                                        size="sm"
                                        className="w-full mt-2"
                                        variant="outline"
                                        onClick={() => handleViewDashboard(member)}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-2" />
                                        View Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {/* Add New User Placeholder */}
                <Card className="border-dashed flex items-center justify-center p-6 bg-muted/5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
                    <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <p className="font-medium">Invite Member</p>
                        <p className="text-xs text-muted-foreground">Add to team</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
