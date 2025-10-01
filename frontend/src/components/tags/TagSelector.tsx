import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Plus, X } from 'lucide-react';
import { useTagStore } from '@/stores/useTagStore';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  projectId: string;
  taskId: string;
  className?: string;
}

export function TagSelector({ projectId, taskId, className }: TagSelectorProps) {
  const { getTagsForProject, getTagsForTask, addTaskTag, removeTaskTag } = useTagStore();

  const allTags = getTagsForProject(projectId);
  const selectedTags = getTagsForTask(projectId, taskId);
  const selectedTagIds = new Set(selectedTags.map((tag) => tag.id));

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.has(tagId)) {
      removeTaskTag(taskId, tagId);
    } else {
      addTaskTag(taskId, tagId);
    }
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Selected Tags */}
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            borderColor: `${tag.color}40`,
          }}
          className="border gap-1 pr-1"
        >
          {tag.name}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTaskTag(taskId, tag.id);
            }}
            className="ml-1 hover:bg-black/10 rounded-sm p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}

      {/* Add Tag Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleToggleTag(tag.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
