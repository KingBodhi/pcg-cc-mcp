use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct ProjectAsset {
    pub id: Uuid,
    pub project_id: Uuid,
    pub pod_id: Option<Uuid>,
    pub board_id: Option<Uuid>,
    pub category: String,
    pub scope: String,
    pub name: String,
    pub storage_path: String,
    pub checksum: Option<String>,
    pub byte_size: Option<i64>,
    pub mime_type: Option<String>,
    pub metadata: Option<String>,
    pub uploaded_by: Option<String>,
    #[ts(type = "Date")]
    pub created_at: DateTime<Utc>,
    #[ts(type = "Date")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateProjectAsset {
    pub project_id: Uuid,
    #[ts(optional)]
    pub pod_id: Option<Uuid>,
    #[ts(optional)]
    pub board_id: Option<Uuid>,
    #[ts(optional)]
    pub category: Option<String>,
    #[ts(optional)]
    pub scope: Option<String>,
    pub name: String,
    pub storage_path: String,
    #[ts(optional)]
    pub checksum: Option<String>,
    #[ts(optional)]
    pub byte_size: Option<i64>,
    #[ts(optional)]
    pub mime_type: Option<String>,
    #[ts(optional)]
    pub metadata: Option<String>,
    #[ts(optional)]
    pub uploaded_by: Option<String>,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdateProjectAsset {
    #[ts(optional)]
    pub pod_id: Option<Uuid>,
    #[ts(optional)]
    pub board_id: Option<Uuid>,
    #[ts(optional)]
    pub category: Option<String>,
    #[ts(optional)]
    pub scope: Option<String>,
    #[ts(optional)]
    pub name: Option<String>,
    #[ts(optional)]
    pub storage_path: Option<String>,
    #[ts(optional)]
    pub checksum: Option<String>,
    #[ts(optional)]
    pub byte_size: Option<i64>,
    #[ts(optional)]
    pub mime_type: Option<String>,
    #[ts(optional)]
    pub metadata: Option<String>,
}

impl ProjectAsset {
    pub async fn find_by_project(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as::<_, ProjectAsset>(
            r#"
            SELECT
                id,
                project_id,
                pod_id,
                board_id,
                category,
                scope,
                name,
                storage_path,
                checksum,
                byte_size,
                mime_type,
                metadata,
                uploaded_by,
                created_at,
                updated_at
            FROM project_assets
            WHERE project_id = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as::<_, ProjectAsset>(
            r#"
            SELECT
                id,
                project_id,
                pod_id,
                board_id,
                category,
                scope,
                name,
                storage_path,
                checksum,
                byte_size,
                mime_type,
                metadata,
                uploaded_by,
                created_at,
                updated_at
            FROM project_assets
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        asset_id: Uuid,
        data: &CreateProjectAsset,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as::<_, ProjectAsset>(
            r#"
            INSERT INTO project_assets (id, project_id, pod_id, board_id, category, scope, name, storage_path, checksum, byte_size, mime_type, metadata, uploaded_by)
            VALUES (?, ?, ?, ?, COALESCE(?, 'file'), COALESCE(?, 'team'), ?, ?, ?, ?, ?, ?, ?)
            RETURNING
                id,
                project_id,
                pod_id,
                board_id,
                category,
                scope,
                name,
                storage_path,
                checksum,
                byte_size,
                mime_type,
                metadata,
                uploaded_by,
                created_at,
                updated_at
            "#,
        )
        .bind(asset_id)
        .bind(data.project_id)
        .bind(data.pod_id)
        .bind(data.board_id)
        .bind(&data.category)
        .bind(&data.scope)
        .bind(&data.name)
        .bind(&data.storage_path)
        .bind(&data.checksum)
        .bind(data.byte_size)
        .bind(&data.mime_type)
        .bind(&data.metadata)
        .bind(&data.uploaded_by)
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        data: &UpdateProjectAsset,
    ) -> Result<Self, sqlx::Error> {
        let existing = Self::find_by_id(pool, id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let pod_id = data.pod_id.or(existing.pod_id);
        let board_id = data.board_id.or(existing.board_id);
        let category = data.category.as_ref().unwrap_or(&existing.category);
        let scope = data.scope.as_ref().unwrap_or(&existing.scope);
        let name = data.name.as_ref().unwrap_or(&existing.name);
        let storage_path = data.storage_path.as_ref().unwrap_or(&existing.storage_path);
        let checksum = data.checksum.as_ref().or(existing.checksum.as_ref());
        let byte_size = data.byte_size.or(existing.byte_size);
        let mime_type = data.mime_type.as_ref().or(existing.mime_type.as_ref());
        let metadata = data.metadata.as_ref().or(existing.metadata.as_ref());

        sqlx::query_as::<_, ProjectAsset>(
            r#"
            UPDATE project_assets
            SET
                pod_id       = ?,
                board_id     = ?,
                category     = ?,
                scope        = ?,
                name         = ?,
                storage_path = ?,
                checksum     = ?,
                byte_size    = ?,
                mime_type    = ?,
                metadata     = ?
            WHERE id = ?
            RETURNING
                id,
                project_id,
                pod_id,
                board_id,
                category,
                scope,
                name,
                storage_path,
                checksum,
                byte_size,
                mime_type,
                metadata,
                uploaded_by,
                created_at,
                updated_at
            "#,
        )
        .bind(pod_id)
        .bind(board_id)
        .bind(category)
        .bind(scope)
        .bind(name)
        .bind(storage_path)
        .bind(checksum)
        .bind(byte_size)
        .bind(mime_type)
        .bind(metadata)
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query("DELETE FROM project_assets WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }
}
