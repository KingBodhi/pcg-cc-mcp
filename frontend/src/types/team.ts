// Team management types

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type AgentPermission = 'claude_code' | 'amp' | 'gemini' | 'codex' | 'all';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedAgents: AgentPermission[];
  status: 'active' | 'pending' | 'inactive';
  invitedBy: string;
  invitedAt: string;
  avatarUrl?: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: UserRole;
  allowedAgents: AgentPermission[];
}

// Role definitions with permissions
export interface RoleDefinition {
  role: UserRole;
  label: string;
  description: string;
  permissions: {
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canModifyRoles: boolean;
    canAccessAllProjects: boolean;
    canDeleteProjects: boolean;
    canModifyProjectSettings: boolean;
    canAccessAllAgents: boolean;
  };
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  owner: {
    role: 'owner',
    label: 'Owner',
    description: 'Full access to all features and settings',
    permissions: {
      canInviteMembers: true,
      canRemoveMembers: true,
      canModifyRoles: true,
      canAccessAllProjects: true,
      canDeleteProjects: true,
      canModifyProjectSettings: true,
      canAccessAllAgents: true,
    },
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    description: 'Can manage team members and projects',
    permissions: {
      canInviteMembers: true,
      canRemoveMembers: true,
      canModifyRoles: false,
      canAccessAllProjects: true,
      canDeleteProjects: true,
      canModifyProjectSettings: true,
      canAccessAllAgents: true,
    },
  },
  developer: {
    role: 'developer',
    label: 'Developer',
    description: 'Can work on projects with assigned agents',
    permissions: {
      canInviteMembers: false,
      canRemoveMembers: false,
      canModifyRoles: false,
      canAccessAllProjects: true,
      canDeleteProjects: false,
      canModifyProjectSettings: false,
      canAccessAllAgents: false,
    },
  },
  viewer: {
    role: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to projects',
    permissions: {
      canInviteMembers: false,
      canRemoveMembers: false,
      canModifyRoles: false,
      canAccessAllProjects: true,
      canDeleteProjects: false,
      canModifyProjectSettings: false,
      canAccessAllAgents: false,
    },
  },
};

export const AGENT_OPTIONS: { value: AgentPermission; label: string; description: string }[] = [
  { value: 'all', label: 'All Agents', description: 'Access to all available agents' },
  { value: 'claude_code', label: 'Claude Code', description: 'Claude-based coding assistant' },
  { value: 'amp', label: 'AMP', description: 'Advanced Modular Programming agent' },
  { value: 'gemini', label: 'Gemini', description: 'Google Gemini agent' },
  { value: 'codex', label: 'Codex', description: 'OpenAI Codex agent' },
];
