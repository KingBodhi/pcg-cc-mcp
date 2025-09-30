import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Crown,
  Eye,
  Code,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { cn } from '@/lib/utils';
import type {
  TeamMember,
  UserRole,
  AgentPermission,
} from '@/types/team';
import { ROLE_DEFINITIONS, AGENT_OPTIONS } from '@/types/team';

const STORAGE_KEY = 'team-members';

const ROLE_ICONS: Record<UserRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  developer: Code,
  viewer: Eye,
};

const STATUS_ICONS = {
  active: CheckCircle2,
  pending: Clock,
  inactive: XCircle,
};

export const TeamManagementDialog = NiceModal.create(() => {
  const modal = useModal();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('developer');
  const [inviteAgents, setInviteAgents] = useState<AgentPermission[]>(['all']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load team members from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMembers(parsed);
      } catch (e) {
        console.error('Failed to parse team members:', e);
      }
    } else {
      // Initialize with mock owner
      const mockOwner: TeamMember = {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'owner',
        allowedAgents: ['all'],
        status: 'active',
        invitedBy: 'system',
        invitedAt: new Date().toISOString(),
      };
      setMembers([mockOwner]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockOwner]));
    }
  }, []);

  // Save to localStorage when members change
  const saveMembers = (updatedMembers: TeamMember[]) => {
    setMembers(updatedMembers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMembers));
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      return;
    }

    // Check if email already exists
    if (members.some((m) => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      alert('This email is already on the team');
      return;
    }

    setIsSubmitting(true);

    try {
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name: inviteEmail.split('@')[0], // Temporary name from email
        email: inviteEmail.trim(),
        role: inviteRole,
        allowedAgents: inviteAgents,
        status: 'pending',
        invitedBy: '1', // Current user ID
        invitedAt: new Date().toISOString(),
      };

      saveMembers([...members, newMember]);

      // Reset form
      setInviteEmail('');
      setInviteRole('developer');
      setInviteAgents(['all']);
      setShowInviteForm(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      saveMembers(members.filter((m) => m.id !== memberId));
    }
  };

  const handleUpdateRole = (memberId: string, newRole: UserRole) => {
    saveMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleUpdateAgents = (memberId: string, newAgents: AgentPermission[]) => {
    saveMembers(
      members.map((m) => (m.id === memberId ? { ...m, allowedAgents: newAgents } : m))
    );
  };

  const toggleAgentAccess = (memberId: string, agent: AgentPermission) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    let newAgents: AgentPermission[];

    if (agent === 'all') {
      // If selecting 'all', clear other selections
      newAgents = ['all'];
    } else {
      // Remove 'all' if selecting individual agent
      const filtered = member.allowedAgents.filter((a) => a !== 'all');

      if (filtered.includes(agent)) {
        newAgents = filtered.filter((a) => a !== agent);
      } else {
        newAgents = [...filtered, agent];
      }

      // If no agents selected, default to 'all'
      if (newAgents.length === 0) {
        newAgents = ['all'];
      }
    }

    handleUpdateAgents(memberId, newAgents);
  };


  const getStatusBadgeColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Invite Button */}
          {!showInviteForm && (
            <Button
              onClick={() => setShowInviteForm(true)}
              className="w-full"
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          )}

          {/* Invite Form */}
          {showInviteForm && (
            <form onSubmit={handleInviteMember} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Invite New Member</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="pl-9"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLE_DEFINITIONS).map((roleDef) => {
                      const Icon = ROLE_ICONS[roleDef.role];
                      return (
                        <SelectItem key={roleDef.role} value={roleDef.role}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{roleDef.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {roleDef.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Agent Access</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {AGENT_OPTIONS.map((agent) => (
                    <button
                      key={agent.value}
                      type="button"
                      onClick={() => {
                        if (agent.value === 'all') {
                          setInviteAgents(['all']);
                        } else {
                          const filtered = inviteAgents.filter((a) => a !== 'all');
                          if (filtered.includes(agent.value)) {
                            const updated = filtered.filter((a) => a !== agent.value);
                            setInviteAgents(updated.length === 0 ? ['all'] : updated);
                          } else {
                            setInviteAgents([...filtered, agent.value]);
                          }
                        }
                      }}
                      className={cn(
                        'px-3 py-2 text-sm border rounded-md text-left transition-colors',
                        inviteAgents.includes(agent.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent'
                      )}
                    >
                      <div className="font-medium">{agent.label}</div>
                      <div className="text-xs opacity-80">{agent.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </form>
          )}

          {/* Team Members List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Team Members ({members.length})
              </h3>

              {members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role];
                const StatusIcon = STATUS_ICONS[member.status];
                const roleDef = ROLE_DEFINITIONS[member.role];

                return (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    {/* Member Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={cn('flex items-center gap-1', getStatusBadgeColor(member.status))}>
                          <StatusIcon className="h-3 w-3" />
                          {member.status}
                        </Badge>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleUpdateRole(member.id, v as UserRole)}
                        disabled={member.role === 'owner'}
                      >
                        <SelectTrigger className="mt-1">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4" />
                            <span>{roleDef.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ROLE_DEFINITIONS)
                            .filter((r) => r.role !== 'owner')
                            .map((roleDef) => {
                              const Icon = ROLE_ICONS[roleDef.role];
                              return (
                                <SelectItem key={roleDef.role} value={roleDef.role}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{roleDef.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Agent Access */}
                    <div>
                      <Label className="text-xs">Agent Access</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {AGENT_OPTIONS.map((agent) => (
                          <button
                            key={agent.value}
                            type="button"
                            onClick={() => toggleAgentAccess(member.id, agent.value)}
                            disabled={member.role === 'owner' || member.allowedAgents.includes('all')}
                            className={cn(
                              'px-2 py-1.5 text-xs border rounded text-left transition-colors',
                              member.allowedAgents.includes(agent.value) || member.allowedAgents.includes('all')
                                ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                                : 'bg-background hover:bg-accent',
                              (member.role === 'owner' || (member.allowedAgents.includes('all') && agent.value !== 'all')) && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {agent.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
});
