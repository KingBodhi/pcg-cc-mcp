import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['↑', '↓'], description: 'Navigate tasks vertically' },
      { keys: ['←', '→'], description: 'Navigate columns horizontally' },
      { keys: ['Enter'], description: 'Open task details' },
      { keys: ['Esc'], description: 'Close dialog / Go back' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['C'], description: 'Create new task' },
      { keys: ['E'], description: 'Edit selected task' },
      { keys: ['D'], description: 'Duplicate selected task' },
      { keys: ['Delete'], description: 'Delete selected task' },
      { keys: ['F'], description: 'Toggle fullscreen' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['⌘', 'F'], description: 'Focus search' },
      { keys: ['/'], description: 'Slash commands (in input)' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
];

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if we're in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Only open on ? if not in input
      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for keyboard shortcuts in the dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs px-2 py-0.5"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Press <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> anytime to view this help overlay.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> <Badge variant="outline" className="font-mono text-xs mx-1">⌘</Badge> on Mac is{' '}
            <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl</Badge> on Windows/Linux.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}