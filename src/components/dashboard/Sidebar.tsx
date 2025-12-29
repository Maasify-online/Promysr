import { LayoutDashboard, Users, BarChart2, Settings, HelpCircle, LogOut, FileCheck, Lock, UserCog, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    onSignOut: () => void;
    className?: string;
    subscriptionPlan?: string; // 'starter_999' | 'pro_1999'
    userRole?: 'admin' | 'member';
}

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

// EXTRACTED CONTENT COMPONENT
function SidebarContent({ activeTab, onTabChange, onSignOut, className, subscriptionPlan = 'starter_999', userRole = 'member', onItemClick }: SidebarProps & { onItemClick?: () => void }) {
    // PLAN HELPERS
    const isBasic = (subscriptionPlan === 'starter_999' || subscriptionPlan === 'basic_999');

    // Basic Menu
    const menu = [
        { id: 'overview', label: 'My Commitments', icon: LayoutDashboard, locked: false },
        { id: 'team', label: 'All Promises', icon: Users, locked: false },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, locked: isBasic },
    ];

    // Premium Menu Item
    const premiumItem = {
        id: 'user_dashboards',
        label: 'User Dashboards',
        icon: UserCog,
        locked: isBasic,
        hidden: userRole !== 'admin'
    };

    const settingsItem = {
        id: 'settings',
        label: 'Org Settings',
        icon: Settings,
        locked: false,
        hidden: userRole !== 'admin'
    };

    const fullMenu = [...menu, premiumItem, settingsItem];

    const handleItemClick = (item: any) => {
        if (item.hidden) return;
        onTabChange(item.id);
        if (onItemClick) onItemClick(); // Close sheet if mobile
    };

    return (
        <div className={cn("pb-12 h-screen bg-card border-r border-border w-64 flex flex-col", className)}>
            <div className="space-y-4 py-4 flex-1 flex flex-col">
                <div className="px-6 py-4 flex items-center">
                    <img src="/promysr-logo.png" alt="PromySr Logo" className="h-12 w-auto" />
                </div>

                <div className="px-3 py-2 flex-1">
                    <div className="mt-8">
                        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Work
                        </h3>
                        <nav className="space-y-1 px-2">
                            <Button
                                variant={activeTab === 'overview' ? "outline" : "ghost"}
                                className={cn("w-full justify-start relative", activeTab === 'overview' && "border-primary/50 text-primary font-bold bg-primary/5")}
                                onClick={() => handleItemClick({ id: 'overview' })}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                My Commitments
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start relative text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                                onClick={() => { window.location.href = '/user-portal'; if (onItemClick) onItemClick(); }}
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                Focus Mode
                            </Button>
                        </nav>
                    </div>
                    <div className="space-y-1 mt-8"> {/* Added mt-8 for spacing */}
                        {fullMenu.map((item: any) => {
                            if (item.hidden) return null;
                            return (
                                <Button
                                    key={item.id}
                                    variant={activeTab === item.id ? "outline" : "ghost"}
                                    className={cn("w-full justify-start relative", activeTab === item.id && "border-primary/50 text-primary font-bold bg-primary/5")}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                    {item.locked && (
                                        <Lock className="w-3 h-3 ml-auto text-muted-foreground opacity-70" />
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-3 py-2 mt-auto w-full">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                        <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={onSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}

// DESKTOP SIDEBAR
export function Sidebar(props: SidebarProps) {
    return (
        <div className="hidden md:block min-h-screen">
            <SidebarContent {...props} />
        </div>
    );
}

// MOBILE SIDEBAR
export function MobileSidebar(props: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SidebarContent {...props} onItemClick={() => setOpen(false)} className="border-none" />
            </SheetContent>
        </Sheet>
    );
}
