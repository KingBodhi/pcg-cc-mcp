# Task Collaboration Model Design

## Overview
This document defines how humans, AI agents, and MCP servers collaborate on tasks, considering the dynamic evolution of work across multiple interactions and participants.

---

## 1. CORE ENTITIES & RELATIONSHIPS

### Task Hierarchy
```
Project
  └─ Task (user-created goal)
      ├─ Task Attempts (agent execution instances)
      │   ├─ Attempt 1 (Claude Code - failed)
      │   ├─ Attempt 2 (AMP - in progress)
      │   └─ Attempt 3 (Gemini - success)
      │
      ├─ Subtasks (decomposed work)
      │   └─ Subtask Attempts
      │
      ├─ Comments Thread
      │   ├─ Human comments
      │   ├─ Agent status updates
      │   └─ MCP notifications
      │
      ├─ Activity Log
      │   ├─ State changes
      │   ├─ Participant actions
      │   └─ Event timeline
      │
      └─ Assignments
          ├─ Human assignees
          ├─ Agent assignments
          └─ MCP integrations
```

---

## 2. COLLABORATION SCENARIOS

### Scenario 1: Human → Agent → Human Review
**Example**: "Implement authentication system"

1. **Human Creates Task**
   - Priority: High
   - Assignee: @john (responsible human)
   - Agent: Claude Code (executor)
   - Description: "Add JWT-based auth with OAuth2 support"

2. **Agent Executes**
   - Creates attempt
   - Uses MCP servers (GitHub, database, testing tools)
   - Generates code, runs tests
   - Posts status updates to task thread

3. **Human Reviews**
   - Comments on implementation
   - Requests changes
   - Approves or rejects

4. **Follow-up Interaction**
   - Agent creates follow-up attempt with changes
   - Or different agent (Gemini) takes over
   - Human can reassign to another team member

---

### Scenario 2: Human → Multiple Agents → Collaborative Resolution
**Example**: "Debug production issue"

1. **Human Reports Issue**
   - Priority: Critical
   - Assignee: @sarah (on-call engineer)
   - Agent: None yet (triage needed)

2. **Nora AI Coordinates**
   - Analyzes issue complexity
   - Recommends agent: AMP (good at debugging)
   - Suggests MCP tools: logs server, monitoring API

3. **AMP Agent Investigates**
   - Uses MCP to query logs
   - Identifies root cause
   - Posts findings to thread

4. **Human Decision Point**
   - Reviews findings
   - Assigns fix to Claude Code (better at refactoring)
   - Or assigns to another human if needs manual intervention

5. **Claude Code Implements Fix**
   - Creates new attempt
   - References AMP's investigation
   - Submits PR

6. **Team Review**
   - Multiple humans comment
   - QA engineer (@mike) approves
   - DevOps (@lisa) deploys

---

### Scenario 3: Agent → Agent Handoff
**Example**: "Migrate database schema"

1. **Codex** starts migration
   - Creates SQL migration scripts
   - Gets stuck on complex data transformation

2. **Human Intervenes**
   - Sees attempt stalled
   - Comments: "This needs Python script for data migration"
   - Reassigns to AMP (better at scripting)

3. **AMP** takes over
   - Creates new attempt (child of Codex's work)
   - Uses MCP to access database
   - Completes migration

4. **Verification Phase**
   - Human runs tests
   - Gemini creates validation attempt
   - All tests pass → task done

---

### Scenario 4: MCP-Driven Automation
**Example**: "Sync customer data from Salesforce"

1. **Human Creates Task**
   - Assignee: @automation (special user for automated tasks)
   - Agent: Custom MCP agent
   - Schedule: Daily at 2 AM

2. **MCP Server Executes**
   - Salesforce MCP fetches data
   - Database MCP writes records
   - Slack MCP posts summary

3. **Human Monitors**
   - Checks daily summary
   - Comments if anomalies detected
   - Adjusts schedule/config as needed

4. **Error Handling**
   - If MCP fails, creates sub-task
   - Human investigates
   - Agent fixes integration

---

## 3. DATA MODEL REQUIREMENTS

### Task Entity (Enhanced)
```typescript
interface Task {
  // Existing fields
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;

  // NEW: Collaboration fields
  priority: Priority;               // Critical, High, Medium, Low
  assignee_id: string | null;       // Primary human responsible
  assigned_agent: AgentType | null; // Primary AI agent
  assigned_mcp: string[] | null;    // Active MCP integrations

  // NEW: Ownership tracking
  created_by: UserId;                // Who created it
  last_modified_by: ActorId;         // Last human/agent to modify

  // NEW: Workflow state
  requires_human_approval: boolean;  // Needs review before completion
  approval_status: ApprovalStatus | null;
  approved_by: UserId[] | null;

  // NEW: Relationships
  parent_task_id: string | null;     // For subtasks
  blocked_by: string[] | null;       // Dependency IDs
  related_tasks: string[] | null;    // Related work

  // NEW: Metadata
  tags: string[];                    // Categorization
  estimated_duration: number | null; // Hours estimate
  actual_duration: number | null;    // Tracked time
  due_date: string | null;           // Deadline
}

type Priority = 'critical' | 'high' | 'medium' | 'low';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
type ActorId = UserId | AgentId | McpId; // Union type for any actor
```

### Comment/Activity Thread
```typescript
interface TaskComment {
  id: string;
  task_id: string;
  author: Actor;
  content: string;
  comment_type: CommentType;
  created_at: string;

  // Threading
  parent_comment_id: string | null;
  thread_resolved: boolean;

  // Rich content
  mentions: ActorId[];              // @mentions
  attachments: Attachment[];
  code_snippets: CodeSnippet[];

  // Reactions
  reactions: Reaction[];
}

interface Actor {
  type: 'human' | 'agent' | 'mcp' | 'system';
  id: string;
  name: string;
  avatar_url?: string;
}

type CommentType =
  | 'comment'           // General discussion
  | 'status_update'     // Agent progress update
  | 'review'            // Code review
  | 'approval'          // Approval decision
  | 'system'            // Automated notification
  | 'handoff'           // Agent/human handoff
  | 'mcp_notification'; // MCP event
```

### Activity Log Entry
```typescript
interface ActivityLogEntry {
  id: string;
  task_id: string;
  actor: Actor;
  action: ActivityAction;
  timestamp: string;

  // Context
  previous_state: any | null;
  new_state: any | null;
  metadata: Record<string, any>;
}

type ActivityAction =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'reassigned'
  | 'status_changed'
  | 'priority_changed'
  | 'commented'
  | 'approved'
  | 'rejected'
  | 'attempt_started'
  | 'attempt_completed'
  | 'attempt_failed'
  | 'mcp_invoked'
  | 'blocked'
  | 'unblocked';
```

### Assignment System
```typescript
interface TaskAssignment {
  task_id: string;

  // Human assignments
  primary_assignee: UserId | null;     // Main responsible person
  secondary_assignees: UserId[];       // Collaborators
  reviewers: UserId[];                 // Required approvers
  watchers: UserId[];                  // Notified of updates

  // Agent assignments
  primary_agent: AgentType | null;     // Main executor
  fallback_agents: AgentType[];        // Backup if primary fails
  agent_config: AgentConfig | null;    // Custom agent settings

  // MCP assignments
  active_mcps: McpAssignment[];        // Connected MCP servers

  // Team context
  team_id: string | null;              // Which team owns this
  role_requirements: Role[];           // Required roles
}

interface McpAssignment {
  mcp_id: string;
  mcp_name: string;
  purpose: string;                     // Why this MCP is used
  auto_invoke: boolean;                // Auto-run or manual
  config: Record<string, any>;         // MCP-specific config
}
```

---

## 4. INTERACTION PATTERNS

### Pattern 1: Sequential Handoff
```
Human creates task
  → Agent attempts
    → Human reviews
      → Agent revises
        → Human approves
          → Task complete
```

**Use Case**: Standard development task

**Key Features**:
- Clear ownership at each step
- Human checkpoints for quality
- Agent learns from feedback

---

### Pattern 2: Parallel Collaboration
```
                    ┌─ Agent 1 (backend)
Human creates task ─┼─ Agent 2 (frontend)
                    └─ Agent 3 (tests)
                         ↓
                    Human reviews all
                         ↓
                    Merge & deploy
```

**Use Case**: Full-stack feature development

**Key Features**:
- Multiple agents work simultaneously
- Each agent has clear scope
- Human coordinates integration

---

### Pattern 3: Escalation Chain
```
Agent attempts
  ↓
Fails/stuck
  ↓
Nora AI analyzes
  ↓
Recommends: Try different agent OR escalate to human
  ↓
Human decides next action
```

**Use Case**: Complex problem-solving

**Key Features**:
- Automatic failure detection
- AI coordination layer
- Human as decision maker

---

### Pattern 4: MCP-Augmented Workflow
```
Human assigns task
  ↓
Agent starts attempt
  ↓
Agent invokes MCP servers:
  ├─ GitHub MCP (code access)
  ├─ Jira MCP (ticket updates)
  ├─ Slack MCP (notifications)
  └─ Testing MCP (run tests)
  ↓
Agent completes with MCP data
  ↓
Human reviews aggregated results
```

**Use Case**: Enterprise integration tasks

**Key Features**:
- MCP servers extend agent capabilities
- Unified task thread shows all MCP interactions
- Audit trail of external tool usage

---

## 5. UI/UX REQUIREMENTS

### Task Detail View Enhancement
```
┌─────────────────────────────────────────────┐
│ Task: Implement Authentication              │
│ #PROJ-123 │ High Priority │ In Progress     │
├─────────────────────────────────────────────┤
│                                             │
│ Assigned To:  [@john]  👤 Human             │
│ Agent:        [Claude Code]  🤖 Active      │
│ MCPs:         [GitHub] [PostgreSQL] [Slack] │
│                                             │
│ Status:       🟡 Attempt in progress        │
│ Progress:     ████████░░ 75%                │
│ Time:         2.5h / 4h estimated           │
│                                             │
├─────────────────────────────────────────────┤
│ 📊 Attempts (3)                             │
│  ✅ #1 - Claude Code - Success (merged)     │
│  ❌ #2 - AMP - Failed (tests failed)        │
│  🔄 #3 - Claude Code - In Progress          │
│                                             │
├─────────────────────────────────────────────┤
│ 💬 Activity & Comments                      │
│                                             │
│ [2h ago] 🤖 Claude Code                     │
│ Started attempt #3. Using JWT library.      │
│                                             │
│ [1h ago] 👤 @john                           │
│ Looks good! Make sure to add refresh tokens │
│                                             │
│ [30m ago] 🔌 PostgreSQL MCP                 │
│ Created auth_tokens table successfully      │
│                                             │
│ [10m ago] 🤖 Claude Code                    │
│ Added refresh token logic. Ready for review?│
│                                             │
│ [now] 👤 @sarah (reviewer)                  │
│ LGTM! Approved ✓                            │
│                                             │
└─────────────────────────────────────────────┘
```

### Assignment Panel
```
┌─────────────────────────────────────┐
│ 👥 Assignments                      │
├─────────────────────────────────────┤
│ Primary:     [@john] ━━━━━━ Owner   │
│ Reviewers:   [@sarah] [@mike]       │
│ Watchers:    [@lisa] [@team-backend]│
│                                     │
│ 🤖 Agent:    [Claude Code ▼]        │
│   Fallback: [AMP] [Gemini]          │
│                                     │
│ 🔌 MCPs:     [+ Add MCP]            │
│   • GitHub   [⚙️] [🗑️]             │
│   • Slack    [⚙️] [🗑️]             │
│                                     │
│ [Save Changes]                      │
└─────────────────────────────────────┘
```

### Activity Timeline
```
┌─────────────────────────────────────────────┐
│ 📅 Timeline                                 │
├─────────────────────────────────────────────┤
│                                             │
│ Today, 2:30 PM                              │
│ 👤 @sarah approved the task                 │
│                                             │
│ Today, 2:15 PM                              │
│ 🤖 Claude Code completed attempt #3         │
│ └─ Created PR #456                          │
│                                             │
│ Today, 1:00 PM                              │
│ 🔌 PostgreSQL MCP executed migration        │
│ └─ Added 3 tables, 7 indexes                │
│                                             │
│ Today, 12:30 PM                             │
│ 👤 @john commented: "Add refresh tokens"    │
│                                             │
│ Today, 11:00 AM                             │
│ 🤖 Claude Code started attempt #3           │
│ └─ Previous attempt failed tests            │
│                                             │
│ Yesterday, 5:00 PM                          │
│ 👤 @john created task                       │
│ └─ Assigned to: @john, Agent: Claude Code   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 6. PERMISSION & SECURITY MODEL

### Role-Based Access Control
```typescript
interface UserRole {
  role: 'owner' | 'admin' | 'developer' | 'viewer' | 'agent';

  permissions: {
    // Task management
    can_create_tasks: boolean;
    can_edit_all_tasks: boolean;
    can_edit_own_tasks: boolean;
    can_delete_tasks: boolean;
    can_assign_tasks: boolean;

    // Agent management
    can_assign_agents: boolean;
    can_configure_agents: boolean;
    can_stop_agents: boolean;

    // MCP management
    can_add_mcps: boolean;
    can_configure_mcps: boolean;
    can_invoke_mcps: boolean;

    // Approval workflow
    can_approve_tasks: boolean;
    can_request_changes: boolean;
    can_bypass_approval: boolean;

    // Team management
    can_invite_members: boolean;
    can_manage_permissions: boolean;
  };
}
```

### Agent Permissions
```typescript
interface AgentPermissions {
  agent_type: AgentType;

  can_access: {
    read_code: boolean;
    write_code: boolean;
    execute_commands: boolean;
    access_secrets: boolean;
    make_commits: boolean;
    create_prs: boolean;
    merge_prs: boolean;
    deploy: boolean;
  };

  mcp_access: string[];  // Which MCPs this agent can use

  requires_approval_for: string[];  // Actions needing human approval
}
```

---

## 7. NOTIFICATION & ESCALATION

### Notification Rules
```typescript
interface NotificationRule {
  trigger: NotificationTrigger;
  notify: ActorId[];
  channel: NotificationChannel[];
  priority: Priority;
  throttle: Duration;  // Prevent spam
}

type NotificationTrigger =
  | 'task_assigned_to_me'
  | 'task_status_changed'
  | 'agent_completed'
  | 'agent_failed'
  | 'approval_requested'
  | 'mentioned_in_comment'
  | 'task_blocked'
  | 'deadline_approaching'
  | 'mcp_error';

type NotificationChannel = 'in_app' | 'email' | 'slack' | 'desktop' | 'mobile';
```

### Escalation Policies
```typescript
interface EscalationPolicy {
  task_priority: Priority;

  escalation_chain: EscalationStep[];
}

interface EscalationStep {
  condition: EscalationCondition;
  delay: Duration;
  action: EscalationAction;
}

type EscalationCondition =
  | 'agent_stuck'           // No progress for X time
  | 'multiple_failures'     // N attempts failed
  | 'approaching_deadline'  // Due in < X time
  | 'blocked_too_long'      // Dependencies unresolved
  | 'approval_pending'      // Waiting for review > X time
  | 'critical_error';       // System/MCP error

type EscalationAction =
  | { type: 'notify_team_lead' }
  | { type: 'reassign_to_human' }
  | { type: 'try_different_agent' }
  | { type: 'pause_and_review' }
  | { type: 'invoke_nora_coordinator' };
```

---

## 8. IMPLEMENTATION PHASES

### Phase A: Core Collaboration (Week 1-2)
✅ **Priority 1**: Add assignment fields
- [x] `priority` field to Task
- [x] `assignee_id` field (human)
- [x] `assigned_agent` field
- [x] `assigned_mcp` array
- [x] Database migrations
- [x] Update existing UI components

### Phase B: Activity Thread (Week 2-3)
✅ **Priority 2**: Comment system
- [ ] TaskComment table
- [ ] Activity log table
- [ ] WebSocket updates for real-time comments
- [ ] UI: Comment thread component
- [ ] UI: Activity timeline view
- [ ] Mention system (@user, @agent)

### Phase C: Approval Workflow (Week 3-4)
✅ **Priority 3**: Review process
- [ ] Approval status tracking
- [ ] Reviewer assignments
- [ ] Approval/rejection actions
- [ ] Change request workflow
- [ ] UI: Approval panel

### Phase D: Advanced Collaboration (Week 4-6)
✅ **Priority 4**: Enhanced features
- [ ] Task dependencies (blocked_by)
- [ ] Related tasks linking
- [ ] Time tracking
- [ ] Due dates & deadlines
- [ ] Tag system
- [ ] Agent fallback logic
- [ ] MCP configuration per task

### Phase E: Intelligence Layer (Week 6-8)
✅ **Priority 5**: Nora coordination
- [ ] Failure pattern detection
- [ ] Agent recommendation engine
- [ ] Automatic escalation
- [ ] Workload balancing
- [ ] Smart notifications
- [ ] Predictive analytics

---

## 9. OPEN QUESTIONS FOR DISCUSSION

1. **Assignment Logic**
   - Can a task have multiple primary assignees?
   - How do we handle "team assignments" vs individual?
   - Should agents auto-assign themselves or wait for human assignment?

2. **Approval Requirements**
   - Which task types require approval? (e.g., deployments, data changes)
   - Can agents approve each other's work?
   - What's the minimum number of approvals needed?

3. **MCP Integration Depth**
   - Should MCPs be able to create subtasks?
   - Can MCPs trigger agent assignments?
   - How do we handle MCP failures gracefully?

4. **Agent Coordination**
   - Should Nora actively coordinate all agent work?
   - Or only intervene when problems arise?
   - How much autonomy should agents have?

5. **Conflict Resolution**
   - What happens if multiple agents try to work on same task?
   - How do we handle contradictory human feedback from different reviewers?
   - Who has final say: primary assignee, team lead, or system owner?

6. **Scalability**
   - How many active MCPs per task is reasonable?
   - Should we limit concurrent agent attempts?
   - How do we archive/clean up old activity logs?

---

## 10. RECOMMENDED NEXT STEPS

1. **👥 Discuss with team**: Review collaboration scenarios - do they match your workflows?

2. **🎯 Prioritize features**: Which Phase (A-E) delivers most value first?

3. **🗺️ Map existing flows**: Document current human→agent interactions for comparison

4. **🔧 Prototype**: Build Phase A (Core Collaboration) to validate design

5. **📊 Metrics**: Define success metrics for collaboration efficiency

6. **🔄 Iterate**: Gather feedback and refine model

---

## CONCLUSION

This collaboration model treats **humans, agents, and MCPs as first-class participants** in the task lifecycle. By tracking assignments, approvals, and interactions explicitly, we create:

✅ **Transparency**: Full visibility into who did what and when
✅ **Accountability**: Clear ownership and responsibility
✅ **Flexibility**: Easy handoffs between humans/agents/MCPs
✅ **Intelligence**: Data for Nora to optimize workflows
✅ **Audit Trail**: Complete history for compliance and debugging

**The model supports both simple workflows (human→agent→done) and complex scenarios (multi-agent, multi-MCP, multi-human collaborative problem-solving).**

Ready to implement Phase A?
