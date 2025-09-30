use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

use super::{project::Project, task_attempt::TaskAttempt};

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "task_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    InProgress,
    InReview,
    Done,
    Cancelled,
}

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "priority", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "approval_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    ChangesRequested,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid, // Foreign key to Project
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub parent_task_attempt: Option<Uuid>, // Foreign key to parent TaskAttempt
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Phase A: Core Collaboration Fields
    pub priority: Priority,
    pub assignee_id: Option<String>,
    pub assigned_agent: Option<String>,
    pub assigned_mcps: Option<String>, // JSON array of strings
    pub created_by: String,
    pub requires_approval: bool,
    pub approval_status: Option<ApprovalStatus>,
    pub parent_task_id: Option<Uuid>, // For subtasks
    pub tags: Option<String>, // JSON array of strings
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct TaskWithAttemptStatus {
    #[serde(flatten)]
    #[ts(flatten)]
    pub task: Task,
    pub has_in_progress_attempt: bool,
    pub has_merged_attempt: bool,
    pub last_attempt_failed: bool,
    pub executor: String,
}

impl std::ops::Deref for TaskWithAttemptStatus {
    type Target = Task;
    fn deref(&self) -> &Self::Target {
        &self.task
    }
}

impl std::ops::DerefMut for TaskWithAttemptStatus {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.task
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct TaskRelationships {
    pub parent_task: Option<Task>,    // The task that owns this attempt
    pub current_attempt: TaskAttempt, // The attempt we're viewing
    pub children: Vec<Task>,          // Tasks created by this attempt
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,

    // Phase A: Core Collaboration Fields
    pub priority: Option<Priority>,
    pub assignee_id: Option<String>,
    pub assigned_agent: Option<String>,
    pub assigned_mcps: Option<Vec<String>>,
    pub created_by: String,
    pub requires_approval: Option<bool>,
    pub parent_task_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,

    // Phase A: Core Collaboration Fields
    pub priority: Option<Priority>,
    pub assignee_id: Option<String>,
    pub assigned_agent: Option<String>,
    pub assigned_mcps: Option<Vec<String>>,
    pub requires_approval: Option<bool>,
    pub approval_status: Option<ApprovalStatus>,
    pub parent_task_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub due_date: Option<DateTime<Utc>>,
}

impl Task {
    pub fn to_prompt(&self) -> String {
        if let Some(description) = &self.description {
            format!("Title: {}\n\nDescription:{}", &self.title, description)
        } else {
            self.title.clone()
        }
    }

    fn serialize_json_array(arr: &Option<Vec<String>>) -> Option<String> {
        arr.as_ref().map(|v| serde_json::to_string(v).unwrap())
    }

    fn deserialize_json_array(s: &Option<String>) -> Option<Vec<String>> {
        s.as_ref().and_then(|v| serde_json::from_str(v).ok())
    }

    pub async fn parent_project(&self, pool: &SqlitePool) -> Result<Option<Project>, sqlx::Error> {
        Project::find_by_id(pool, self.project_id).await
    }

    pub async fn find_by_project_id_with_attempt_status(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<TaskWithAttemptStatus>, sqlx::Error> {
        let records = sqlx::query!(
            r#"SELECT
  t.id                            AS "id!: Uuid",
  t.project_id                    AS "project_id!: Uuid",
  t.title,
  t.description,
  t.status                        AS "status!: TaskStatus",
  t.parent_task_attempt           AS "parent_task_attempt: Uuid",
  t.created_at                    AS "created_at!: DateTime<Utc>",
  t.updated_at                    AS "updated_at!: DateTime<Utc>",
  t.priority                      AS "priority!: Priority",
  t.assignee_id                   AS "assignee_id: String",
  t.assigned_agent                AS "assigned_agent: String",
  t.assigned_mcps                 AS "assigned_mcps: String",
  t.created_by                    AS "created_by!",
  t.requires_approval             AS "requires_approval!: bool",
  t.approval_status               AS "approval_status: ApprovalStatus",
  t.parent_task_id                AS "parent_task_id: Uuid",
  t.tags                          AS "tags: String",
  t.due_date                      AS "due_date: DateTime<Utc>",

  CASE WHEN EXISTS (
    SELECT 1
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
       AND ep.status        = 'running'
       AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     LIMIT 1
  ) THEN 1 ELSE 0 END            AS "has_in_progress_attempt!: i64",

  CASE WHEN (
    SELECT ep.status
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
     AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     ORDER BY ep.created_at DESC
     LIMIT 1
  ) IN ('failed','killed') THEN 1 ELSE 0 END
                                 AS "last_attempt_failed!: i64",

  ( SELECT ta.executor
      FROM task_attempts ta
      WHERE ta.task_id = t.id
     ORDER BY ta.created_at DESC
      LIMIT 1
    )                               AS "executor!: String"

FROM tasks t
WHERE t.project_id = $1
ORDER BY t.created_at DESC"#,
            project_id
        )
        .fetch_all(pool)
        .await?;

        let tasks = records
            .into_iter()
            .map(|rec| TaskWithAttemptStatus {
                task: Task {
                    id: rec.id,
                    project_id: rec.project_id,
                    title: rec.title,
                    description: rec.description,
                    status: rec.status,
                    parent_task_attempt: rec.parent_task_attempt,
                    created_at: rec.created_at,
                    updated_at: rec.updated_at,
                    priority: rec.priority,
                    assignee_id: rec.assignee_id,
                    assigned_agent: rec.assigned_agent,
                    assigned_mcps: rec.assigned_mcps,
                    created_by: rec.created_by,
                    requires_approval: rec.requires_approval,
                    approval_status: rec.approval_status,
                    parent_task_id: rec.parent_task_id,
                    tags: rec.tags,
                    due_date: rec.due_date,
                },
                has_in_progress_attempt: rec.has_in_progress_attempt != 0,
                has_merged_attempt: false, // TODO use merges table
                last_attempt_failed: rec.last_attempt_failed != 0,
                executor: rec.executor,
            })
            .collect();

        Ok(tasks)
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>"
               FROM tasks
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_rowid(pool: &SqlitePool, rowid: i64) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>"
               FROM tasks
               WHERE rowid = $1"#,
            rowid
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_id_and_project_id(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>"
               FROM tasks
               WHERE id = $1 AND project_id = $2"#,
            id,
            project_id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTask,
        task_id: Uuid,
    ) -> Result<Self, sqlx::Error> {
        let priority = data.priority.clone().unwrap_or(Priority::Medium);
        let requires_approval = data.requires_approval.unwrap_or(false);
        let assigned_mcps_json = Self::serialize_json_array(&data.assigned_mcps);
        let tags_json = Self::serialize_json_array(&data.tags);

        sqlx::query_as!(
            Task,
            r#"INSERT INTO tasks (
                id, project_id, title, description, status, parent_task_attempt,
                priority, assignee_id, assigned_agent, assigned_mcps, created_by,
                requires_approval, parent_task_id, tags, due_date
               )
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
               RETURNING
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>""#,
            task_id,
            data.project_id,
            data.title,
            data.description,
            TaskStatus::Todo as TaskStatus,
            data.parent_task_attempt,
            priority,
            data.assignee_id,
            data.assigned_agent,
            assigned_mcps_json,
            data.created_by,
            requires_approval,
            data.parent_task_id,
            tags_json,
            data.due_date
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
        title: String,
        description: Option<String>,
        status: TaskStatus,
        parent_task_attempt: Option<Uuid>,
        priority: Priority,
        assignee_id: Option<String>,
        assigned_agent: Option<String>,
        assigned_mcps: Option<String>,
        requires_approval: bool,
        approval_status: Option<ApprovalStatus>,
        parent_task_id: Option<Uuid>,
        tags: Option<String>,
        due_date: Option<DateTime<Utc>>,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"UPDATE tasks
               SET title = $3, description = $4, status = $5, parent_task_attempt = $6,
                   priority = $7, assignee_id = $8, assigned_agent = $9, assigned_mcps = $10,
                   requires_approval = $11, approval_status = $12, parent_task_id = $13,
                   tags = $14, due_date = $15
               WHERE id = $1 AND project_id = $2
               RETURNING
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>""#,
            id,
            project_id,
            title,
            description,
            status,
            parent_task_attempt,
            priority,
            assignee_id,
            assigned_agent,
            assigned_mcps,
            requires_approval,
            approval_status,
            parent_task_id,
            tags,
            due_date
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update_status(
        pool: &SqlitePool,
        id: Uuid,
        status: TaskStatus,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE tasks SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            id,
            status
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM tasks WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }

    pub async fn exists(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query!(
            "SELECT id as \"id!: Uuid\" FROM tasks WHERE id = $1 AND project_id = $2",
            id,
            project_id
        )
        .fetch_optional(pool)
        .await?;
        Ok(result.is_some())
    }

    pub async fn find_children_by_attempt_id(
        pool: &SqlitePool,
        attempt_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        // Find only child tasks that have this attempt as their parent
        sqlx::query_as!(
            Task,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                created_at as "created_at!: DateTime<Utc>",
                updated_at as "updated_at!: DateTime<Utc>",
                priority as "priority!: Priority",
                assignee_id,
                assigned_agent,
                assigned_mcps,
                created_by,
                requires_approval as "requires_approval!: bool",
                approval_status as "approval_status: ApprovalStatus",
                parent_task_id as "parent_task_id: Uuid",
                tags,
                due_date as "due_date: DateTime<Utc>"
               FROM tasks
               WHERE parent_task_attempt = $1
               ORDER BY created_at DESC"#,
            attempt_id,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_relationships_for_attempt(
        pool: &SqlitePool,
        task_attempt: &TaskAttempt,
    ) -> Result<TaskRelationships, sqlx::Error> {
        // 1. Get the current task (task that owns this attempt)
        let current_task = Self::find_by_id(pool, task_attempt.task_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        // 2. Get parent task (if current task was created by another task's attempt)
        let parent_task = if let Some(parent_attempt_id) = current_task.parent_task_attempt {
            // Find the attempt that created the current task
            if let Ok(Some(parent_attempt)) = TaskAttempt::find_by_id(pool, parent_attempt_id).await
            {
                // Find the task that owns that parent attempt - THAT's the real parent
                Self::find_by_id(pool, parent_attempt.task_id).await?
            } else {
                None
            }
        } else {
            None
        };

        // 3. Get children tasks (created by this attempt)
        let children = Self::find_children_by_attempt_id(pool, task_attempt.id).await?;

        Ok(TaskRelationships {
            parent_task,
            current_attempt: task_attempt.clone(),
            children,
        })
    }
}
