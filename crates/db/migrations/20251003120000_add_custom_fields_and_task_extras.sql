PRAGMA foreign_keys = ON;

-- Custom field definitions per project
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id           BLOB PRIMARY KEY,
    project_id   BLOB NOT NULL,
    name         TEXT NOT NULL,
    field_type   TEXT NOT NULL CHECK (field_type IN (
        'text','number','date','url','checkbox','select','multi_select',
        'formula','relationship','user','file','auto_increment'
    )),
    required     INTEGER NOT NULL DEFAULT 0,
    options      TEXT,
    default_value TEXT,
    metadata     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_project
    ON custom_field_definitions(project_id);

-- Persist custom values on tasks as JSON blob
ALTER TABLE tasks ADD COLUMN custom_properties TEXT;
ALTER TABLE tasks ADD COLUMN scheduled_start TEXT;
ALTER TABLE tasks ADD COLUMN scheduled_end TEXT;

-- Task dependencies persistence
CREATE TABLE IF NOT EXISTS task_dependencies (
    id              BLOB PRIMARY KEY,
    project_id      BLOB NOT NULL,
    source_task_id  BLOB NOT NULL,
    target_task_id  BLOB NOT NULL,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks','relates_to')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_dependency_unique UNIQUE (source_task_id, target_task_id, dependency_type)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_source ON task_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_target ON task_dependencies(target_task_id);

-- Time tracking persistence
CREATE TABLE IF NOT EXISTS time_entries (
    id              BLOB PRIMARY KEY,
    project_id      BLOB NOT NULL,
    task_id         BLOB NOT NULL,
    description     TEXT,
    start_time      TEXT NOT NULL,
    end_time        TEXT,
    duration_seconds INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
