-- Add Phase A: Core Collaboration Fields to tasks table
ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE tasks ADD COLUMN assignee_id TEXT;
ALTER TABLE tasks ADD COLUMN assigned_agent TEXT;
ALTER TABLE tasks ADD COLUMN assigned_mcps TEXT; -- JSON array of strings
ALTER TABLE tasks ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system';
ALTER TABLE tasks ADD COLUMN requires_approval INTEGER NOT NULL DEFAULT 0; -- SQLite boolean
ALTER TABLE tasks ADD COLUMN approval_status TEXT CHECK(approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected', 'changes_requested'));
ALTER TABLE tasks ADD COLUMN parent_task_id TEXT; -- For subtasks
ALTER TABLE tasks ADD COLUMN tags TEXT; -- JSON array of strings
ALTER TABLE tasks ADD COLUMN due_date TEXT; -- ISO 8601 datetime string

-- Create Phase B: TaskComment table
CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK(author_type IN ('human', 'agent', 'mcp', 'system')),
    content TEXT NOT NULL,
    comment_type TEXT NOT NULL DEFAULT 'comment' CHECK(comment_type IN ('comment', 'status_update', 'review', 'approval', 'system', 'handoff', 'mcp_notification')),
    parent_comment_id TEXT,
    mentions TEXT, -- JSON array of actor IDs
    metadata TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES task_comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

-- Create Phase B: ActivityLog table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK(actor_type IN ('human', 'agent', 'mcp', 'system')),
    action TEXT NOT NULL,
    previous_state TEXT, -- JSON object
    new_state TEXT, -- JSON object
    metadata TEXT, -- JSON object
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
