import { ChevronRight, Home } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useProject } from '@/contexts/project-context';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function BreadcrumbNav() {
  const { projectId, taskId } = useParams<{
    projectId?: string;
    taskId?: string;
  }>();
  const { project } = useProject();

  // Fetch task if taskId is present
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId || !projectId) return null;
      const tasks = await tasksApi.getAll(projectId);
      return tasks.find((t) => t.id === taskId) || null;
    },
    enabled: !!taskId && !!projectId,
  });

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [];

  // Always start with home
  items.push({
    label: 'Projects',
    href: '/projects',
  });

  // Add project if present
  if (project && projectId) {
    items.push({
      label: project.name,
      href: `/projects/${projectId}`,
    });
  }

  // Add tasks if we're in a project
  if (project && projectId) {
    items.push({
      label: 'Tasks',
      href: `/projects/${projectId}/tasks`,
    });
  }

  // Add task if present
  if (task) {
    items.push({
      label: task.title.length > 50 ? `${task.title.substring(0, 50)}...` : task.title,
      href: `/projects/${projectId}/tasks/${taskId}`,
    });
  }

  // Don't show breadcrumbs if only at home level
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        to="/projects"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.slice(1).map((item, index) => {
        const isLast = index === items.length - 2;

        return (
          <div key={item.href} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4" />
            <Link
              to={item.href}
              className={cn(
                'hover:text-foreground transition-colors',
                isLast && 'text-foreground font-medium'
              )}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}