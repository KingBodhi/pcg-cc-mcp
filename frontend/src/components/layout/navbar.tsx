import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  Settings,
  Plus,
} from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { ProfileSection } from '@/components/layout/profile-section';
import { useSearch } from '@/contexts/search-context';
import { openTaskForm } from '@/lib/openTaskForm';
import { useProject } from '@/contexts/project-context';
import { showProjectForm } from '@/lib/modals';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';


export function Navbar() {
  const { projectId, project } = useProject();
  const { query, setQuery, active, clear, registerInputRef } = useSearch();
  const handleOpenInEditor = useOpenProjectInEditor(project || null);

  const setSearchBarRef = useCallback(
    (node: HTMLInputElement | null) => {
      registerInputRef(node);
    },
    [registerInputRef]
  );

  const handleCreateTask = () => {
    if (projectId) {
      openTaskForm({ projectId });
    }
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  const handleProjectSettings = async () => {
    try {
      await showProjectForm({ project });
      // Settings saved successfully - no additional action needed
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  return (
    <div className="border-b bg-background">
      <div className="w-full px-4">
        <div className="flex items-center h-14 py-2">
          {/* Logo */}
          <div className="flex items-center mr-6">
            <img
              src="/pcg-cc-logo.png"
              alt="PCG Dashboard"
              className="h-8 w-auto"
            />
          </div>

          <div className="flex-1">
            <SearchBar
              ref={setSearchBarRef}
              className="max-w-md"
              value={query}
              onChange={setQuery}
              disabled={!active}
              onClear={clear}
              project={project || null}
            />
          </div>

          <div className="flex items-center gap-3">
            {projectId && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenInIDE}
                  aria-label="Open project in IDE"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProjectSettings}
                  aria-label="Project settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateTask}
                  aria-label="Create new task"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Separator */}
                <div className="h-4 w-px bg-border" />
              </>
            )}
            
            <ProfileSection />
          </div>
        </div>
      </div>
    </div>
  );
}
