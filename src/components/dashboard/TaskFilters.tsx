import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FilterType = 'all' | 'overdue' | 'high_priority' | 'completed';

interface TaskFiltersProps {
    currentFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    counts: {
        all: number;
        overdue: number;
        high_priority: number;
        completed: number;
    }
}

export function TaskFilters({ currentFilter, onFilterChange, counts }: TaskFiltersProps) {
    const filters: { id: FilterType, label: string }[] = [
        { id: 'all', label: 'All Active' },
        { id: 'overdue', label: 'Overdue' },
        { id: 'high_priority', label: 'High Priority' },
        { id: 'completed', label: 'Completed' },
    ];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-2 no-scrollbar">
            {filters.map((f) => {
                const isActive = currentFilter === f.id;
                const count = counts[f.id as keyof typeof counts];

                return (
                    <Button
                        key={f.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange(f.id)}
                        className={`rounded-full h-8 px-4 whitespace-nowrap transition-all ${isActive ? 'shadow-md bg-gradient-to-r from-accent to-primary border-none text-white' : 'border-dashed'}`}
                    >
                        {f.label}
                        {count > 0 && (
                            <Badge
                                variant="secondary"
                                className={`ml-2 h-5 px-1.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : ''}`}
                            >
                                {count}
                            </Badge>
                        )}
                    </Button>
                )
            })}
        </div>
    );
}
