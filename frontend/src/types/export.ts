export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  fields?: string[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface TaskExportData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  created_at: string;
  updated_at: string;
  parent_task_id?: string;
}
