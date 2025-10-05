PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS project_boards (
    id            BLOB PRIMARY KEY,
    project_id    BLOB NOT NULL,
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL,
    board_type    TEXT NOT NULL CHECK (board_type IN (
        'executive_assets', 'brand_assets', 'dev_assets', 'social_assets', 'custom'
    )),
    description   TEXT,
    metadata      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT project_boards_unique_slug UNIQUE (project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_project_boards_project ON project_boards(project_id);

ALTER TABLE project_assets
    ADD COLUMN board_id BLOB;

ALTER TABLE tasks
    ADD COLUMN board_id BLOB;

-- Seed default boards per project (if not already present)
WITH template(name, slug, board_type, description) AS (
    VALUES
        ('Executive Assets', 'executive-assets', 'executive_assets', 'Confidential strategy, budgets, leadership communication'),
        ('Brand Assets', 'brand-assets', 'brand_assets', 'Guidelines, transcripts, research, brand documentation'),
        ('Dev Assets', 'dev-assets', 'dev_assets', 'Repositories, engineering threads, deployment pipelines'),
        ('Social Assets', 'social-assets', 'social_assets', 'Editorial calendars, content workflows, automation scripts')
)
INSERT INTO project_boards (id, project_id, name, slug, board_type, description)
SELECT
    lower(hex(randomblob(16))) AS id,
    p.id,
    t.name,
    t.slug,
    t.board_type,
    t.description
FROM projects p
CROSS JOIN template t
WHERE NOT EXISTS (
    SELECT 1
    FROM project_boards existing
    WHERE existing.project_id = p.id
      AND existing.slug = t.slug
);

-- Attach existing project assets to a reasonable default board
UPDATE project_assets
SET board_id = (
    SELECT pb.id
    FROM project_boards pb
    WHERE pb.project_id = project_assets.project_id
      AND (
        (pb.board_type = 'executive_assets' AND (project_assets.category LIKE '%executive%' OR project_assets.category LIKE '%confidential%')) OR
        (pb.board_type = 'dev_assets' AND (project_assets.category LIKE '%dev%' OR project_assets.category LIKE '%repo%' OR project_assets.category LIKE '%engineering%')) OR
        (pb.board_type = 'social_assets' AND (project_assets.category LIKE '%social%' OR project_assets.category LIKE '%marketing%' OR project_assets.category LIKE '%campaign%')) OR
        pb.board_type = 'brand_assets'
      )
    ORDER BY
        CASE pb.board_type
            WHEN 'executive_assets' THEN 1
            WHEN 'dev_assets' THEN 2
            WHEN 'social_assets' THEN 3
            ELSE 4
        END
    LIMIT 1
)
WHERE board_id IS NULL;

-- Default remaining assets to brand board if no match was found
UPDATE project_assets
SET board_id = (
    SELECT pb.id
    FROM project_boards pb
    WHERE pb.project_id = project_assets.project_id
      AND pb.board_type = 'brand_assets'
    LIMIT 1
)
WHERE board_id IS NULL;

-- Attach existing tasks to the Brand Assets board by default
UPDATE tasks
SET board_id = (
    SELECT pb.id
    FROM project_boards pb
    WHERE pb.project_id = tasks.project_id
      AND pb.board_type = 'brand_assets'
    LIMIT 1
)
WHERE board_id IS NULL;
