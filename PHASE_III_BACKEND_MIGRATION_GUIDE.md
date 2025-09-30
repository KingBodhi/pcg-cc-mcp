# Phase III Backend Migration Guide

This guide provides complete instructions for migrating Phase III features from localStorage to backend APIs.

## Overview

All Phase III features are currently implemented with **localStorage persistence** (frontend-only). This document provides:
1. Database schema requirements
2. API endpoint specifications
3. Code migration steps
4. Testing guidelines

---

## 1. Export/Import Feature

### Current Implementation
- **Status:** ✅ Fully functional with localStorage
- **Files:** `utils/exportUtils.ts`, `components/export/`
- **Note:** Already uses backend API for import (creates tasks via `/api/tasks`)

### Backend Requirements

**No additional backend needed** - Import already uses existing task creation API.

Export is client-side only (downloads directly from browser).

---

## 2. Time Tracking Feature

### Current Implementation
- **Storage:** `stores/useTimeTrackingStore.ts` (localStorage)
- **Types:** `types/time-tracking.ts`
- **Components:** `components/time-tracking/`

### Database Schema

```sql
-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT, -- For multi-user support
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);

-- Active timers table (for currently running timers)
CREATE TABLE IF NOT EXISTS active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One active timer per user
);
```

### API Endpoints

```rust
// Rust backend routes needed

// Start timer
POST /api/time-tracking/start
Body: {
  task_id: string,
  description?: string
}
Response: {
  id: string,
  task_id: string,
  start_time: string,
  description?: string
}

// Stop timer
POST /api/time-tracking/stop
Body: {
  task_id: string
}
Response: {
  id: string,
  task_id: string,
  start_time: string,
  end_time: string,
  duration: number
}

// Get active timer
GET /api/time-tracking/active
Response: {
  id?: string,
  task_id?: string,
  start_time?: string,
  description?: string
} | null

// Get time entries for task
GET /api/time-tracking/entries/:task_id
Response: TimeEntry[]

// Get time statistics for task
GET /api/time-tracking/stats/:task_id
Response: {
  total_time: number,
  today_time: number,
  week_time: number,
  entry_count: number
}

// Delete time entry
DELETE /api/time-tracking/entries/:id

// Update time entry
PATCH /api/time-tracking/entries/:id
Body: Partial<TimeEntry>
```

### Migration Steps

1. **Create database tables** (use migration file above)

2. **Implement Rust API routes** in `crates/server/src/routes/time_tracking.rs`

3. **Update Zustand store** to use API instead of localStorage:

```typescript
// Before (localStorage)
export const useTimeTrackingStore = create<TimeTrackingStore>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    { name: 'time-tracking-storage' }
  )
);

// After (API + React Query)
export const useTimeTrackingStore = create<TimeTrackingStore>()((set, get) => ({
  startTimer: async (taskId, description) => {
    const response = await apiClient.post('/time-tracking/start', {
      task_id: taskId,
      description,
    });
    set({ activeTimer: response.data });
  },

  stopTimer: async () => {
    const timer = get().activeTimer;
    if (!timer) return null;

    const response = await apiClient.post('/time-tracking/stop', {
      task_id: timer.taskId,
    });

    set({ activeTimer: null });
    return response.data;
  },

  // Use React Query for fetching
  // See example below
}));
```

4. **Add React Query hooks** for data fetching:

```typescript
// hooks/api/useTimeTracking.ts
export function useTimeEntries(taskId: string) {
  return useQuery({
    queryKey: ['time-entries', taskId],
    queryFn: () => apiClient.get(`/time-tracking/entries/${taskId}`),
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey: ['active-timer'],
    queryFn: () => apiClient.get('/time-tracking/active'),
    refetchInterval: 1000, // Refresh every second
  });
}

export function useTaskTimeStats(taskId: string) {
  return useQuery({
    queryKey: ['time-stats', taskId],
    queryFn: () => apiClient.get(`/time-tracking/stats/${taskId}`),
  });
}
```

---

## 3. Task Dependencies Feature

### Current Implementation
- **Storage:** `stores/useDependencyStore.ts` (localStorage)
- **Types:** `types/dependencies.ts`
- **Components:** `components/dependencies/`

### Database Schema

```sql
-- Task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks', 'blocked_by', 'relates_to')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_task_id, target_task_id, dependency_type)
);

CREATE INDEX idx_dependencies_source ON task_dependencies(source_task_id);
CREATE INDEX idx_dependencies_target ON task_dependencies(target_task_id);

-- Prevent circular dependencies (trigger)
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent self-dependencies
    IF NEW.source_task_id = NEW.target_task_id THEN
        RAISE EXCEPTION 'Task cannot depend on itself';
    END IF;

    -- Check for circular dependencies (recursive)
    IF EXISTS (
        WITH RECURSIVE dep_chain AS (
            SELECT target_task_id as task_id
            FROM task_dependencies
            WHERE source_task_id = NEW.target_task_id

            UNION

            SELECT td.target_task_id
            FROM task_dependencies td
            INNER JOIN dep_chain dc ON td.source_task_id = dc.task_id
        )
        SELECT 1 FROM dep_chain WHERE task_id = NEW.source_task_id
    ) THEN
        RAISE EXCEPTION 'Circular dependency detected';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_dependencies
    BEFORE INSERT ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION check_circular_dependency();
```

### API Endpoints

```rust
// Add dependency
POST /api/dependencies
Body: {
  source_task_id: string,
  target_task_id: string,
  dependency_type: "blocks" | "relates_to"
}
Response: {
  id: string,
  source_task_id: string,
  target_task_id: string,
  dependency_type: string,
  created_at: string
}

// Remove dependency
DELETE /api/dependencies/:id

// Get dependencies for task
GET /api/dependencies/:task_id
Response: {
  blocks: TaskDependency[],
  blocked_by: TaskDependency[],
  relates_to: TaskDependency[]
}

// Get dependency graph for project
GET /api/projects/:project_id/dependency-graph
Response: {
  [task_id: string]: {
    blocks: string[],
    blocked_by: string[],
    relates_to: string[]
  }
}

// Check if task is blocked
GET /api/dependencies/:task_id/blocked
Response: {
  is_blocked: boolean,
  blocked_by: string[]
}
```

### Migration Steps

1. **Create database tables** with circular dependency prevention

2. **Implement Rust API routes** in `crates/server/src/routes/dependencies.rs`

3. **Update Zustand store**:

```typescript
// Replace localStorage with API calls
export const useDependencyStore = create<DependencyStore>()((set, get) => ({
  addDependency: async (sourceTaskId, targetTaskId, type) => {
    try {
      const response = await apiClient.post('/dependencies', {
        source_task_id: sourceTaskId,
        target_task_id: targetTaskId,
        dependency_type: type,
      });

      // Update local state
      set((state) => ({
        dependencies: [...state.dependencies, response.data],
      }));

      return response.data;
    } catch (error) {
      if (error.message.includes('Circular')) {
        toast.error('Cannot create circular dependency');
      }
      throw error;
    }
  },

  removeDependency: async (id) => {
    await apiClient.delete(`/dependencies/${id}`);

    set((state) => ({
      dependencies: state.dependencies.filter(dep => dep.id !== id),
    }));
  },
}));
```

4. **Add React Query hooks**:

```typescript
export function useTaskDependencies(taskId: string) {
  return useQuery({
    queryKey: ['dependencies', taskId],
    queryFn: () => apiClient.get(`/dependencies/${taskId}`),
  });
}

export function useDependencyGraph(projectId: string) {
  return useQuery({
    queryKey: ['dependency-graph', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}/dependency-graph`),
  });
}
```

---

## 4. Activity Feed Feature

### Current Implementation
- **Storage:** `stores/useActivityStore.ts` (localStorage)
- **Types:** `types/activity.ts`
- **Components:** `components/activity/`

### Database Schema

```sql
-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'task_created',
        'task_updated',
        'task_deleted',
        'status_changed',
        'priority_changed',
        'assignee_changed',
        'comment_added',
        'dependency_added',
        'dependency_removed',
        'time_logged',
        'file_attached'
    )),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_task_id ON activity_log(task_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
```

### API Endpoints

```rust
// Log activity (internal use by other endpoints)
POST /api/activity
Body: {
  task_id: string,
  activity_type: ActivityType,
  description: string,
  metadata?: object
}

// Get activities for task
GET /api/activity/task/:task_id
Query params: ?limit=50
Response: ActivityEntry[]

// Get recent activities for project
GET /api/activity/project/:project_id
Query params: ?limit=50&types=status_changed,comment_added
Response: ActivityEntry[]

// Get filtered activities
GET /api/activity/filter
Query params: ?task_ids=abc,def&types=status_changed&start_date=2025-01-01
Response: ActivityEntry[]
```

### Migration Steps

1. **Create database table**

2. **Implement Rust API routes** in `crates/server/src/routes/activity.rs`

3. **Add automatic logging to existing endpoints**:

```rust
// Example: In task update endpoint
pub async fn update_task(
    State(db): State<Database>,
    Path(task_id): Path<Uuid>,
    Json(updates): Json<TaskUpdate>,
) -> Result<Json<Task>, AppError> {
    let task = db.update_task(task_id, updates).await?;

    // Log activity
    if let Some(old_status) = updates.old_status {
        db.log_activity(ActivityLog {
            task_id,
            activity_type: "status_changed",
            description: format!("Status changed from {} to {}", old_status, task.status),
            metadata: json!({
                "from": old_status,
                "to": task.status
            }),
        }).await?;
    }

    Ok(Json(task))
}
```

4. **Update Zustand store**:

```typescript
// Replace localStorage with API
export const useActivityStore = create<ActivityStore>()((set) => ({
  logActivity: async (taskId, type, description, metadata) => {
    // Backend handles logging now
    await apiClient.post('/activity', {
      task_id: taskId,
      activity_type: type,
      description,
      metadata,
    });

    // Invalidate queries to refetch
    queryClient.invalidateQueries(['activities', taskId]);
  },
}));
```

5. **Add React Query hooks**:

```typescript
export function useTaskActivities(taskId: string) {
  return useQuery({
    queryKey: ['activities', taskId],
    queryFn: () => apiClient.get(`/activity/task/${taskId}`),
  });
}

export function useProjectActivities(projectId: string, limit = 50) {
  return useQuery({
    queryKey: ['project-activities', projectId, limit],
    queryFn: () => apiClient.get(`/activity/project/${projectId}?limit=${limit}`),
  });
}
```

---

## 5. Filter Presets (Advanced Filtering)

### Current Implementation
- **Storage:** `stores/useFilterStore.ts` (localStorage)
- **Types:** `types/filters.ts`
- **Note:** Active filters work client-side, presets need backend

### Database Schema

```sql
-- Filter presets table
CREATE TABLE IF NOT EXISTS filter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    filter_groups JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filter_presets_project ON filter_presets(project_id);
CREATE INDEX idx_filter_presets_user ON filter_presets(user_id);
```

### API Endpoints

```rust
// Get filter presets for project
GET /api/projects/:project_id/filter-presets
Response: FilterPreset[]

// Create filter preset
POST /api/projects/:project_id/filter-presets
Body: {
  name: string,
  filter_groups: FilterGroup[]
}

// Update filter preset
PATCH /api/filter-presets/:id
Body: {
  name?: string,
  filter_groups?: FilterGroup[]
}

// Delete filter preset
DELETE /api/filter-presets/:id
```

### Migration Steps

1. **Create database table**

2. **Implement Rust API routes**

3. **Update filter store to use API for presets**:

```typescript
// Keep active filters in memory, persist presets to backend
export const useFilterStore = create<FilterStore>()((set, get) => ({
  // Active filters stay in memory (fast client-side filtering)
  activeFilters: {},

  // Presets use backend
  savePreset: async (preset) => {
    const response = await apiClient.post(
      `/projects/${preset.projectId}/filter-presets`,
      {
        name: preset.name,
        filter_groups: preset.groups,
      }
    );

    // Invalidate queries
    queryClient.invalidateQueries(['filter-presets', preset.projectId]);
  },

  deletePreset: async (projectId, presetId) => {
    await apiClient.delete(`/filter-presets/${presetId}`);
    queryClient.invalidateQueries(['filter-presets', projectId]);
  },
}));
```

---

## General Migration Pattern

### Step-by-Step Process

1. **Database Setup**
   ```bash
   # Create migration file
   sqlx migrate add feature_name

   # Add schema from this guide
   # Run migration
   sqlx migrate run
   ```

2. **Backend Implementation**
   ```bash
   # Create route module
   touch crates/server/src/routes/feature_name.rs

   # Implement handlers
   # Add to router in main.rs
   ```

3. **Frontend API Client**
   ```typescript
   // Add typed API functions
   export const featureApi = {
     create: (data) => apiClient.post('/feature', data),
     get: (id) => apiClient.get(`/feature/${id}`),
     update: (id, data) => apiClient.patch(`/feature/${id}`, data),
     delete: (id) => apiClient.delete(`/feature/${id}`),
   };
   ```

4. **Replace Zustand Store**
   ```typescript
   // Remove persist middleware
   // Replace localStorage with API calls
   // Use optimistic updates
   ```

5. **Add React Query Hooks**
   ```typescript
   // Create hooks/api/useFeature.ts
   export function useFeature(id: string) {
     return useQuery({
       queryKey: ['feature', id],
       queryFn: () => featureApi.get(id),
     });
   }

   export function useCreateFeature() {
     return useMutation({
       mutationFn: featureApi.create,
       onSuccess: () => {
         queryClient.invalidateQueries(['features']);
       },
     });
   }
   ```

6. **Update Components**
   ```typescript
   // Replace store hooks with React Query hooks
   // Before
   const data = useStore((state) => state.data);

   // After
   const { data } = useFeature(id);
   ```

---

## Testing Checklist

For each migrated feature:

- [ ] Database migration runs without errors
- [ ] API endpoints return correct data
- [ ] Frontend components display data correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Error handling works (network errors, validation errors)
- [ ] Loading states display correctly
- [ ] Optimistic updates work smoothly
- [ ] Real-time updates work (if applicable)
- [ ] Multi-user scenarios work (if applicable)

---

## Rollback Strategy

If you need to rollback during migration:

1. **Keep localStorage as fallback**:
   ```typescript
   const useHybridStore = create((set) => ({
     getData: async () => {
       try {
         // Try API first
         const data = await apiClient.get('/data');
         return data;
       } catch (error) {
         // Fallback to localStorage
         return JSON.parse(localStorage.getItem('data') || '[]');
       }
     },
   }));
   ```

2. **Feature flags**:
   ```typescript
   const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND === 'true';

   if (USE_BACKEND_API) {
     // Use API
   } else {
     // Use localStorage
   }
   ```

---

## Code Location Reference

All Phase III code is organized as follows:

```
frontend/src/
├── types/
│   ├── export.ts              # Export/import types
│   ├── time-tracking.ts       # Time tracking types
│   ├── dependencies.ts        # Dependency types
│   ├── activity.ts            # Activity log types
│   └── filters.ts             # Filter types (already exists)
│
├── stores/
│   ├── useTimeTrackingStore.ts    # Time tracking state
│   ├── useDependencyStore.ts      # Dependencies state
│   ├── useActivityStore.ts        # Activity log state
│   └── useFilterStore.ts          # Filters state (already exists)
│
├── utils/
│   ├── exportUtils.ts         # Export/import utilities
│   └── timeUtils.ts           # Time formatting utilities
│
├── components/
│   ├── export/
│   │   ├── ExportDialog.tsx
│   │   └── ImportDialog.tsx
│   ├── time-tracking/
│   │   ├── TimeTrackerWidget.tsx
│   │   └── TimeEntriesList.tsx
│   ├── dependencies/
│   │   └── DependencyManager.tsx
│   ├── activity/
│   │   └── ActivityFeed.tsx
│   └── templates/
│       └── TemplateSelector.tsx
│
└── hooks/
    └── useActivityLogger.ts   # Activity logging helper
```

---

## Estimated Migration Time

Per feature (for experienced developer):

| Feature | Backend (Rust) | Frontend (TypeScript) | Testing | Total |
|---------|---------------|---------------------|---------|-------|
| Time Tracking | 4-6 hours | 2-3 hours | 2 hours | 8-11 hours |
| Dependencies | 3-4 hours | 2 hours | 2 hours | 7-8 hours |
| Activity Feed | 2-3 hours | 1-2 hours | 1 hour | 4-6 hours |
| Filter Presets | 2 hours | 1 hour | 1 hour | 4 hours |

**Total estimated time: 23-29 hours**

---

## Questions?

This guide should provide everything needed for backend migration. Key principles:

1. ✅ Keep current localStorage code as reference
2. ✅ Migrate one feature at a time
3. ✅ Test thoroughly before moving to next feature
4. ✅ Use React Query for all data fetching
5. ✅ Add proper error handling
6. ✅ Log activities automatically in backend

All Phase III features are production-ready with localStorage and can be migrated to backend APIs incrementally without breaking existing functionality.
