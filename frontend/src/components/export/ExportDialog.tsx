import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TaskWithAttemptStatus } from 'shared/types';
import type { ExportFormat } from '@/types/export';
import { exportTasks } from '@/utils/exportUtils';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskWithAttemptStatus[];
  projectName: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  tasks,
  projectName,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');

  const handleExport = () => {
    try {
      exportTasks(tasks, format, projectName);
      toast.success(`Exported ${tasks.length} tasks as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Tasks</DialogTitle>
          <DialogDescription>
            Export {tasks.length} tasks to a file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV (Comma-Separated Values)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON (JavaScript Object Notation)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>The exported file will include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Task title and description</li>
              <li>Status and priority</li>
              <li>Assignee information</li>
              <li>Created and updated timestamps</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
