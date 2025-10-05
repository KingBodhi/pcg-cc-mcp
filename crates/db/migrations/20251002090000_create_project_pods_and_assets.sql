PRAGMA foreign_keys = ON;

-- Project pods allow nested goals/teams inside each brand project
CREATE TABLE project_pods (
    id          BLOB PRIMARY KEY,
    project_id  BLOB NOT NULL,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','completed','archived')),
    lead        TEXT DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_pods_project ON project_pods(project_id);
CREATE INDEX idx_project_pods_status ON project_pods(status);

-- Brand asset metadata table keeps track of stored artefacts per project/pod
CREATE TABLE project_assets (
    id            BLOB PRIMARY KEY,
    project_id    BLOB NOT NULL,
    pod_id        BLOB,
    category      TEXT NOT NULL DEFAULT 'file'
                      CHECK (category IN ('file','transcript','link','note')),
    scope         TEXT NOT NULL DEFAULT 'team'
                      CHECK (scope IN ('owner','client','team','public')),
    name          TEXT NOT NULL,
    storage_path  TEXT NOT NULL,
    checksum      TEXT,
    byte_size     INTEGER DEFAULT 0,
    mime_type     TEXT DEFAULT '',
    metadata      TEXT DEFAULT '',
    uploaded_by   TEXT DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (pod_id) REFERENCES project_pods(id) ON DELETE SET NULL
);

CREATE INDEX idx_project_assets_project ON project_assets(project_id);
CREATE INDEX idx_project_assets_pod ON project_assets(pod_id);
CREATE INDEX idx_project_assets_scope ON project_assets(scope);
CREATE INDEX idx_project_assets_category ON project_assets(category);

-- Link existing tasks to optional pods (team mission threads)
ALTER TABLE tasks ADD COLUMN pod_id BLOB;

CREATE INDEX idx_tasks_pod ON tasks(pod_id);
