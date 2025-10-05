use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, patch},
};
use db::models::project_board::{CreateProjectBoard, ProjectBoard, UpdateProjectBoard};
use deployment::Deployment;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::{DeploymentImpl, error::ApiError};

#[derive(Debug, Deserialize)]
struct ProjectBoardsPath {
    project_id: Uuid,
}

#[derive(Debug, Deserialize)]
struct ProjectBoardPath {
    project_id: Uuid,
    board_id: Uuid,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct ProjectBoardsPayload {
    pub items: Vec<ProjectBoard>,
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route(
            "/projects/{project_id}/boards",
            get(list_boards).post(create_board),
        )
        .route(
            "/projects/{project_id}/boards/{board_id}",
            patch(update_board).delete(delete_board),
        )
        .with_state(deployment.clone())
}

async fn list_boards(
    State(deployment): State<DeploymentImpl>,
    Path(ProjectBoardsPath { project_id }): Path<ProjectBoardsPath>,
) -> Result<Json<ApiResponse<Vec<ProjectBoard>>>, ApiError> {
    let boards = ProjectBoard::list_by_project(&deployment.db().pool, project_id).await?;
    Ok(Json(ApiResponse::success(boards)))
}

fn normalize_slug(source: &str) -> String {
    let slug = source
        .trim()
        .to_lowercase()
        .replace(|c: char| !c.is_ascii_alphanumeric(), "-");
    slug.trim_matches('-').to_string()
}

async fn create_board(
    State(deployment): State<DeploymentImpl>,
    Path(ProjectBoardsPath { project_id }): Path<ProjectBoardsPath>,
    Json(mut payload): Json<CreateProjectBoard>,
) -> Result<(StatusCode, Json<ApiResponse<ProjectBoard>>), ApiError> {
    payload.project_id = project_id;
    if payload.slug.trim().is_empty() {
        payload.slug = normalize_slug(&payload.name);
    } else {
        payload.slug = normalize_slug(&payload.slug);
    }
    let board = ProjectBoard::create(&deployment.db().pool, &payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(board))))
}

async fn update_board(
    State(deployment): State<DeploymentImpl>,
    Path(ProjectBoardPath {
        project_id,
        board_id,
    }): Path<ProjectBoardPath>,
    Json(mut payload): Json<UpdateProjectBoard>,
) -> Result<Json<ApiResponse<ProjectBoard>>, ApiError> {
    if let Some(slug) = payload.slug.as_mut() {
        if slug.trim().is_empty() {
            *slug = normalize_slug("board");
        } else {
            *slug = normalize_slug(slug);
        }
    }
    let board = ProjectBoard::update(&deployment.db().pool, board_id, &payload)
        .await?
        .ok_or_else(|| ApiError::NotFound("Board not found".into()))?;
    if board.project_id != project_id {
        return Err(ApiError::BadRequest(
            "Board does not belong to project".into(),
        ));
    }
    Ok(Json(ApiResponse::success(board)))
}

async fn delete_board(
    State(deployment): State<DeploymentImpl>,
    Path(ProjectBoardPath {
        project_id,
        board_id,
    }): Path<ProjectBoardPath>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    let board = ProjectBoard::find_by_id(&deployment.db().pool, board_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Board not found".into()))?;
    if board.project_id != project_id {
        return Err(ApiError::BadRequest(
            "Board does not belong to project".into(),
        ));
    }
    ProjectBoard::delete(&deployment.db().pool, board_id).await?;
    Ok(Json(ApiResponse::success(())))
}
