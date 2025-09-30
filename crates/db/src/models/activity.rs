use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "actor_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ActorType {
    Human,
    Agent,
    Mcp,
    System,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct ActivityLog {
    pub id: Uuid,
    pub task_id: Uuid,
    pub actor_id: String,
    pub actor_type: ActorType,
    pub action: String,
    pub previous_state: Option<String>, // JSON object
    pub new_state: Option<String>,      // JSON object
    pub metadata: Option<String>,       // JSON object
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateActivityLog {
    pub task_id: Uuid,
    pub actor_id: String,
    pub actor_type: ActorType,
    pub action: String,
    pub previous_state: Option<serde_json::Value>,
    pub new_state: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

impl ActivityLog {
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            ActivityLog,
            r#"SELECT
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                actor_id,
                actor_type as "actor_type!: ActorType",
                action,
                previous_state,
                new_state,
                metadata,
                timestamp as "timestamp!: DateTime<Utc>"
               FROM activity_logs
               WHERE task_id = $1
               ORDER BY timestamp DESC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            ActivityLog,
            r#"SELECT
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                actor_id,
                actor_type as "actor_type!: ActorType",
                action,
                previous_state,
                new_state,
                metadata,
                timestamp as "timestamp!: DateTime<Utc>"
               FROM activity_logs
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        data: &CreateActivityLog,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let previous_state_json = data
            .previous_state
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap());
        let new_state_json = data
            .new_state
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap());
        let metadata_json = data
            .metadata
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap());

        sqlx::query_as!(
            ActivityLog,
            r#"INSERT INTO activity_logs (id, task_id, actor_id, actor_type, action, previous_state, new_state, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING
                id as "id!: Uuid",
                task_id as "task_id!: Uuid",
                actor_id,
                actor_type as "actor_type!: ActorType",
                action,
                previous_state,
                new_state,
                metadata,
                timestamp as "timestamp!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.actor_id,
            data.actor_type,
            data.action,
            previous_state_json,
            new_state_json,
            metadata_json
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM activity_logs WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
