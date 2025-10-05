use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, Eq, TS)]
#[sqlx(type_name = "dependency_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum DependencyType {
    Blocks,
    RelatesTo,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskDependency {
    pub id: Uuid,
    pub project_id: Uuid,
    pub source_task_id: Uuid,
    pub target_task_id: Uuid,
    pub dependency_type: DependencyType,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskDependency {
    pub project_id: Uuid,
    pub source_task_id: Uuid,
    pub target_task_id: Uuid,
    pub dependency_type: DependencyType,
}

impl TaskDependency {
    pub async fn list_by_project(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskDependency,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                source_task_id as "source_task_id!: Uuid",
                target_task_id as "target_task_id!: Uuid",
                dependency_type as "dependency_type!: DependencyType",
                created_at as "created_at!: DateTime<Utc>"
              FROM task_dependencies
             WHERE project_id = $1
             ORDER BY created_at"#,
            project_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn list_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskDependency,
            r#"SELECT
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                source_task_id as "source_task_id!: Uuid",
                target_task_id as "target_task_id!: Uuid",
                dependency_type as "dependency_type!: DependencyType",
                created_at as "created_at!: DateTime<Utc>"
              FROM task_dependencies
             WHERE source_task_id = $1 OR target_task_id = $1
             ORDER BY created_at"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        payload: &CreateTaskDependency,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let dependency_type = payload.dependency_type.clone();

        sqlx::query_as!(
            TaskDependency,
            r#"INSERT INTO task_dependencies
                (id, project_id, source_task_id, target_task_id, dependency_type)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                source_task_id as "source_task_id!: Uuid",
                target_task_id as "target_task_id!: Uuid",
                dependency_type as "dependency_type!: DependencyType",
                created_at as "created_at!: DateTime<Utc>""#,
            id,
            payload.project_id,
            payload.source_task_id,
            payload.target_task_id,
            dependency_type
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM task_dependencies WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
