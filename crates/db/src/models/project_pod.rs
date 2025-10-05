use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct ProjectPod {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: String,
    pub status: String,
    pub lead: Option<String>,
    #[ts(type = "Date")]
    pub created_at: DateTime<Utc>,
    #[ts(type = "Date")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateProjectPod {
    pub project_id: Uuid,
    pub title: String,
    #[ts(optional)]
    pub description: Option<String>,
    #[ts(optional)]
    pub status: Option<String>,
    #[ts(optional)]
    pub lead: Option<String>,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdateProjectPod {
    #[ts(optional)]
    pub title: Option<String>,
    #[ts(optional)]
    pub description: Option<String>,
    #[ts(optional)]
    pub status: Option<String>,
    #[ts(optional)]
    pub lead: Option<String>,
}

impl ProjectPod {
    pub async fn find_by_project(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as::<_, ProjectPod>(
            r#"
            SELECT
                id,
                project_id,
                title,
                description,
                status,
                lead,
                created_at,
                updated_at
            FROM project_pods
            WHERE project_id = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as::<_, ProjectPod>(
            r#"
            SELECT
                id,
                project_id,
                title,
                description,
                status,
                lead,
                created_at,
                updated_at
            FROM project_pods
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        pod_id: Uuid,
        data: &CreateProjectPod,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as::<_, ProjectPod>(
            r#"
            INSERT INTO project_pods (id, project_id, title, description, status, lead)
            VALUES (?, ?, ?, COALESCE(?, ''), COALESCE(?, 'active'), ?)
            RETURNING
                id,
                project_id,
                title,
                description,
                status,
                lead,
                created_at,
                updated_at
            "#,
        )
        .bind(pod_id)
        .bind(data.project_id)
        .bind(&data.title)
        .bind(&data.description)
        .bind(&data.status)
        .bind(&data.lead)
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        data: &UpdateProjectPod,
    ) -> Result<Self, sqlx::Error> {
        let existing = Self::find_by_id(pool, id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let title = data.title.as_ref().unwrap_or(&existing.title);
        let description = data.description.as_ref().unwrap_or(&existing.description);
        let status = data.status.as_ref().unwrap_or(&existing.status);
        let lead = data.lead.as_ref().or(existing.lead.as_ref());

        sqlx::query_as::<_, ProjectPod>(
            r#"
            UPDATE project_pods
            SET
                title       = ?,
                description = ?,
                status      = ?,
                lead        = ?
            WHERE id = ?
            RETURNING
                id,
                project_id,
                title,
                description,
                status,
                lead,
                created_at,
                updated_at
            "#,
        )
        .bind(title)
        .bind(description)
        .bind(status)
        .bind(lead)
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query("DELETE FROM project_pods WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
