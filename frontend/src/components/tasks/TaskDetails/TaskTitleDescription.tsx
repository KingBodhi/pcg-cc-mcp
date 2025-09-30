import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskWithAttemptStatus } from 'shared/types';
import { MarkdownPreview } from '@/components/editor/RichTextEditor';

interface TaskTitleDescriptionProps {
  task: TaskWithAttemptStatus;
}

export function TaskTitleDescription({ task }: TaskTitleDescriptionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  return (
    <div>
      <h2 className="text-lg font-medium mb-1 line-clamp-2">{task.title}</h2>

      <div className="mt-2">
        <div className="flex items-start gap-2 text-sm text-secondary-foreground">
          {task.description ? (
            <div className="flex-1 min-w-0">
              <div
                className={`${
                  !isDescriptionExpanded && task.description.length > 350
                    ? 'max-h-40 overflow-hidden'
                    : ''
                }`}
              >
                <MarkdownPreview value={task.description} />
              </div>
              {task.description.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="mt-1 p-0 h-auto text-sm text-secondary-foreground hover:text-foreground"
                >
                  {isDescriptionExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <p className="italic text-muted-foreground">No description provided</p>
          )}
        </div>
      </div>
    </div>
  );
}
