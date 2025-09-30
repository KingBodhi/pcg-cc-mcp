import { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, FolderPlus, ListTodo, Tag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action: () => void;
}

interface SlashCommandMenuProps {
  open: boolean;
  search: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  commands: SlashCommand[];
}

export function SlashCommandMenu({
  open,
  search,
  onSelect,
  onClose,
  position,
  commands,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands, onSelect, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 rounded-lg border bg-popover shadow-md"
      style={{
        top: position?.top,
        left: position?.left,
      }}
    >
      <Command className="border-none">
        <CommandList>
          {filteredCommands.length === 0 ? (
            <CommandEmpty>No commands found.</CommandEmpty>
          ) : (
            <CommandGroup heading="Commands">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <CommandItem
                    key={command.id}
                    onSelect={() => onSelect(command)}
                    className={cn(
                      'cursor-pointer',
                      index === selectedIndex && 'bg-accent'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{command.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {command.description}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}

// Hook to manage slash commands in an input
export function useSlashCommands(commands: SlashCommand[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [slashIndex, setSlashIndex] = useState(-1);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    cursorPosition?: number
  ) => {
    const value = e.target.value;
    const cursor = cursorPosition ?? e.target.selectionStart ?? 0;

    // Find the last slash before cursor
    let lastSlash = -1;
    for (let i = cursor - 1; i >= 0; i--) {
      if (value[i] === '/') {
        // Check if it's at start or after a space
        if (i === 0 || value[i - 1] === ' ' || value[i - 1] === '\n') {
          lastSlash = i;
          break;
        }
      }
      // Stop if we hit a space (slash commands are single words)
      if (value[i] === ' ' || value[i] === '\n') {
        break;
      }
    }

    if (lastSlash >= 0) {
      const searchText = value.substring(lastSlash + 1, cursor);
      setSlashIndex(lastSlash);
      setSearch(searchText);
      setIsOpen(true);

      // Calculate position
      const rect = e.target.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    } else {
      setIsOpen(false);
      setSearch('');
      setSlashIndex(-1);
    }

    return value;
  };

  const handleCommandSelect = (
    command: SlashCommand,
    inputValue: string,
    onUpdate: (value: string) => void
  ) => {
    if (slashIndex >= 0) {
      // Remove the slash command text and execute the command
      const cursor = slashIndex + search.length + 1;
      const newValue =
        inputValue.substring(0, slashIndex) + inputValue.substring(cursor);
      onUpdate(newValue.trim());
      command.action();
    }
    setIsOpen(false);
    setSearch('');
    setSlashIndex(-1);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setSearch('');
    setSlashIndex(-1);
  };

  return {
    isOpen,
    search,
    position,
    handleInputChange,
    handleCommandSelect,
    closeMenu,
  };
}