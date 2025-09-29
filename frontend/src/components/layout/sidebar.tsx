import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Settings,
  BookOpen,
  MessageCircleQuestion,
  FileText,
  Plus,
  Folder,
  Loader2,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, tasksApi } from '@/lib/api';
import { showProjectForm } from '@/lib/modals';
import type { Project, TaskWithAttemptStatus } from 'shared/types';

interface SidebarProps {
  className?: string;
}

const NAVIGATION_ITEMS = [
  { label: 'Projects', icon: FolderOpen, to: '/projects', id: 'projects' },
  { label: 'Nora Assistant', icon: Crown, to: '/nora', id: 'nora' },
  { label: 'Settings', icon: Settings, to: '/settings', id: 'settings' },
];

const EXTERNAL_LINKS = [
  {
    label: 'Docs',
    icon: BookOpen,
    href: 'https://duckkanban.com/docs',
  },
  {
    label: 'Support',
    icon: MessageCircleQuestion,
    href: 'https://github.com/BloopAI/duck-kanban/issues',
  },
];

interface ProjectFolderProps {
  project: Project;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProjectFolder({ project, isActive, isExpanded, onToggle }: ProjectFolderProps) {
  const location = useLocation();
  const shouldFetchTasks =
    isExpanded || location.pathname.includes(`/projects/${project.id}/tasks`);

  const {
    data: tasksData = [],
    isLoading: isTasksLoading,
    error: tasksError,
  } = useQuery<TaskWithAttemptStatus[], Error>({
    queryKey: ['projectTasksSidebar', project.id],
    queryFn: () => tasksApi.getAll(project.id),
    enabled: shouldFetchTasks,
    staleTime: 60 * 1000,
  });

  const displayTasks = useMemo(() => {
    if (!tasksData || tasksData.length === 0) return [];
    return [...tasksData]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 5);
  }, [tasksData]);

  const extraTasksCount = Math.max(0, (tasksData?.length ?? 0) - displayTasks.length);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between px-2 py-1.5 h-auto font-normal",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-2 text-left">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate">{project.name}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6">
        <div className="space-y-0.5 py-1">
          <Link
            to={`/projects/${project.id}/tasks`}
            className={cn(
              "block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground",
              location.pathname.includes(`/projects/${project.id}/tasks`) &&
                "bg-accent text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>Tasks</span>
              {tasksData && tasksData.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {tasksData.length}
                </span>
              )}
            </div>
          </Link>

          {isTasksLoading && shouldFetchTasks && (
            <div className="pl-7 pr-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading tasks...
            </div>
          )}

          {tasksError && shouldFetchTasks && !isTasksLoading && (
            <div className="pl-7 pr-2 py-1 text-xs text-destructive">
              Failed to load tasks
            </div>
          )}

          {!isTasksLoading && !tasksError && displayTasks.map((task) => (
            <Link
              key={task.id}
              to={`/projects/${project.id}/tasks/${task.id}`}
              className={cn(
                "block pl-7 pr-2 py-1 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground",
                location.pathname.includes(`/tasks/${task.id}`) &&
                  "bg-accent text-accent-foreground"
              )}
            >
              <span className="truncate" title={task.title}>
                {task.title}
              </span>
            </Link>
          ))}

          {!isTasksLoading && !tasksError && extraTasksCount > 0 && (
            <div className="pl-7 pr-2 py-1 text-xs text-muted-foreground">
              +{extraTasksCount} more tasks
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projectId ? [projectId] : [])
  );

  useEffect(() => {
    if (!projectId) return;
    setExpandedProjects((prev) => {
      if (prev.has(projectId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  }, [projectId]);

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateProject = async () => {
    const existingIds = new Set(projects.map((project) => project.id));

    try {
      const result = await showProjectForm();
      if (result === 'saved') {
        const { data: updatedProjects } = await refetchProjects();

        if (updatedProjects && updatedProjects.length > 0) {
          const newProject = updatedProjects.find(
            (project) => !existingIds.has(project.id)
          );

          if (newProject) {
            setExpandedProjects((prev) => {
              const next = new Set(prev);
              next.add(newProject.id);
              return next;
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to create project from sidebar:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-r", className)}>
      {/* Main Navigation */}
      <div className="p-3 border-b">
        <div className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            
            return (
              <Link key={item.id} to={item.to}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 py-2 h-auto font-medium",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-accent"
            onClick={handleCreateProject}
            >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {isProjectsLoading ? (
              <div className="py-4 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading projects...
              </div>
            ) : projectsError ? (
              <div className="py-4 text-xs text-destructive">
                Failed to load projects
              </div>
            ) : projects.length === 0 ? (
              <div className="py-4 text-xs text-muted-foreground">
                No projects yet. Create one to get started.
              </div>
            ) : (
              projects.map((project) => (
                <ProjectFolder
                  key={project.id}
                  project={project}
                  isActive={project.id === projectId}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggle={() => toggleProject(project.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* External Links */}
      <div className="p-3 border-t">
        <div className="space-y-1">
          {EXTERNAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
