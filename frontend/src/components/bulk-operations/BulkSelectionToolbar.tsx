import { Button } from '@/components/ui/button';
import { X, CheckSquare } from 'lucide-react';
import { BulkActionMenu } from './BulkActionMenu';

interface BulkSelectionToolbarProps {
  projectId: string;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export function BulkSelectionToolbar({
  projectId,
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
}: BulkSelectionToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="sticky top-0 z-20 bg-primary/10 border-b border-primary/20 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedCount} of {totalCount} selected
            </span>
          </div>

          {!allSelected && (
            <Button variant="link" size="sm" onClick={onSelectAll}>
              Select all {totalCount}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BulkActionMenu
            projectId={projectId}
            selectedCount={selectedCount}
            onComplete={onClearSelection}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}