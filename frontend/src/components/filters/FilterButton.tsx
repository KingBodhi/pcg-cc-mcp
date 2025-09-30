import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilterStore } from '@/stores/useFilterStore';
import { getActiveFilterCount } from '@/utils/filterUtils';

interface FilterButtonProps {
  projectId: string;
  onClick: () => void;
}

export function FilterButton({ projectId, onClick }: FilterButtonProps) {
  const { getActiveFilters } = useFilterStore();
  const activeFilters = getActiveFilters(projectId);
  const filterCount = getActiveFilterCount(activeFilters);

  return (
    <Button
      variant={filterCount > 0 ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="gap-2 relative"
    >
      <Filter className="h-4 w-4" />
      Filter
      {filterCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-1 px-1.5 py-0 h-5 text-xs"
        >
          {filterCount}
        </Badge>
      )}
    </Button>
  );
}