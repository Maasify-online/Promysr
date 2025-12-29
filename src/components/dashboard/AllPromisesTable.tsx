import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PromysrPromise, OrganizationMember } from "@/types/promysr";
import { format, parseISO, isToday, isPast, isThisWeek, isThisMonth, startOfDay } from "date-fns";
import { CheckCircle2, Eye, Calendar, Users, Filter } from "lucide-react";

interface AllPromisesTableProps {
    promises: PromysrPromise[];
    members?: OrganizationMember[];
    currentUserEmail?: string;
    userRole?: 'admin' | 'member';
    onVerify?: (promiseId: string, status: string) => void;
}

export function AllPromisesTable({
    promises,
    members = [],
    currentUserEmail,
    userRole = 'member',
    onVerify
}: AllPromisesTableProps) {
    // Filter state
    const [whoFilter, setWhoFilter] = useState<string>('all');
    const [whenFilter, setWhenFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<'promise' | 'owner' | 'due_date' | 'status'>('due_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Get unique team members from promises and members
    const teamMembers = useMemo(() => {
        const memberMap = new Map<string, { email: string; name: string }>();

        // Add from members list
        members.forEach(m => {
            const email = m.profile?.email || '';
            if (email) {
                memberMap.set(email, {
                    email,
                    name: m.profile?.full_name || email.split('@')[0]
                });
            }
        });

        // Add from promises (in case some aren't in members list)
        promises.forEach(p => {
            if (p.owner_email && !memberMap.has(p.owner_email)) {
                memberMap.set(p.owner_email, {
                    email: p.owner_email,
                    name: p.owner_name || p.owner_email.split('@')[0]
                });
            }
        });

        return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [promises, members]);

    // Filter promises
    const filteredPromises = useMemo(() => {
        return promises.filter(p => {
            // Who filter
            if (whoFilter !== 'all' && p.owner_email !== whoFilter) return false;

            // When filter
            const dueDate = parseISO(p.due_date);
            if (whenFilter === 'today' && !isToday(dueDate)) return false;
            if (whenFilter === 'week' && !isThisWeek(dueDate)) return false;
            if (whenFilter === 'month' && !isThisMonth(dueDate)) return false;
            if (whenFilter === 'overdue' && (!isPast(dueDate) || p.status === 'Closed' || p.status === 'Missed')) return false;

            // Status filter
            if (statusFilter !== 'all' && p.status !== statusFilter) return false;

            return true;
        });
    }, [promises, whoFilter, whenFilter, statusFilter]);

    // Sort promises
    const sortedPromises = useMemo(() => {
        const sorted = [...filteredPromises];
        sorted.sort((a, b) => {
            let comparison = 0;

            switch (sortColumn) {
                case 'promise':
                    comparison = a.promise_text.localeCompare(b.promise_text);
                    break;
                case 'owner':
                    comparison = (a.owner_name || a.owner_email).localeCompare(b.owner_name || b.owner_email);
                    break;
                case 'due_date':
                    comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }, [filteredPromises, sortColumn, sortDirection]);

    const handleSort = (column: typeof sortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Closed': return 'secondary';
            case 'Missed': return 'destructive';
            case 'Pending Verification': return 'default';
            default: return 'outline';
        }
    };

    const activeFilterCount = [whoFilter !== 'all', whenFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {activeFilterCount} active
                                </Badge>
                            )}
                        </CardTitle>
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setWhoFilter('all');
                                    setWhenFilter('all');
                                    setStatusFilter('all');
                                }}
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Who Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Who
                            </label>
                            <Select value={whoFilter} onValueChange={setWhoFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Team Members" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Team Members</SelectItem>
                                    {teamMembers.map(member => (
                                        <SelectItem key={member.email} value={member.email}>
                                            {member.email === currentUserEmail ? `${member.name} (You)` : member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* When Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                When
                            </label>
                            <Select value={whenFilter} onValueChange={setWhenFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Due Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Status
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                    <SelectItem value="Missed">Missed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{sortedPromises.length}</span> of{' '}
                    <span className="font-medium text-foreground">{promises.length}</span> promises
                </p>
            </div>

            {/* Promises Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[40%]"
                                        onClick={() => handleSort('promise')}
                                    >
                                        Promise {sortColumn === 'promise' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[20%]"
                                        onClick={() => handleSort('owner')}
                                    >
                                        Owner {sortColumn === 'owner' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[15%]"
                                        onClick={() => handleSort('due_date')}
                                    >
                                        Due Date {sortColumn === 'due_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[15%]"
                                        onClick={() => handleSort('status')}
                                    >
                                        Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="w-[10%]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPromises.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No promises found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedPromises.map(promise => (
                                        <TableRow key={promise.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <div className="line-clamp-2">{promise.promise_text}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {promise.owner_email === currentUserEmail
                                                            ? 'You'
                                                            : promise.owner_name || promise.owner_email.split('@')[0]
                                                        }
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {promise.owner_email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(parseISO(promise.due_date), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(promise.status)}>
                                                    {promise.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {promise.status === 'Pending Verification' && userRole === 'admin' && onVerify && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-7 px-2 !bg-blue-600 text-white hover:!bg-blue-700"
                                                            onClick={() => onVerify(promise.id, promise.status)}
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
