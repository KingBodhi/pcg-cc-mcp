use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "author_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum AuthorType {
    Human,
    Agent,
    Mcp,
    System,
}

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "comment_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommentType {
    Comment,
    StatusUpdate,
    Review,
    Approval,
    System,
    Handoff,
    McpNotification,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct TaskComment {
    pub id: Uuid,
    pub task_id: Uuid,
    pub author_id: String,
    pub author_type: AuthorType,
    pub content: String,
    pub comment_type: CommentType,
    pub parent_comment_id: Option<Uuid>,
    pub mentions: Option<String>, // JSON array of actor IDs
    pub metadata: Option<String>, // JSON object
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateTaskComment {
    pub task_id: Uuid,
    pub author_id: String,
    pub author_type: AuthorType,
    pub content: String,
    pub comment_type: Option<CommentType>,
    pub parent_comment_id: Option<Uuid>,
    pub mentions: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
}

impl TaskComment {
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskComment,
            r#"SELECT
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                author_id,
                author_type as "author_type!: AuthorType",
                content,
                comment_type as "comment_type!: CommentType",
                parent_comment_id as "parent_comment_id: Uuid",
                mentions,
                metadata,
                created_at as "created_at!: DateTime<Utc>"
               FROM task_comments
               WHERE task_id = $1
               ORDER BY created_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskComment,
            r#"SELECT
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                author_id,
                author_type as "author_type!: AuthorType",
                content,
                comment_type as "comment_type!: CommentType",
                parent_comment_id as "parent_comment_id: Uuid",
                mentions,
                metadata,
                created_at as "created_at!: DateTime<Utc>"
               FROM task_comments
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, data: &CreateTaskComment) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let comment_type = data.comment_type.clone().unwrap_or(CommentType::Comment);
        let mentions_json = data
            .mentions
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap());
        let metadata_json = data
            .metadata
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap());

        sqlx::query_as!(
            TaskComment,
            r#"INSERT INTO task_comments (id, task_id, author_id, author_type, content, comment_type, parent_comment_id, mentions, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                author_id,
                author_type as "author_type!: AuthorType",
                content,
                comment_type as "comment_type!: CommentType",
                parent_comment_id as "parent_comment_id: Uuid",
                mentions,
                metadata,
                created_at as "created_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.author_id,
            data.author_type,
            data.content,
            comment_type,
            data.parent_comment_id,
            mentions_json,
            metadata_json
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM task_comments WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
