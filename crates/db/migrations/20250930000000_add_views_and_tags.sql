-- Migration: Add views, tags, favorites, and command history
-- Date: 2025-09-30

-- Views configuration table
CREATE TABLE IF NOT EXISTS views (
    id BLOB PRIMARY KEY,
    project_id BLOB NOT NULL,
    name TEXT NOT NULL,
    view_type TEXT NOT NULL CHECK (view_type IN ('board', 'table', 'timeline', 'gallery', 'calendar')),
    filters TEXT DEFAULT '{}', -- JSON string of filters
    sorts TEXT DEFAULT '[]', -- JSON string of sort configs
    visible_properties TEXT DEFAULT '[]', -- JSON string of visible property IDs
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_views_project_id ON views(project_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id BLOB PRIMARY KEY,
    project_id BLOB NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#gray',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_project_id ON tags(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_project_name ON tags(project_id, name);

-- Task-Tags junction table
CREATE TABLE IF NOT EXISTS task_tags (
    id BLOB PRIMARY KEY,
    task_id BLOB NOT NULL,
    tag_id BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(task_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);

-- User favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id BLOB PRIMARY KEY,
    user_id BLOB, -- For future multi-user support (nullable for now)
    project_id BLOB NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_project_id ON favorites(project_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Command history table (for ⌘K recent items)
CREATE TABLE IF NOT EXISTS command_history (
    id BLOB PRIMARY KEY,
    user_id BLOB, -- For future multi-user support
    command_type TEXT NOT NULL, -- 'project', 'task', 'command', 'search'
    resource_id BLOB, -- ID of project/task accessed
    resource_type TEXT, -- 'project', 'task', 'view'
    resource_name TEXT, -- Cached name for display
    accessed_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE INDEX IF NOT EXISTS idx_command_history_user_id ON command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_command_history_accessed_at ON command_history(accessed_at);
CREATE INDEX IF NOT EXISTS idx_command_history_resource ON command_history(resource_type, resource_id);