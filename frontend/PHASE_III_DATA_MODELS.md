# Phase III: Data Models & Type Definitions Plan

## Overview
This document defines all data models, types, and state management for Phase III (Tier 3) features. It ensures type safety, consistency with existing patterns, and a working implementation on first deployment.

---

## 1. Bulk Operations (Frontend-Only)

### State Management: `useBulkSelectionStore.ts`

```typescript
import { create } from 'zustand';

interface BulkSelectionStore {
  // State
  selectedTaskIds: Set<string>;
  selectionMode: boolean; // Toggle for bulk selection UI

  // Actions
  toggleSelectionMode: () => void;
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  selectAll: (taskIds: string[]) => void;
  clearSelection: () => void;
  toggleTask: (taskId: string) => void;

  // Getters
  isSelected: (taskId: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}
```

**Implementation Strategy**:
- Frontend-only state (no backend changes needed)
- Batch existing API calls for operations
- Use `Promise.allSettled()` for parallel operations with error handling
- Toast notifications for success/partial success/failure

---

## 2. Advanced Filtering (Frontend-Only)

### Type Definitions

```typescript
// Filter operators by field type
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'in' // For multi-select (tags, status)
  | 'not_in'
  | 'before' // For dates
  | 'after'
  | 'between'
  | 'greater_than' // For numbers
  | 'less_than';

export type FilterableField =
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'assignee'
  | 'tags'
  | 'created_at'
  | 'updated_at'
  | 'due_date' // Phase III addition
  | 'estimated_hours'; // Phase III addition

export interface FilterCondition {
  id: string; // nanoid for removal
  field: FilterableField;
  operator: FilterOperator;
  value: any; // Type depends on field
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface FilterPreset {
  id: string;
  name: string;
  projectId: string;
  groups: FilterGroup[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFilterPreset {
  name: string;
  projectId: string;
  groups: FilterGroup[];
}
```

### State Management: `useFilterStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterStore {
  // Active filters
  activeFilters: Record<string, FilterGroup[]>; // projectId -> filters

  // Saved presets
  filterPresets: Record<string, FilterPreset[]>; // projectId -> presets

  // Actions - Active Filters
  setActiveFilters: (projectId: string, groups: FilterGroup[]) => void;
  addFilterGroup: (projectId: string, group: FilterGroup) => void;
  removeFilterGroup: (projectId: string, groupId: string) => void;
  updateFilterCondition: (projectId: string, groupId: string, conditionId: string, updates: Partial<FilterCondition>) => void;
  clearActiveFilters: (projectId: string) => void;

  // Actions - Presets
  savePreset: (preset: FilterPreset) => void;
  loadPreset: (projectId: string, presetId: string) => void;
  deletePreset: (projectId: string, presetId: string) => void;
  updatePreset: (projectId: string, presetId: string, updates: Partial<FilterPreset>) => void;

  // Getters
  getActiveFilters: (projectId: string) => FilterGroup[];
  getPresets: (projectId: string) => FilterPreset[];
}
```

**Implementation Strategy**:
- Frontend-only filtering logic
- Extend existing `filteredTasks` computation in project-tasks.tsx
- Persist presets to localStorage via zustand middleware
- Use existing shadcn/ui components (Select, Input, DatePicker)

---

## 3. Time Tracking (Requires Backend)

### Backend: New fields in `tasks` table

```sql
ALTER TABLE tasks ADD COLUMN start_date TEXT; -- ISO 8601
ALTER TABLE tasks ADD COLUMN due_date TEXT; -- ISO 8601
ALTER TABLE tasks ADD COLUMN estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN actual_hours REAL;
```

### Type Updates

```typescript
// Extend shared/types.ts Task type
export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  parent_task_attempt: string | null;
  created_at: string;
  updated_at: string;

  // Phase III additions
  start_date: string | null; // ISO 8601
  due_date: string | null; // ISO 8601
  estimated_hours: number | null;
  actual_hours: number | null;
};

// Update CreateTask
export type CreateTask = {
  project_id: string;
  title: string;
  description: string | null;
  parent_task_attempt: string | null;
  image_ids: Array<string> | null;

  // Phase III additions
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
};

// Update UpdateTask
export type UpdateTask = {
  title: string | null;
  description: string | null;
  status: TaskStatus | null;
  parent_task_attempt: string | null;
  image_ids: Array<string> | null;

  // Phase III additions
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
};
```

### Frontend Types

```typescript
// Helper types for time tracking UI
export interface TimeTrackingData {
  startDate: Date | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
}

export interface TimeTrackingStats {
  isOverdue: boolean;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  progressPercentage: number | null;
}
```

**Implementation Strategy**:
- **Backend**: Add migration, update Rust Task struct with ts-rs annotations
- **Frontend**: Use `react-day-picker` for date inputs, number inputs for hours
- Display progress bars, overdue indicators
- Calculate derived stats client-side

---

## 4. Task Dependencies (Requires Backend)

### Backend: New `task_dependencies` table

```sql
CREATE TABLE task_dependencies (
  id TEXT PRIMARY KEY,
  source_task_id TEXT NOT NULL,
  target_task_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL, -- 'blocks', 'blocked_by', 'relates_to'
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(source_task_id, target_task_id, dependency_type)
);

CREATE INDEX idx_task_dependencies_source ON task_dependencies(source_task_id);
CREATE INDEX idx_task_dependencies_target ON task_dependencies(target_task_id);
```

### Type Definitions

```typescript
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  dependencyType: DependencyType;
  createdAt: Date;
}

export interface CreateTaskDependency {
  sourceTaskId: string;
  targetTaskId: string;
  dependencyType: DependencyType;
}

// Extended task with dependency info
export interface TaskWithDependencies extends Task {
  blockedBy: TaskDependency[];
  blocking: TaskDependency[];
  relatedTo: TaskDependency[];
}
```

### State Management: Extend existing queries

```typescript
// Add to React Query hooks
export function useTaskDependencies(taskId: string) {
  return useQuery({
    queryKey: ['taskDependencies', taskId],
    queryFn: () => api.getTaskDependencies(taskId),
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dep: CreateTaskDependency) => api.addTaskDependency(dep),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDependencies'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

**Implementation Strategy**:
- **Backend**: Create table, CRUD endpoints, include in task responses
- **Frontend**: Visual indicators (chain icons), dependency modal
- Prevent circular dependencies (validation)
- Show blockers in task cards (Badge with "Blocked by X tasks")

---

## 5. Task Templates UI (Backend Exists, Frontend Only)

### Extend Existing Types

```typescript
// Already exists in shared/types.ts:
export type TaskTemplate = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  template_name: string;
  created_at: string;
  updated_at: string;
};

// Phase III: Add preset fields to template
export interface TaskTemplateWithDefaults extends TaskTemplate {
  defaultTags?: string[]; // Tag IDs
  defaultPriority?: string;
  defaultEstimatedHours?: number;
}
```

### State Management

```typescript
// Use React Query (backend API exists)
export function useTaskTemplates(projectId: string) {
  return useQuery({
    queryKey: ['taskTemplates', projectId],
    queryFn: () => api.getTaskTemplates(projectId),
  });
}

export function useApplyTemplate() {
  return useMutation({
    mutationFn: ({ templateId, overrides }: {
      templateId: string;
      overrides?: Partial<CreateTask>
    }) => api.applyTemplate(templateId, overrides),
  });
}
```

**Implementation Strategy**:
- Backend API already exists
- Create TemplateManager component (similar to TagManager)
- "Apply Template" dropdown in task creation flow
- Store defaults in template JSON field

---

## 6. Activity Feed (Requires Backend)

### Backend: New `task_activity` table

```sql
CREATE TABLE task_activity (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'commented', 'dependency_added', etc.
  field_name TEXT, -- Field that changed (for updates)
  old_value TEXT, -- JSON stringified old value
  new_value TEXT, -- JSON stringified new value
  user_id TEXT, -- Future: track who made the change
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_activity_task_id ON task_activity(task_id);
CREATE INDEX idx_task_activity_created_at ON task_activity(created_at DESC);
```

### Type Definitions

```typescript
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'deleted'
  | 'commented'
  | 'tagged'
  | 'untagged'
  | 'dependency_added'
  | 'dependency_removed'
  | 'time_tracked'
  | 'due_date_changed';

export interface TaskActivity {
  id: string;
  taskId: string;
  action: ActivityAction;
  fieldName?: string;
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  userId?: string;
  createdAt: Date;
}

export interface CreateTaskActivity {
  taskId: string;
  action: ActivityAction;
  fieldName?: string;
  oldValue?: any; // Will be JSON.stringify'd
  newValue?: any;
}

// Formatted for display
export interface ActivityFeedItem {
  id: string;
  taskId: string;
  action: ActivityAction;
  description: string; // Human-readable "Changed status from 'todo' to 'done'"
  timestamp: Date;
  user?: string;
}
```

### State Management

```typescript
export function useTaskActivity(taskId: string, limit = 50) {
  return useQuery({
    queryKey: ['taskActivity', taskId, limit],
    queryFn: () => api.getTaskActivity(taskId, limit),
  });
}

// Hook into existing mutations to create activity logs
export function useUpdateTaskWithActivity() {
  const updateTask = useUpdateTask();
  const createActivity = useCreateActivity();

  return async (taskId: string, oldTask: Task, updates: UpdateTask) => {
    await updateTask.mutateAsync({ taskId, updates });

    // Create activity logs for each changed field
    Object.entries(updates).forEach(([field, newValue]) => {
      if (newValue !== undefined && oldTask[field] !== newValue) {
        createActivity.mutate({
          taskId,
          action: field === 'status' ? 'status_changed' : 'updated',
          fieldName: field,
          oldValue: oldTask[field],
          newValue,
        });
      }
    });
  };
}
```

**Implementation Strategy**:
- **Backend**: Create table, add activity logging to all task mutations
- **Frontend**: ActivityFeed component in task detail view
- Show recent activities with timestamps
- Format descriptions ("John changed status to Done")

---

## 7. Export/Import (Frontend-Only)

### Type Definitions

```typescript
export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeSubtasks: boolean;
  includeTags: boolean;
  includeActivity: boolean;
  fields: string[]; // Selected fields to export
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// CSV row structure
export interface TaskCSVRow {
  id?: string; // Optional for import (generate if missing)
  title: string;
  description?: string;
  status: string;
  priority?: string;
  tags?: string; // Comma-separated
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
}
```

### Utility Functions

```typescript
// frontend/src/lib/export-import.ts

export function exportTasksToCSV(tasks: Task[], options: ExportOptions): string {
  // Generate CSV string
}

export function exportTasksToJSON(tasks: Task[], options: ExportOptions): string {
  // Generate JSON string
}

export function parseCSVImport(csv: string): TaskCSVRow[] {
  // Parse CSV to task objects
}

export function parseJSONImport(json: string): Partial<CreateTask>[] {
  // Parse JSON to task objects
}

export function validateImportData(rows: any[]): ImportResult {
  // Validate required fields
}

export async function importTasks(
  projectId: string,
  tasks: Partial<CreateTask>[]
): Promise<ImportResult> {
  // Batch create tasks via API
}
```

**Implementation Strategy**:
- Frontend-only (no backend changes)
- Use `papaparse` for CSV parsing
- Download files via Blob + URL.createObjectURL
- File upload via `<input type="file">`
- Validation before import (show preview with errors)

---

## State Management Summary

### New Stores

1. **`useBulkSelectionStore.ts`** - Selection state
2. **`useFilterStore.ts`** - Active filters + saved presets

### Extended Stores

3. **Extend React Query hooks** - Dependencies, templates, activity

### No Changes Needed

- `useTagStore.ts` - Already complete
- `useViewStore.ts` - Already complete

---

## Type Organization

### File Structure

```
frontend/src/
├── types/
│   ├── bulk-operations.ts      # Bulk selection types
│   ├── filters.ts              # Filter conditions, presets
│   ├── time-tracking.ts        # Time tracking types
│   ├── dependencies.ts         # Task dependency types
│   ├── activity.ts             # Activity feed types
│   └── export-import.ts        # Export/import types
├── stores/
│   ├── useBulkSelectionStore.ts
│   └── useFilterStore.ts
└── lib/
    └── export-import.ts        # Utility functions

shared/
└── extension-types.ts          # Extend with Phase III types
```

---

## Backend Changes Required

### Database Migrations

1. **Time Tracking**: Add columns to `tasks` table
2. **Dependencies**: Create `task_dependencies` table
3. **Activity Feed**: Create `task_activity` table

### Rust Type Updates

```rust
// crates/core/src/models/task.rs

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Task {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub parent_task_attempt: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Phase III additions
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
}
```

### New API Endpoints

```
POST   /api/tasks/:id/dependencies
GET    /api/tasks/:id/dependencies
DELETE /api/tasks/:id/dependencies/:dep_id

GET    /api/tasks/:id/activity
POST   /api/tasks/:id/activity
```

---

## Implementation Phases

### Phase III-A: Frontend-Only Features (Ship First)
1. Bulk Operations
2. Advanced Filtering
3. Export/Import
4. Task Templates UI (backend exists)

### Phase III-B: Backend + Frontend Features (Ship Second)
1. Time Tracking (migration + UI)
2. Task Dependencies (migration + UI)
3. Activity Feed (migration + UI)

---

## Testing Strategy

### Unit Tests
- Filter logic (all operators)
- Export/import parsers
- Bulk operation batching

### Integration Tests
- Create task with time tracking
- Add/remove dependencies
- Activity logging on updates

### E2E Tests
- Complete bulk operation workflow
- Apply filter preset
- Export → Import round-trip

---

## Migration Path

### Step 1: Add Types
- Create all type definition files
- No breaking changes

### Step 2: Backend Migration (if needed)
```sql
-- Run in order:
1. Add time tracking columns
2. Create task_dependencies table
3. Create task_activity table
```

### Step 3: Frontend Implementation
- Implement features one-by-one
- Each feature independently functional
- No feature depends on another

### Step 4: Integration
- Test all features together
- Verify no conflicts

---

## Success Criteria

✅ All types compile without errors
✅ Zustand stores follow existing patterns
✅ Backend types match frontend (ts-rs)
✅ No breaking changes to existing features
✅ Each feature can be disabled independently
✅ Performance: Filtering 1000 tasks < 100ms
✅ Performance: Bulk operations on 100 tasks < 5s