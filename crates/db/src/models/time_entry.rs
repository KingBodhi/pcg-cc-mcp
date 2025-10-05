use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TimeEntry {
    pub id: Uuid,
    pub project_id: Uuid,
    pub task_id: Uuid,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub end_time: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration_seconds: Option<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateTimeEntry {
    pub project_id: Uuid,
    pub task_id: Uuid,
    #[serde(default)]
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    #[serde(default)]
    pub end_time: Option<DateTime<Utc>>,
    #[serde(default)]
    pub duration_seconds: Option<i64>,
}

impl TimeEntry {
    pub async fn list_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TimeEntry,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                task_id as "task_id!: Uuid",
                description,
                start_time as "start_time!: DateTime<Utc>",
                end_time as "end_time: DateTime<Utc>",
                duration_seconds,
                created_at as "created_at!: DateTime<Utc>"
              FROM time_entries
             WHERE task_id = $1
             ORDER BY start_time"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, payload: &CreateTimeEntry) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let duration = payload.duration_seconds.or_else(|| {
            payload
                .end_time
                .map(|end| (end.timestamp() - payload.start_time.timestamp()).max(0))
        });

        sqlx::query_as!(
            TimeEntry,
            r#"INSERT INTO time_entries
                (id, project_id, task_id, description, start_time, end_time, duration_seconds)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                task_id as "task_id!: Uuid",
                description,
                start_time as "start_time!: DateTime<Utc>",
                end_time as "end_time: DateTime<Utc>",
                duration_seconds,
                created_at as "created_at!: DateTime<Utc>""#,
            id,
            payload.project_id,
            payload.task_id,
            payload.description,
            payload.start_time,
            payload.end_time,
            duration
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM time_entries WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
