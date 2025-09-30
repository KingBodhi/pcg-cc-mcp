# Phase III: Component Architecture

## Overview
Component hierarchy, props interfaces, and integration points for all Phase III features. Follows existing patterns from Phase II (shadcn/ui, composition, Zustand stores).

---

## Implementation Strategy

### Phase III-A: Frontend-Only (Ship First)
No backend changes required. Can be deployed immediately.

1. Bulk Operations
2. Advanced Filtering
3. Export/Import
4. Task Templates UI

### Phase III-B: Backend Required (Ship Second)
Requires migrations and Rust API updates.

5. Time Tracking
6. Task Dependencies
7. Activity Feed

---

# Phase III-A: Frontend-Only Components

## 1. Bulk Operations

### Component Hierarchy

```
BulkSelectionToolbar (new)
└── BulkActionMenu (new)
    ├── BulkStatusChange
    ├── BulkTagAssignment
    ├── BulkDelete
    └── BulkExport

TaskCard (modified)
└── Checkbox (when selection mode active)

TableView (modified)
└── Column with checkboxes

GalleryView (modified)
└── Card with checkbox overlay
```

### Components

#### `BulkSelectionToolbar.tsx`
Location: `frontend/src/components/bulk-operations/BulkSelectionToolbar.tsx`

```typescript
interface BulkSelectionToolbarProps {
  projectId: string;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
}

export function BulkSelectionToolbar({
  projectId,
  selectedCount,
  totalCount,
  onClearSelection,
}: BulkSelectionToolbarProps) {
  // Sticky toolbar at top when items selected
  // Shows: "X of Y selected" + actions + clear button
}
```

**Features**:
- Sticky position at top of view
- Action buttons: Change Status, Add Tags, Delete, Export
- "Select All" / "Clear Selection" buttons
- Disabled state when 0 selected

#### `BulkActionMenu.tsx`
Location: `frontend/src/components/bulk-operations/BulkActionMenu.tsx`

```typescript
interface BulkActionMenuProps {
  projectId: string;
  selectedTaskIds: string[];
  onComplete: () => void;
}

export function BulkActionMenu({
  projectId,
  selectedTaskIds,
  onComplete,
}: BulkActionMenuProps) {
  // Dropdown menu with bulk actions
  // Each action opens a dialog for confirmation
}
```

**Actions**:
1. **Change Status** → Select new status → Batch update
2. **Add Tags** → Multi-select tags → Batch tag assignment
3. **Remove Tags** → Multi-select tags → Batch tag removal
4. **Delete** → Confirmation dialog → Batch delete
5. **Export** → Download selected as CSV/JSON

#### Integration: Modify Existing Components

**`TaskCard.tsx`** (frontend/src/components/kanban/task-card.tsx)
```typescript
// Add props
interface TaskCardProps {
  // ... existing props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
}

// Add checkbox overlay
{selectionMode && (
  <div className="absolute top-2 right-2 z-10">
    <Checkbox
      checked={isSelected}
      onCheckedChange={() => onToggleSelection?.(task.id)}
    />
  </div>
)}
```

**`TableView.tsx`** (frontend/src/components/views/TableView.tsx)
```typescript
// Add selection column
const columns = useMemo(() => [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  }),
  // ... existing columns
], []);
```

**`GalleryView.tsx`** (frontend/src/components/views/GalleryView.tsx)
```typescript
// Add checkbox overlay similar to TaskCard
{selectionMode && (
  <div className="absolute top-2 right-2 z-10">
    <Checkbox
      checked={isSelected}
      onCheckedChange={() => toggleTask(task.id)}
    />
  </div>
)}
```

---

## 2. Advanced Filtering

### Component Hierarchy

```
FilterBuilder (new)
├── FilterGroup (new)
│   ├── FilterCondition (new)
│   │   ├── FieldSelect
│   │   ├── OperatorSelect
│   │   └── ValueInput (dynamic based on field)
│   └── AddConditionButton
└── FilterPresetManager (new)
    ├── SavePresetDialog
    ├── LoadPresetDropdown
    └── ManagePresetsDialog
```

### Components

#### `FilterBuilder.tsx`
Location: `frontend/src/components/filters/FilterBuilder.tsx`

```typescript
interface FilterBuilderProps {
  projectId: string;
  onFiltersChange: (groups: FilterGroup[]) => void;
  initialFilters?: FilterGroup[];
}

export function FilterBuilder({
  projectId,
  onFiltersChange,
  initialFilters = [],
}: FilterBuilderProps) {
  // Main filter builder UI
  // Shows all filter groups with AND/OR logic
}
```

**Layout**:
```
[Filter Builder]
  Group 1 (AND)
    - Title contains "bug"
    - Status in [todo, inprogress]
    + Add condition
  [OR]
  Group 2 (AND)
    - Tags include "urgent"
    + Add condition
  + Add group
  [Clear All] [Save Preset]
```

#### `FilterCondition.tsx`
Location: `frontend/src/components/filters/FilterCondition.tsx`

```typescript
interface FilterConditionProps {
  condition: FilterCondition;
  projectId: string;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

export function FilterCondition({
  condition,
  projectId,
  onChange,
  onRemove,
}: FilterConditionProps) {
  // Single filter condition row
  // [Field Select] [Operator Select] [Value Input] [X]
}
```

**Dynamic Value Input**:
- **Text fields** (title, description): Text input
- **Status**: Multi-select dropdown
- **Tags**: Tag multi-select (from project tags)
- **Dates**: Date picker (react-day-picker)
- **Numbers**: Number input

#### `FilterPresetManager.tsx`
Location: `frontend/src/components/filters/FilterPresetManager.tsx`

```typescript
interface FilterPresetManagerProps {
  projectId: string;
  currentFilters: FilterGroup[];
  onLoadPreset: (preset: FilterPreset) => void;
}

export function FilterPresetManager({
  projectId,
  currentFilters,
  onLoadPreset,
}: FilterPresetManagerProps) {
  // Manage saved filter presets
  // Dropdown to load, dialog to manage/delete
}
```

**Features**:
- Save current filters as preset (named)
- Load preset (applies to active filters)
- Manage presets (list, rename, delete)
- Presets stored in localStorage via useFilterStore

#### Integration: Modify `project-tasks.tsx`

```typescript
// Add state
const { activeFilters, getActiveFilters } = useFilterStore();
const projectFilters = getActiveFilters(projectId || '');

// Replace existing filteredTasks logic
const filteredTasks = useMemo(() => {
  if (!tasks) return [];

  // Existing search filter
  let result = searchQuery
    ? tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  // Apply advanced filters
  if (projectFilters.length > 0) {
    result = applyAdvancedFilters(result, projectFilters);
  }

  return result;
}, [tasks, searchQuery, projectFilters]);

// Add FilterBuilder to header
<div className="px-6 py-4 border-b">
  <div className="flex items-center gap-2">
    <SearchInput />
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {projectFilters.length > 0 && (
            <Badge className="ml-2">{projectFilters.length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px]">
        <FilterBuilder
          projectId={projectId}
          onFiltersChange={(filters) => setActiveFilters(projectId, filters)}
          initialFilters={projectFilters}
        />
      </PopoverContent>
    </Popover>
  </div>
</div>
```

---

## 3. Export/Import

### Component Hierarchy

```
ExportDialog (new)
└── ExportOptions (format, fields)

ImportDialog (new)
├── FileUpload
├── ImportPreview
└── ImportResults
```

### Components

#### `ExportDialog.tsx`
Location: `frontend/src/components/export-import/ExportDialog.tsx`

```typescript
interface ExportDialogProps {
  projectId: string;
  tasks: Task[];
  selectedTaskIds?: string[]; // Optional: export selection only
}

export function ExportDialog({
  projectId,
  tasks,
  selectedTaskIds,
}: ExportDialogProps) {
  // Dialog with export options
  // Generate download on confirm
}
```

**Options**:
- Format: CSV / JSON
- Fields to include (checkboxes)
- Include subtasks (checkbox)
- Include tags (checkbox)
- Export all vs. selected only

**Implementation**:
```typescript
const handleExport = () => {
  const tasksToExport = selectedTaskIds
    ? tasks.filter(t => selectedTaskIds.includes(t.id))
    : tasks;

  const exportData = format === 'csv'
    ? exportTasksToCSV(tasksToExport, options)
    : exportTasksToJSON(tasksToExport, options);

  // Trigger download
  const blob = new Blob([exportData], {
    type: format === 'csv' ? 'text/csv' : 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${projectId}-${Date.now()}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};
```

#### `ImportDialog.tsx`
Location: `frontend/src/components/export-import/ImportDialog.tsx`

```typescript
interface ImportDialogProps {
  projectId: string;
  onImportComplete: () => void;
}

export function ImportDialog({
  projectId,
  onImportComplete,
}: ImportDialogProps) {
  // Multi-step import flow
  // 1. Upload file
  // 2. Preview + validation
  // 3. Import + show results
}
```

**Steps**:

1. **File Upload**
   ```typescript
   <input
     type="file"
     accept=".csv,.json"
     onChange={handleFileUpload}
   />
   ```

2. **Preview & Validation**
   - Parse file (papaparse for CSV)
   - Validate required fields
   - Show errors (missing title, invalid status, etc.)
   - Show preview table

3. **Import**
   - Batch create via API
   - Show progress (X of Y created)
   - Show results (success count, errors)

**Error Handling**:
```typescript
const results: ImportResult = {
  success: true,
  imported: 0,
  failed: 0,
  errors: [],
};

for (const [index, task] of tasksToImport.entries()) {
  try {
    await createTask(task);
    results.imported++;
  } catch (error) {
    results.failed++;
    results.errors.push({
      row: index + 1,
      message: error.message,
    });
  }
}
```

#### Integration: Add to Toolbar

```typescript
// In project-tasks.tsx header
<div className="flex items-center gap-2">
  <TagManager projectId={projectId} />
  <ViewSwitcher />

  {/* New export/import buttons */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setExportDialogOpen(true)}
  >
    <Download className="h-4 w-4 mr-2" />
    Export
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => setImportDialogOpen(true)}
  >
    <Upload className="h-4 w-4 mr-2" />
    Import
  </Button>
</div>
```

---

## 4. Task Templates UI

### Component Hierarchy

```
TemplateManager (new)
├── TemplateList
├── CreateTemplateDialog
└── EditTemplateDialog

TaskCreationDialog (modified)
└── TemplateSelector (new dropdown)
```

### Components

#### `TemplateManager.tsx`
Location: `frontend/src/components/templates/TemplateManager.tsx`

```typescript
interface TemplateManagerProps {
  projectId: string;
}

export function TemplateManager({ projectId }: TemplateManagerProps) {
  // Similar to TagManager
  // Button that opens dialog with template CRUD
}
```

**Features**:
- List all templates for project
- Create new template
- Edit template (title, description, defaults)
- Delete template
- Apply template (creates task from template)

#### `TemplateSelector.tsx`
Location: `frontend/src/components/templates/TemplateSelector.tsx`

```typescript
interface TemplateSelectorProps {
  projectId: string;
  onTemplateSelected: (template: TaskTemplate) => void;
}

export function TemplateSelector({
  projectId,
  onTemplateSelected,
}: TemplateSelectorProps) {
  // Dropdown in task creation flow
  // "Start from template" option
}
```

**Usage**:
```typescript
// In TaskCreationDialog
<div className="space-y-2">
  <Label>Start from template (optional)</Label>
  <TemplateSelector
    projectId={projectId}
    onTemplateSelected={(template) => {
      setTitle(template.title);
      setDescription(template.description || '');
      // Apply other defaults
    }}
  />
</div>
```

#### Integration: Modify Task Creation

```typescript
// In TaskCreationDialog or wherever tasks are created
const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

// When template selected
useEffect(() => {
  if (selectedTemplate) {
    setTitle(selectedTemplate.title);
    setDescription(selectedTemplate.description || '');
    // Future: apply default tags, priority, etc.
  }
}, [selectedTemplate]);
```

---

# Phase III-B: Backend-Required Components

## 5. Time Tracking

### Component Hierarchy

```
TimeTrackingPanel (new)
├── DateRangePicker (start/due dates)
├── EstimatedHoursInput
├── ActualHoursInput (read-only or manual)
└── TimeTrackingStats (progress, overdue indicators)

TaskCard (modified)
└── DueDateBadge (new)

TimelineView (future)
└── TaskTimelineBar (visual timeline)
```

### Components

#### `TimeTrackingPanel.tsx`
Location: `frontend/src/components/time-tracking/TimeTrackingPanel.tsx`

```typescript
interface TimeTrackingPanelProps {
  task: Task;
  onUpdate: (updates: Partial<UpdateTask>) => void;
}

export function TimeTrackingPanel({
  task,
  onUpdate,
}: TimeTrackingPanelProps) {
  // Panel in task detail view
  // Edit dates and hours
}
```

**Layout**:
```
[Time Tracking]
  Start Date:  [DatePicker] (optional)
  Due Date:    [DatePicker] (optional)

  Estimated:   [___] hours
  Actual:      [___] hours (if completed)

  [Progress Bar] 50% complete
  Status: 3 days remaining
```

#### `DueDateBadge.tsx`
Location: `frontend/src/components/time-tracking/DueDateBadge.tsx`

```typescript
interface DueDateBadgeProps {
  dueDate: string | null;
  status: TaskStatus;
}

export function DueDateBadge({ dueDate, status }: DueDateBadgeProps) {
  // Small badge showing due date
  // Red if overdue, yellow if due soon
}
```

**Color Logic**:
```typescript
const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'done';
const isDueSoon = dueDate && daysBetween(new Date(), new Date(dueDate)) <= 3;

const variant = isOverdue ? 'destructive' : isDueSoon ? 'warning' : 'default';
```

#### Integration: Modify Task Components

**`TaskCard.tsx`**
```typescript
// Add due date badge
{task.due_date && (
  <DueDateBadge dueDate={task.due_date} status={task.status} />
)}
```

**`TaskDetailDialog.tsx`** (or wherever task details shown)
```typescript
// Add time tracking panel
<DialogContent>
  <DialogHeader>
    <DialogTitle>{task.title}</DialogTitle>
  </DialogHeader>

  <Tabs>
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="time">Time Tracking</TabsTrigger>
      <TabsTrigger value="activity">Activity</TabsTrigger>
    </TabsList>

    <TabsContent value="time">
      <TimeTrackingPanel task={task} onUpdate={updateTask} />
    </TabsContent>
  </Tabs>
</DialogContent>
```

---

## 6. Task Dependencies

### Component Hierarchy

```
DependencyManager (new)
├── AddDependencyDialog
│   ├── TaskSearch
│   └── DependencyTypeSelect
└── DependencyList
    └── DependencyItem (with remove button)

TaskCard (modified)
└── DependencyIndicator (badge with count)

DependencyVisualization (future)
└── Graph view with connections
```

### Components

#### `DependencyManager.tsx`
Location: `frontend/src/components/dependencies/DependencyManager.tsx`

```typescript
interface DependencyManagerProps {
  task: Task;
  dependencies: TaskDependency[];
  onAdd: (dep: CreateTaskDependency) => void;
  onRemove: (depId: string) => void;
}

export function DependencyManager({
  task,
  dependencies,
  onAdd,
  onRemove,
}: DependencyManagerProps) {
  // Section in task detail view
  // List dependencies + add new
}
```

**Layout**:
```
[Dependencies]
  Blocking:
    - Task #123: Implement API
    - Task #456: Write tests
    [+ Add]

  Blocked By:
    - Task #789: Design review
    [+ Add]

  Related:
    - Task #101: Documentation
    [+ Add]
```

#### `AddDependencyDialog.tsx`
Location: `frontend/src/components/dependencies/AddDependencyDialog.tsx`

```typescript
interface AddDependencyDialogProps {
  sourceTask: Task;
  projectId: string;
  onAdd: (dep: CreateTaskDependency) => void;
}

export function AddDependencyDialog({
  sourceTask,
  projectId,
  onAdd,
}: AddDependencyDialogProps) {
  // Dialog to add dependency
  // Search for task + select type
}
```

**Steps**:
1. Search for task (autocomplete)
2. Select dependency type (blocks / blocked by / relates to)
3. Validate (no circular dependencies)
4. Create

**Validation**:
```typescript
const validateDependency = async (
  sourceId: string,
  targetId: string,
  type: DependencyType
): Promise<boolean> => {
  // Check for circular dependencies
  // Use graph traversal (BFS/DFS)

  if (type === 'blocks') {
    // Check if target already blocks source (circular)
    const wouldCreateCycle = await checkCycle(targetId, sourceId);
    if (wouldCreateCycle) {
      toast.error('Cannot create circular dependency');
      return false;
    }
  }

  return true;
};
```

#### `DependencyIndicator.tsx`
Location: `frontend/src/components/dependencies/DependencyIndicator.tsx`

```typescript
interface DependencyIndicatorProps {
  blockedByCount: number;
  blockingCount: number;
}

export function DependencyIndicator({
  blockedByCount,
  blockingCount,
}: DependencyIndicatorProps) {
  // Badge on task card
  // Red if blocked, blue if blocking
}
```

**Display**:
```typescript
// Task card footer
{blockedByCount > 0 && (
  <Badge variant="destructive" className="gap-1">
    <Link className="h-3 w-3" />
    Blocked by {blockedByCount}
  </Badge>
)}
{blockingCount > 0 && (
  <Badge variant="secondary" className="gap-1">
    <Link className="h-3 w-3" />
    Blocking {blockingCount}
  </Badge>
)}
```

---

## 7. Activity Feed

### Component Hierarchy

```
ActivityFeed (new)
└── ActivityItem (new)
    ├── ActivityIcon (based on action type)
    ├── ActivityDescription
    └── ActivityTimestamp
```

### Components

#### `ActivityFeed.tsx`
Location: `frontend/src/components/activity/ActivityFeed.tsx`

```typescript
interface ActivityFeedProps {
  taskId: string;
  limit?: number;
}

export function ActivityFeed({ taskId, limit = 50 }: ActivityFeedProps) {
  const { data: activities, isLoading } = useTaskActivity(taskId, limit);

  // List of activity items
  // Reverse chronological order
}
```

**Layout**:
```
[Activity Feed]
  [icon] John changed status from "In Progress" to "Done"  2h ago
  [icon] Added tag "urgent"                                5h ago
  [icon] Updated estimated hours from 4 to 6               1d ago
  [icon] Added dependency: blocks Task #123                2d ago
  [icon] Created task                                      3d ago
```

#### `ActivityItem.tsx`
Location: `frontend/src/components/activity/ActivityItem.tsx`

```typescript
interface ActivityItemProps {
  activity: ActivityFeedItem;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Single activity row
  // Icon + description + timestamp
}
```

**Icon Mapping**:
```typescript
const activityIcons: Record<ActivityAction, LucideIcon> = {
  created: Plus,
  updated: Edit2,
  status_changed: ArrowRight,
  deleted: Trash2,
  commented: MessageSquare,
  tagged: Tag,
  untagged: Tag,
  dependency_added: Link,
  dependency_removed: Unlink,
  time_tracked: Clock,
  due_date_changed: Calendar,
};
```

**Description Formatting**:
```typescript
const formatActivityDescription = (activity: TaskActivity): string => {
  switch (activity.action) {
    case 'status_changed':
      return `Changed status from "${activity.oldValue}" to "${activity.newValue}"`;
    case 'tagged':
      return `Added tag "${activity.newValue}"`;
    case 'due_date_changed':
      return `Set due date to ${formatDate(activity.newValue)}`;
    // ... etc
  }
};
```

#### Integration: Add to Task Detail

```typescript
// In TaskDetailDialog or task detail page
<Tabs>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="time">Time Tracking</TabsTrigger>
    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>

  <TabsContent value="activity">
    <ActivityFeed taskId={task.id} />
  </TabsContent>
</Tabs>
```

---

## File Structure

```
frontend/src/components/
├── bulk-operations/
│   ├── BulkSelectionToolbar.tsx
│   ├── BulkActionMenu.tsx
│   └── BulkDeleteDialog.tsx
├── filters/
│   ├── FilterBuilder.tsx
│   ├── FilterGroup.tsx
│   ├── FilterCondition.tsx
│   ├── FilterPresetManager.tsx
│   └── SavePresetDialog.tsx
├── export-import/
│   ├── ExportDialog.tsx
│   └── ImportDialog.tsx
├── templates/
│   ├── TemplateManager.tsx
│   ├── TemplateSelector.tsx
│   └── TemplateDialog.tsx
├── time-tracking/
│   ├── TimeTrackingPanel.tsx
│   ├── DueDateBadge.tsx
│   └── TimeTrackingStats.tsx
├── dependencies/
│   ├── DependencyManager.tsx
│   ├── AddDependencyDialog.tsx
│   └── DependencyIndicator.tsx
└── activity/
    ├── ActivityFeed.tsx
    └── ActivityItem.tsx
```

---

## Integration Points

### Main Integration: `project-tasks.tsx`

```typescript
export function ProjectTasks() {
  // ... existing code

  // Phase III state
  const { selectionMode, selectedTaskIds } = useBulkSelectionStore();
  const { activeFilters } = useFilterStore();

  return (
    <div>
      {/* Bulk selection toolbar */}
      {selectionMode && selectedTaskIds.size > 0 && (
        <BulkSelectionToolbar
          projectId={projectId}
          selectedCount={selectedTaskIds.size}
          totalCount={tasks.length}
          onClearSelection={() => clearSelection()}
        />
      )}

      {/* Enhanced header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2>{project?.name}</h2>

        <div className="flex items-center gap-2">
          {/* Phase II */}
          <TagManager projectId={projectId} />
          <ViewSwitcher />

          {/* Phase III-A */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectionMode(!selectionMode)}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Select
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <FilterBuilder projectId={projectId} />
            </PopoverContent>
          </Popover>

          <ExportDialog tasks={filteredTasks} projectId={projectId} />
          <ImportDialog projectId={projectId} />
          <TemplateManager projectId={projectId} />
        </div>
      </div>

      {/* Views with enhanced task cards */}
      {currentViewType === 'table' ? (
        <TableView
          tasks={filteredTasks}
          projectId={projectId}
          selectionMode={selectionMode}
        />
      ) : (
        <TaskKanbanBoard
          tasks={filteredTasks}
          projectId={projectId}
          selectionMode={selectionMode}
        />
      )}
    </div>
  );
}
```

---

## Shared Component Patterns

All Phase III components follow these patterns established in Phase II:

### 1. Manager Components
Pattern from `TagManager.tsx`:
- Button to open dialog
- Dialog with CRUD operations
- List of items
- Create/Edit form
- Delete confirmation

### 2. Selector Components
Pattern from `TagSelector.tsx`:
- Multi-select dropdown
- Badge display of selected items
- Add/remove functionality

### 3. Store Integration
Pattern from `useTagStore.ts`:
- Zustand store with actions
- Getter functions
- No mutations outside store

### 4. API Integration
Pattern from existing queries:
- React Query hooks
- Optimistic updates
- Cache invalidation
- Error handling with toast

---

## Testing Strategy

### Unit Tests
- Filter logic (all operators)
- Bulk operation batching
- Export/import parsing
- Activity description formatting

### Component Tests
- FilterBuilder interactions
- BulkSelectionToolbar actions
- ImportDialog file upload
- DependencyManager validation

### Integration Tests
- Complete bulk operation flow
- Filter → Export workflow
- Template → Create task
- Add dependency → Show in card

---

## Performance Considerations

### Optimization Strategies

1. **Bulk Operations**
   - Use `Promise.allSettled()` for parallel API calls
   - Batch size limit: 100 tasks per operation
   - Show progress indicator for long operations

2. **Filtering**
   - Memoize filter results
   - Debounce filter changes (300ms)
   - Index frequently filtered fields

3. **Activity Feed**
   - Virtualize list if > 100 items
   - Lazy load more activities
   - Cache formatted descriptions

4. **Dependencies**
   - Cache dependency graph
   - Validate cycles client-side before API call
   - Limit dependency depth (no more than 5 levels)

---

## Accessibility

All components follow WCAG 2.1 Level AA:

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for icon-only buttons
- Focus management in dialogs
- Screen reader announcements for bulk actions
- Color contrast ratios > 4.5:1

---

## Success Criteria

✅ All components use existing shadcn/ui primitives
✅ Props interfaces fully typed
✅ Integration points documented
✅ No breaking changes to existing components
✅ Performance optimizations in place
✅ Accessibility requirements met
✅ Follows established patterns from Phase II