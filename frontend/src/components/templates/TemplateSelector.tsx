import { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { templatesApi } from '@/lib/api';
import type { TaskTemplate } from 'shared/types';
import { Loader2 } from 'lucide-react';

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSelectTemplate: (template: TaskTemplate) => void;
}

export function TemplateSelector({
  open,
  onOpenChange,
  projectId,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, projectId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [projectTemplates, globalTemplates] = await Promise.all([
        templatesApi.listByProject(projectId),
        templatesApi.listGlobal(),
      ]);
      setTemplates([...projectTemplates, ...globalTemplates]);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    searchQuery
      ? template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description &&
          template.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const handleSelectTemplate = (template: TaskTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to create a task with predefined fields
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? 'No templates match your search' : 'No templates available'}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid gap-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <CardTitle className="text-base">
                            {template.template_name}
                          </CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          {template.title}
                        </CardDescription>
                      </div>
                      {template.project_id === null && (
                        <Badge variant="secondary" className="ml-2">
                          Global
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {template.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}{' '}
            available
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
