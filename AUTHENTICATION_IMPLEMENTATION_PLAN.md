# Authentication Implementation Plan
**Date:** 2025-09-29
**Status:** Ready to Implement

---

## Current State Analysis

### Existing Infrastructure
✅ **Has:**
- GitHub OAuth device flow (working)
- SQLite database with migrations system
- Axum web server
- Config file storage for OAuth tokens

❌ **Missing:**
- User database table
- Email/password authentication
- JWT session management
- Workspaces/teams tables
- RBAC middleware
- User API endpoints

---

## Phase 1: Database Foundation (Week 1)

### Step 1.1: Create User Management Migration

**File:** `crates/db/migrations/20251001000000_user_management.sql`

```sql
-- User Management Migration
-- Adds core user, workspace, team, and session tables

PRAGMA foreign_keys = ON;

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS users (
    id BLOB PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    password_hash TEXT, -- bcrypt hash for email/password auth
    github_id TEXT UNIQUE, -- For GitHub OAuth linking
    github_token TEXT, -- Encrypted OAuth token
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT, -- TOTP secret (encrypted)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    last_login_at TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_status ON users(status);

-- Workspaces (multi-tenancy)
CREATE TABLE IF NOT EXISTS workspaces (
    id BLOB PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '🏢',
    description TEXT,
    owner_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
    settings TEXT DEFAULT '{}', -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Teams (within workspaces)
CREATE TABLE IF NOT EXISTS teams (
    id BLOB PRIMARY KEY,
    workspace_id BLOB NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE INDEX idx_teams_workspace_id ON teams(workspace_id);

-- Team membership with RBAC
CREATE TABLE IF NOT EXISTS team_members (
    id BLOB PRIMARY KEY,
    team_id BLOB NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'lead', 'member', 'guest')),
    joined_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

-- Sessions (JWT-based)
CREATE TABLE IF NOT EXISTS sessions (
    id BLOB PRIMARY KEY,
    user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL, -- SHA256 hash of JWT
    refresh_token_hash TEXT UNIQUE, -- For refresh token rotation
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    last_accessed_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Invitations (workspace onboarding)
CREATE TABLE IF NOT EXISTS invitations (
    id BLOB PRIMARY KEY,
    workspace_id BLOB NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'member', 'guest')),
    invited_by BLOB NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    accepted_at TEXT
);

CREATE INDEX idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Audit logs (compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BLOB PRIMARY KEY,
    workspace_id BLOB REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id BLOB REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id BLOB,
    details TEXT DEFAULT '{}', -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add workspace_id to existing tables
ALTER TABLE projects ADD COLUMN workspace_id BLOB REFERENCES workspaces(id);
ALTER TABLE projects ADD COLUMN created_by BLOB REFERENCES users(id);
ALTER TABLE projects ADD COLUMN owner_id BLOB REFERENCES users(id);

ALTER TABLE tasks ADD COLUMN created_by BLOB REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN assigned_to BLOB REFERENCES users(id);

-- Update favorites table to use real user_id (was nullable placeholder)
-- Note: existing favorites data will be lost if user_id was NULL
DELETE FROM favorites WHERE user_id IS NULL;

-- Create indexes for foreign keys
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
```

### Step 1.2: Add SQLx Model Structs

**File:** `crates/db/src/models/user.rs` (NEW)

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
pub struct User {
    #[ts(type = "string")]
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    #[serde(skip_serializing)] // Never expose password hash
    pub password_hash: Option<String>,
    pub github_id: Option<String>,
    #[serde(skip_serializing)]
    pub github_token: Option<String>,
    pub email_verified: bool,
    pub two_factor_enabled: bool,
    #[serde(skip_serializing)]
    pub two_factor_secret: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub last_login_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
pub struct Workspace {
    #[ts(type = "string")]
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub icon: String,
    pub description: Option<String>,
    #[ts(type = "string")]
    pub owner_id: Uuid,
    pub plan_tier: String,
    pub settings: String, // JSON string
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
pub struct Team {
    #[ts(type = "string")]
    pub id: Uuid,
    #[ts(type = "string")]
    pub workspace_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
pub struct TeamMember {
    #[ts(type = "string")]
    pub id: Uuid,
    #[ts(type = "string")]
    pub team_id: Uuid,
    #[ts(type = "string")]
    pub user_id: Uuid,
    pub role: String, // owner, admin, lead, member, guest
    pub joined_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
pub struct Session {
    #[ts(type = "string")]
    pub id: Uuid,
    #[ts(type = "string")]
    pub user_id: Uuid,
    #[serde(skip_serializing)]
    pub token_hash: String,
    #[serde(skip_serializing)]
    pub refresh_token_hash: Option<String>,
    pub expires_at: String,
    pub created_at: String,
    pub last_accessed_at: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}

// Minimal user info for API responses (no sensitive data)
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct UserPublic {
    #[ts(type = "string")]
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub email_verified: bool,
    pub two_factor_enabled: bool,
    pub created_at: String,
    pub last_login_at: Option<String>,
}

impl From<User> for UserPublic {
    fn from(user: User) -> Self {
        UserPublic {
            id: user.id,
            email: user.email,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        }
    }
}
```

### Step 1.3: Update DB Crate

**File:** `crates/db/src/models/mod.rs`

```rust
pub mod user; // Add this line
pub mod project;
pub mod task;
// ... existing modules
```

---

## Phase 2: Authentication Service (Week 2)

### Step 2.1: JWT Service

**File:** `crates/services/src/services/jwt.rs` (NEW)

**Dependencies to add to `Cargo.toml`:**
```toml
jsonwebtoken = "9.3"
bcrypt = "0.15"
```

```rust
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum JwtError {
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
    #[error("Failed to create token: {0}")]
    CreateError(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // user_id
    pub exp: i64,    // expiration timestamp
    pub iat: i64,    // issued at
    pub workspace_id: Option<String>,
    pub role: Option<String>,
}

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &str) -> Self {
        JwtService {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn create_token(
        &self,
        user_id: Uuid,
        workspace_id: Option<Uuid>,
        role: Option<String>,
        expires_in_hours: i64,
    ) -> Result<String, JwtError> {
        let now = chrono::Utc::now();
        let exp = now + chrono::Duration::hours(expires_in_hours);

        let claims = Claims {
            sub: user_id.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            workspace_id: workspace_id.map(|id| id.to_string()),
            role,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| JwtError::CreateError(e.to_string()))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, JwtError> {
        let validation = Validation::default();
        decode::<Claims>(token, &self.decoding_key, &validation)
            .map(|data| data.claims)
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => JwtError::TokenExpired,
                _ => JwtError::InvalidToken,
            })
    }
}
```

### Step 2.2: User Service

**File:** `crates/services/src/services/user_service.rs` (NEW)

```rust
use anyhow::{Context, Result};
use bcrypt::{hash, verify, DEFAULT_COST};
use db::models::user::{User, UserPublic};
use sqlx::SqlitePool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum UserServiceError {
    #[error("User not found")]
    NotFound,
    #[error("Email already exists")]
    EmailExists,
    #[error("Username already exists")]
    UsernameExists,
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("Database error: {0}")]
    DatabaseError(String),
}

pub struct UserService {
    pool: SqlitePool,
}

impl UserService {
    pub fn new(pool: SqlitePool) -> Self {
        UserService { pool }
    }

    pub async fn create_user(
        &self,
        email: String,
        username: String,
        password: String,
    ) -> Result<UserPublic, UserServiceError> {
        // Check if email exists
        let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)")
            .bind(&email)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        if exists {
            return Err(UserServiceError::EmailExists);
        }

        // Hash password
        let password_hash = hash(password.as_bytes(), DEFAULT_COST)
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        let user_id = Uuid::new_v4();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO users (id, email, username, password_hash, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, false, ?, ?)
            "#,
        )
        .bind(user_id.as_bytes().as_slice())
        .bind(&email)
        .bind(&username)
        .bind(&password_hash)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(user_id.as_bytes().as_slice())
            .fetch_one(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        Ok(user.into())
    }

    pub async fn authenticate(
        &self,
        email: String,
        password: String,
    ) -> Result<User, UserServiceError> {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE email = ? AND status = 'active'")
            .bind(&email)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?
            .ok_or(UserServiceError::InvalidCredentials)?;

        let password_hash = user
            .password_hash
            .as_ref()
            .ok_or(UserServiceError::InvalidCredentials)?;

        let valid = verify(password.as_bytes(), password_hash)
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        if !valid {
            return Err(UserServiceError::InvalidCredentials);
        }

        // Update last login
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE users SET last_login_at = ? WHERE id = ?")
            .bind(&now)
            .bind(user.id.as_bytes().as_slice())
            .execute(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        Ok(user)
    }

    pub async fn get_by_id(&self, user_id: Uuid) -> Result<UserPublic, UserServiceError> {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(user_id.as_bytes().as_slice())
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?
            .ok_or(UserServiceError::NotFound)?;

        Ok(user.into())
    }

    pub async fn link_github_account(
        &self,
        user_id: Uuid,
        github_id: String,
        github_token: String,
    ) -> Result<(), UserServiceError> {
        sqlx::query("UPDATE users SET github_id = ?, github_token = ? WHERE id = ?")
            .bind(&github_id)
            .bind(&github_token)
            .bind(user_id.as_bytes().as_slice())
            .execute(&self.pool)
            .await
            .map_err(|e| UserServiceError::DatabaseError(e.to_string()))?;

        Ok(())
    }
}
```

---

## Phase 3: API Routes (Week 2-3)

### Step 3.1: User Routes

**File:** `crates/server/src/routes/users.rs` (NEW)

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use db::models::user::UserPublic;
use serde::{Deserialize, Serialize};
use services::services::{jwt::JwtService, user_service::{UserService, UserServiceError}};
use uuid::Uuid;

use crate::DeploymentImpl;

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route("/users/register", post(register))
        .route("/users/login", post(login))
        .route("/users/me", get(get_current_user))
        .route("/users/:id", get(get_user))
}

#[derive(Deserialize)]
struct RegisterRequest {
    email: String,
    username: String,
    password: String,
}

#[derive(Serialize)]
struct AuthResponse {
    user: UserPublic,
    token: String,
    refresh_token: String,
}

async fn register(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let user_service = UserService::new(deployment.db().pool.clone());
    let jwt_service = JwtService::new(&get_jwt_secret()?);

    let user = user_service
        .create_user(payload.email, payload.username, payload.password)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let token = jwt_service
        .create_token(user.id, None, None, 24) // 24 hour token
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let refresh_token = jwt_service
        .create_token(user.id, None, None, 720) // 30 day refresh
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        user,
        token,
        refresh_token,
    }))
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

async fn login(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let user_service = UserService::new(deployment.db().pool.clone());
    let jwt_service = JwtService::new(&get_jwt_secret()?);

    let user = user_service
        .authenticate(payload.email, payload.password)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let token = jwt_service
        .create_token(user.id, None, None, 24)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let refresh_token = jwt_service
        .create_token(user.id, None, None, 720)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        user: user.into(),
        token,
        refresh_token,
    }))
}

async fn get_current_user(
    State(deployment): State<DeploymentImpl>,
    // TODO: Extract user from JWT middleware
) -> Result<Json<UserPublic>, StatusCode> {
    // Implementation pending middleware
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn get_user(
    State(deployment): State<DeploymentImpl>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserPublic>, StatusCode> {
    let user_service = UserService::new(deployment.db().pool.clone());
    let user = user_service
        .get_by_id(id)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

fn get_jwt_secret() -> Result<String, StatusCode> {
    std::env::var("JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}
```

### Step 3.2: Update Routes Mod

**File:** `crates/server/src/routes/mod.rs`

```rust
pub mod users; // Add this

pub fn router(deployment: DeploymentImpl) -> Router {
    Router::new()
        .nest("/api", api_router(&deployment))
        // ... existing routes

fn api_router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .merge(users::router(deployment)) // Add this
        .merge(auth::router(deployment))
        .merge(projects::router(deployment))
        // ... existing routes
}
```

---

## Phase 4: Middleware (Week 3)

### Step 4.1: Auth Middleware

**File:** `crates/server/src/middleware/auth.rs` (NEW)

```rust
use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};
use services::services::jwt::{Claims, JwtService};

use crate::DeploymentImpl;

pub async fn require_auth(
    State(deployment): State<DeploymentImpl>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let jwt_secret = std::env::var("JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let jwt_service = JwtService::new(&jwt_secret);

    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = jwt_service
        .verify_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions for downstream handlers
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}
```

---

## Environment Configuration

**File:** `.env.example`

```bash
# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# GitHub OAuth (existing)
GITHUB_CLIENT_ID=Ov23li9bxz3kKfPOIsGm

# Database
DATABASE_URL=sqlite://data.db

# Server
BACKEND_PORT=3003
HOST=127.0.0.1
```

---

## Testing Strategy

### Manual Testing Sequence

1. **Database Migration**
   ```bash
   cd /Users/bodhi/Documents/GitHub/pcg-dashboard-mcp
   cargo run --bin server  # Should auto-run migrations
   ```

2. **Register User**
   ```bash
   curl -X POST http://localhost:3003/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:3003/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Authenticated Request**
   ```bash
   curl http://localhost:3003/api/users/me \
     -H "Authorization: Bearer <token_from_login>"
   ```

---

## Success Criteria

✅ Phase 1 Complete When:
- Migration runs without errors
- All tables created
- Existing data preserved

✅ Phase 2 Complete When:
- User registration works
- Password hashing functional
- JWT tokens generated

✅ Phase 3 Complete When:
- `/users/register` endpoint works
- `/users/login` endpoint works
- Tokens returned correctly

✅ Phase 4 Complete When:
- Auth middleware validates tokens
- Protected routes reject unauthenticated requests
- Claims extracted and available to handlers

---

## Next Phase Preview (Week 4+)

After authentication foundation:
1. **Workspace Management API**
2. **RBAC Middleware**
3. **Frontend Integration**
4. **GitHub OAuth Migration**

---

*Generated: 2025-09-29*
*Status: Ready for Implementation*