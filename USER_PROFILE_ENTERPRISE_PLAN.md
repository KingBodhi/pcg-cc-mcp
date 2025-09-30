# Enterprise User Profile & Account Management System
## Comprehensive Implementation Plan

**Date**: 2025-09-29  
**Project**: PCG Command Center - Multi-Actor User Management  
**Inspired by**: Notion's enterprise workspace model

---

## 🎯 Executive Summary

Transform PCG-CC from a single-user system to an enterprise-grade multi-tenant platform with:
- **Role-Based Access Control (RBAC)** with 5 admin levels
- **Team & Workspace Management** (Notion-style)
- **Account lifecycle management** (onboarding → offboarding)
- **Audit logging** & compliance features
- **SSO/SAML integration** for enterprise auth

---

## 📊 Current State Analysis

### What Exists:
✅ **Frontend**: ProfileSection component with mock user data  
✅ **Backend**: GitHub OAuth authentication via device flow  
✅ **Database**: SQLite with migrations infrastructure  
✅ **Config**: User config stored in `~/.config/duck-kanban/config.json`  

### Critical Gaps:
❌ No user database table  
❌ No role/permission system  
❌ No team/workspace concept  
❌ No invite system  
❌ No audit logging  
❌ Sessions stored in config file (not DB)  
❌ No email/password auth (only GitHub OAuth)  

---

## 🏗️ Architecture Design

### 1. Database Schema

#### `users` table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- bcrypt, NULL for OAuth-only users
    github_id VARCHAR(100) UNIQUE,
    github_username VARCHAR(100),
    
    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, guest, restricted
    permissions JSONB DEFAULT '{}', -- Fine-grained permissions
    
    -- Status & Lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, deactivated, pending
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    
    -- Enterprise Features
    workspace_id UUID REFERENCES workspaces(id),
    department VARCHAR(100),
    job_title VARCHAR(100),
    manager_id UUID REFERENCES users(id),
    employee_id VARCHAR(100),
    
    -- 2FA
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- encrypted
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
```

#### `workspaces` table (Notion-inspired)
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}', -- brand colors, logo, etc.
    features_enabled JSONB DEFAULT '[]', -- feature flags per workspace
    
    -- Billing (for future SaaS)
    plan VARCHAR(50) DEFAULT 'free', -- free, team, business, enterprise
    max_users INTEGER DEFAULT 5,
    billing_email VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, trial, suspended, deleted
    trial_ends_at TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### `teams` table (Notion pages = our teams)
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    
    -- Hierarchy
    parent_team_id UUID REFERENCES teams(id),
    
    -- Settings
    is_private BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_workspace ON teams(workspace_id);
```

#### `team_members` table
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- lead, member, viewer
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(team_id, user_id)
);
```

#### `sessions` table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL, -- JWT or opaque token
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Session Info
    ip_address INET,
    user_agent TEXT,
    device_name VARCHAR(255),
    location VARCHAR(255),
    
    -- Lifecycle
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### `invitations` table
```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    role VARCHAR(50) DEFAULT 'member',
    
    -- Invitation Details
    invite_code VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    
    -- Optional team assignment
    team_ids UUID[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
```

#### `audit_logs` table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    
    -- Event Details
    action VARCHAR(100) NOT NULL, -- user.created, user.role_changed, project.deleted, etc.
    resource_type VARCHAR(50), -- user, project, task, workspace
    resource_id VARCHAR(255),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}', -- old_value, new_value, etc.
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- For compliance (GDPR, SOC2)
    retention_until TIMESTAMP
);

CREATE INDEX idx_audit_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## 🔐 Role-Based Access Control (RBAC)

### Permission Levels (Notion-inspired hierarchy)

#### 1. **Workspace Owner** (God Mode)
- Full control over workspace
- Manage billing & subscription
- Delete workspace
- Transfer ownership
- Access all data regardless of team membership

#### 2. **Workspace Admin**
- Manage users (invite, suspend, change roles)
- Manage teams
- Configure workspace settings
- Cannot delete workspace or change billing
- View audit logs

#### 3. **Team Lead / Manager**
- Manage team members
- Create/edit/delete projects within team
- Assign tasks to team members
- View team analytics
- Limited workspace visibility

#### 4. **Member** (Default)
- Create projects in assigned teams
- Create/edit own tasks
- View team projects
- Collaborate on shared projects

#### 5. **Guest / Restricted**
- View-only access to specific projects
- Can comment but not edit
- No team creation
- No user invites

### Permission Matrix

| Action | Owner | Admin | Lead | Member | Guest |
|--------|-------|-------|------|--------|-------|
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ✅* | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create teams | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ✅ | ✅** | ✅** | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Run Nora commands | ✅ | ✅ | ✅ | ✅ | ❌ |

\* Team leads can only invite to their teams  
\** Can only delete own projects

---

## 🎨 Frontend Components

### 1. Enhanced Profile Section
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  permissions: string[];
  status: UserStatus;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  teams: Team[];
  lastActiveAt: Date;
}

enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  LEAD = 'lead',
  MEMBER = 'member',
  GUEST = 'guest'
}

enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated'
}
```

### 2. New Pages Required

#### `/settings/account`
- Profile info (name, email, avatar)
- Change password
- 2FA setup
- Connected accounts (GitHub, Google, etc.)
- Danger zone (delete account)

#### `/settings/workspace`
- Workspace details
- Team management
- User management (admin only)
- Roles & permissions config
- SSO configuration (enterprise)

#### `/settings/users` (Admin only)
- User list with filters (role, status, team)
- Bulk actions (suspend, change role)
- Invite new users
- Manage pending invitations

#### `/settings/security`
- Session management (view active sessions, revoke)
- 2FA enforcement policy
- Password policy
- IP whitelist (enterprise)

#### `/settings/audit-log` (Admin only)
- Filterable audit trail
- Export to CSV
- Retention policy

---

## 🔧 Backend API Endpoints

### Authentication
```rust
POST   /api/auth/register              // Email/password signup
POST   /api/auth/login                 // Email/password login
POST   /api/auth/logout                // Invalidate session
POST   /api/auth/refresh               // Refresh JWT token
POST   /api/auth/forgot-password       // Send reset email
POST   /api/auth/reset-password        // Reset with token
POST   /api/auth/verify-email          // Verify email with token

// OAuth (existing GitHub + add more)
POST   /api/auth/github/callback       // GitHub OAuth
POST   /api/auth/google/callback       // Google OAuth (future)

// 2FA
POST   /api/auth/2fa/setup             // Generate TOTP secret
POST   /api/auth/2fa/verify            // Verify TOTP code
POST   /api/auth/2fa/disable           // Disable 2FA
GET    /api/auth/2fa/backup-codes      // Get backup codes
```

### Users
```rust
GET    /api/users                      // List workspace users (admin)
GET    /api/users/:id                  // Get user details
PATCH  /api/users/:id                  // Update user
DELETE /api/users/:id                  // Deactivate user (admin)
PATCH  /api/users/:id/role             // Change user role (admin)
PATCH  /api/users/:id/suspend          // Suspend user (admin)
GET    /api/users/me                   // Get current user
PATCH  /api/users/me                   // Update own profile
```

### Workspaces
```rust
POST   /api/workspaces                 // Create workspace
GET    /api/workspaces/:id             // Get workspace
PATCH  /api/workspaces/:id             // Update workspace (admin)
DELETE /api/workspaces/:id             // Delete workspace (owner only)
GET    /api/workspaces/:id/members     // List members
POST   /api/workspaces/:id/transfer    // Transfer ownership
```

### Teams
```rust
POST   /api/teams                      // Create team
GET    /api/teams                      // List teams
GET    /api/teams/:id                  // Get team
PATCH  /api/teams/:id                  // Update team
DELETE /api/teams/:id                  // Delete team
POST   /api/teams/:id/members          // Add member
DELETE /api/teams/:id/members/:userId  // Remove member
```

### Invitations
```rust
POST   /api/invitations                // Send invitation
GET    /api/invitations                // List pending invitations
DELETE /api/invitations/:id            // Revoke invitation
POST   /api/invitations/:code/accept   // Accept invitation
```

### Sessions
```rust
GET    /api/sessions                   // List active sessions
DELETE /api/sessions/:id               // Revoke session
DELETE /api/sessions                   // Revoke all other sessions
```

### Audit Logs
```rust
GET    /api/audit-logs                 // List audit logs (admin)
GET    /api/audit-logs/export          // Export to CSV (admin)
```

---

## 🔒 Security Features

### 1. Password Policy
- Minimum 12 characters
- Require uppercase, lowercase, number, special char
- Check against haveibeenpwned API
- Password history (prevent reuse of last 5)
- Force reset every 90 days (enterprise)

### 2. Session Management
- JWT with short expiry (15 min) + refresh token (7 days)
- Automatic session expiry on inactivity (30 min)
- Device fingerprinting
- Concurrent session limits

### 3. Rate Limiting
- Login attempts: 5 per 15 minutes
- API calls: 1000 per hour per user
- Password reset: 3 per hour per email

### 4. Two-Factor Authentication
- TOTP (Google Authenticator, Authy)
- SMS backup (optional)
- Backup codes (10 one-time codes)
- Enforce 2FA for admins/owners

### 5. SSO/SAML (Enterprise)
- Okta integration
- Azure AD integration
- Custom SAML IdP support
- JIT (Just-In-Time) provisioning

---

## 📧 Email Notifications

### User Lifecycle
- Welcome email (with verification link)
- Invitation to workspace
- Role changed notification
- Account suspended notice
- Password changed confirmation
- New login from unknown device

### Security
- 2FA enabled/disabled
- Password reset requested
- Session revoked
- Failed login attempts (5+ in 15 min)

### Workspace
- New member joined
- Member left
- Workspace settings changed (admin only)

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations (users, workspaces, sessions tables)
- [ ] Basic Rust models & CRUD operations
- [ ] JWT authentication middleware
- [ ] Email/password registration & login API
- [ ] Session management backend

### Phase 2: Core Features (Week 3-4)
- [ ] Role-based access control (RBAC) implementation
- [ ] User management API (admin functions)
- [ ] Frontend: UserContext provider
- [ ] Frontend: Enhanced ProfileSection with real data
- [ ] Frontend: `/settings/account` page
- [ ] Frontend: `/settings/users` page (admin)

### Phase 3: Teams & Workspaces (Week 5-6)
- [ ] Workspace creation & management
- [ ] Team creation & membership
- [ ] Invitation system (backend + email)
- [ ] Frontend: Workspace switcher
- [ ] Frontend: Team management UI
- [ ] Update projects table with workspace_id/team_id foreign keys

### Phase 4: Security & Compliance (Week 7-8)
- [ ] 2FA implementation (TOTP)
- [ ] Audit logging system
- [ ] Frontend: `/settings/security` page
- [ ] Frontend: `/settings/audit-log` page
- [ ] Session viewer & revocation
- [ ] Password policy enforcement

### Phase 5: Enterprise Features (Week 9-10)
- [ ] SSO/SAML integration
- [ ] Advanced permissions (fine-grained)
- [ ] IP whitelisting
- [ ] Compliance exports (GDPR, SOC2)
- [ ] Admin analytics dashboard
- [ ] Billing integration (Stripe)

---

## 🧪 Testing Strategy

### Unit Tests
- Password hashing/validation
- JWT token generation/validation
- Permission checks (RBAC)
- Email validation & sending

### Integration Tests
- User registration → verification → login flow
- Invitation → acceptance → team membership
- Role change → permission update
- Session creation → refresh → revoke

### E2E Tests (Playwright)
- Complete signup flow
- Login with 2FA
- Admin user management
- Team creation & member invite
- Session management

---

## 📊 Metrics & Monitoring

### User Metrics
- Daily/monthly active users (DAU/MAU)
- User retention (30/60/90 day)
- Role distribution
- Average session duration

### Security Metrics
- Failed login attempts
- 2FA adoption rate
- Suspicious activity alerts
- Session revocations

### Workspace Metrics
- Workspaces created
- Average team size
- Projects per workspace
- User invites sent/accepted

---

## 🚀 Migration Strategy

### For Existing Users
1. Create default workspace for each existing config
2. Mark all as "Owner" role initially
3. Migrate GitHub username/email from config to users table
4. Keep config file for backwards compatibility (deprecated)
5. Auto-migration script: `cargo run --bin migrate-users`

### Zero Downtime Migration
1. Feature flag: `ENABLE_MULTI_USER=false` (default)
2. Run migrations
3. Test in staging
4. Enable feature flag
5. Gradual rollout (10% → 50% → 100%)

---

## 💰 Business Model Considerations

### Pricing Tiers (Future SaaS)

**Free**
- 1 workspace
- 5 users
- Basic features
- Community support

**Team ($15/user/month)**
- Unlimited workspaces
- Unlimited users (min 3)
- Teams feature
- Priority support
- Audit logs (30 days)

**Business ($30/user/month)**
- Everything in Team
- SSO/SAML
- Advanced permissions
- Audit logs (1 year)
- SLA guarantee
- Custom branding

**Enterprise (Custom)**
- Everything in Business
- Self-hosted option
- Dedicated support
- Custom integrations
- Compliance (HIPAA, SOC2)
- Unlimited retention

---

## 📚 References & Inspiration

- **Notion**: Workspace/team model, role hierarchy
- **Linear**: Clean team management, invite flows
- **GitHub**: Teams, org-level permissions
- **Slack**: Workspace switching, channel-like teams
- **Jira**: Project-level permissions, admin controls

---

## ✅ Success Criteria

1. **MVP**: 3 users can collaborate in 1 workspace with different roles
2. **Security**: Pass basic OWASP security audit
3. **Performance**: Auth endpoints < 200ms p95
4. **UX**: Invite-to-active user < 2 minutes
5. **Compliance**: GDPR-compliant audit logs

---

**Status**: 📝 Planning Complete → Ready for Implementation  
**Next Step**: Create Phase 1 database migrations

