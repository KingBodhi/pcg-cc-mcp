//! Core Nora agent implementation

use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use ts_rs::TS;
use uuid::Uuid;

use crate::{
    brain::LLMClient,
    coordination::CoordinationManager,
    memory::{
        BudgetStatus, ConversationMemory, ExecutiveContext, ExecutivePriority, Milestone,
        MilestoneStatus, PriorityImpact, PriorityStatus, PriorityUrgency, ProjectContext,
        ProjectStatus,
    },
    personality::BritishPersonality,
    tools::ExecutiveTools,
    voice::VoiceEngine,
    NoraConfig, NoraError, Result,
};

/// Main Nora agent structure
pub struct NoraAgent {
    pub id: Uuid,
    pub config: NoraConfig,
    pub voice_engine: Arc<VoiceEngine>,
    pub coordination_manager: Arc<CoordinationManager>,
    pub memory: Arc<RwLock<ConversationMemory>>,
    pub personality: BritishPersonality,
    pub executive_tools: ExecutiveTools,
    pub context: Arc<RwLock<ExecutiveContext>>,
    pub llm: Option<Arc<LLMClient>>,
    pub is_active: Arc<RwLock<bool>>,
}

/// Request to Nora for processing
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct NoraRequest {
    pub request_id: String,
    pub session_id: String,
    pub request_type: NoraRequestType,
    pub content: String,
    pub context: Option<serde_json::Value>,
    pub voice_enabled: bool,
    pub priority: RequestPriority,
    pub timestamp: DateTime<Utc>,
}

/// Types of requests Nora can handle
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum NoraRequestType {
    /// Voice interaction (speech-to-text processed)
    VoiceInteraction,
    /// Text-based interaction
    TextInteraction,
    /// Executive task coordination
    TaskCoordination,
    /// Strategic planning request
    StrategyPlanning,
    /// Performance analysis
    PerformanceAnalysis,
    /// Communication management
    CommunicationManagement,
    /// Decision support
    DecisionSupport,
    /// Proactive notification/alert
    ProactiveNotification,
}

/// Request priority levels
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum RequestPriority {
    Low,
    Normal,
    High,
    Urgent,
    Executive,
}

/// Nora's response structure
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct NoraResponse {
    pub response_id: String,
    pub request_id: String,
    pub session_id: String,
    pub response_type: NoraResponseType,
    pub content: String,
    pub actions: Vec<ExecutiveAction>,
    pub voice_response: Option<String>, // Base64 encoded audio
    pub follow_up_suggestions: Vec<String>,
    pub context_updates: Vec<ContextUpdate>,
    pub timestamp: DateTime<Utc>,
    pub processing_time_ms: u64,
}

/// Types of responses from Nora
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum NoraResponseType {
    DirectResponse,
    TaskDelegation,
    StrategyRecommendation,
    PerformanceInsight,
    DecisionSupport,
    CoordinationAction,
    ProactiveAlert,
}

/// Executive actions Nora can perform
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveAction {
    pub action_id: String,
    pub action_type: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub requires_approval: bool,
    pub estimated_duration: Option<String>,
    pub assigned_to: Option<String>,
}

/// Context updates from Nora's analysis
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ContextUpdate {
    pub update_type: String,
    pub key: String,
    pub value: serde_json::Value,
    pub confidence: f32,
    pub source: String,
}

impl NoraAgent {
    /// Create a new Nora agent instance
    pub async fn new(config: NoraConfig) -> Result<Self> {
        let id = Uuid::new_v4();

        tracing::info!("Initializing Nora agent with ID: {}", id);

        // Initialize voice engine
        let voice_engine = Arc::new(VoiceEngine::new(config.voice.clone()).await?);

        // Initialize coordination manager
        let coordination_manager = Arc::new(CoordinationManager::new().await?);

        // Initialize memory
        let memory = Arc::new(RwLock::new(ConversationMemory::new()));

        // Initialize personality
        let personality = BritishPersonality::new(config.personality.clone());

        // Initialize executive tools
        let executive_tools = ExecutiveTools::new();

        // Initialize executive context
        let context = Arc::new(RwLock::new(ExecutiveContext::new()));
        {
            let mut ctx = context.write().await;
            if ctx.active_projects.is_empty() {
                ctx.active_projects = Self::default_projects();
            }
            if ctx.current_priorities.is_empty() {
                ctx.current_priorities = Self::default_priorities();
            }
        }

        let llm = config
            .llm
            .clone()
            .map(LLMClient::new)
            .and_then(|client| {
                if client.is_ready() {
                    Some(Arc::new(client))
                } else {
                    tracing::warn!("LLM configuration detected but OPENAI_API_KEY is missing; falling back to deterministic responses");
                    None
                }
            });

        // Start as active
        let is_active = Arc::new(RwLock::new(true));

        Ok(Self {
            id,
            config,
            voice_engine,
            coordination_manager,
            memory,
            personality,
            executive_tools,
            context,
            is_active,
            llm,
        })
    }

    /// Process a request from user or system
    pub async fn process_request(&self, request: NoraRequest) -> Result<NoraResponse> {
        let start_time = std::time::Instant::now();

        tracing::info!(
            "Processing request {} of type {:?}",
            request.request_id,
            request.request_type
        );

        // Update executive context
        self.update_context_from_request(&request).await?;

        // Process based on request type
        let mut response_content = String::new();
        let mut actions = Vec::new();
        let mut response_type = NoraResponseType::DirectResponse;

        match request.request_type {
            NoraRequestType::VoiceInteraction => {
                response_content = self.process_voice_interaction(&request).await?;
            }
            NoraRequestType::TextInteraction => {
                response_content = self.process_text_interaction(&request).await?;
            }
            NoraRequestType::TaskCoordination => {
                (response_content, actions) = self.process_task_coordination(&request).await?;
                response_type = NoraResponseType::CoordinationAction;
            }
            NoraRequestType::StrategyPlanning => {
                (response_content, actions) = self.process_strategy_planning(&request).await?;
                response_type = NoraResponseType::StrategyRecommendation;
            }
            NoraRequestType::PerformanceAnalysis => {
                response_content = self.process_performance_analysis(&request).await?;
                response_type = NoraResponseType::PerformanceInsight;
            }
            NoraRequestType::CommunicationManagement => {
                (response_content, actions) =
                    self.process_communication_management(&request).await?;
            }
            NoraRequestType::DecisionSupport => {
                response_content = self.process_decision_support(&request).await?;
                response_type = NoraResponseType::DecisionSupport;
            }
            NoraRequestType::ProactiveNotification => {
                response_content = self.process_proactive_notification(&request).await?;
                response_type = NoraResponseType::ProactiveAlert;
            }
        }

        // Personality layer disabled - causes repetitive broken phrases
        // response_content = self.personality.apply_personality_to_response(&response_content, &request);

        // Generate voice response if enabled
        let voice_response = if request.voice_enabled {
            Some(self.generate_voice_response(&response_content).await?)
        } else {
            None
        };

        // Generate follow-up suggestions
        let follow_up_suggestions = self
            .generate_follow_up_suggestions(&request, &response_content)
            .await?;

        // Update conversation memory
        self.update_conversation_memory(&request, &response_content)
            .await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        // Extract context updates before consuming response_content
        let context_updates = self.extract_context_updates(&request, &response_content).await;

        Ok(NoraResponse {
            response_id: Uuid::new_v4().to_string(),
            request_id: request.request_id.clone(),
            session_id: request.session_id.clone(),
            response_type,
            content: response_content,
            actions,
            voice_response,
            follow_up_suggestions,
            context_updates,
            timestamp: Utc::now(),
            processing_time_ms: processing_time,
        })
    }

    /// Check if Nora is currently active
    pub async fn is_active(&self) -> bool {
        *self.is_active.read().await
    }

    /// Activate or deactivate Nora
    pub async fn set_active(&self, active: bool) -> Result<()> {
        *self.is_active.write().await = active;

        if active {
            tracing::info!("Nora activated");
        } else {
            tracing::info!("Nora deactivated");
        }

        Ok(())
    }

    // Private helper methods

    async fn update_context_from_request(&self, request: &NoraRequest) -> Result<()> {
        let mut context = self.context.write().await;
        context.update_from_request(request).await?;
        Ok(())
    }

    async fn process_voice_interaction(&self, request: &NoraRequest) -> Result<String> {
        let original = request.content.trim();
        let lowered = original.to_lowercase();

        let response = if lowered.contains("hello") || lowered.contains("hi") {
            "Hello! Lovely to hear your voice. How can I help you today?".to_string()
        } else if lowered.contains("project") || lowered.contains("roadmap") {
            self.describe_roadmap().await
        } else if lowered.contains("capabilities") {
            "Great question! I'm your executive assistant - I handle strategic planning, team coordination, and performance analysis. I'm brilliant at multi-agent coordination and decision support. What would you like to know more about?".to_string()
        } else {
            self.generate_llm_response(request, original).await
        };

        Ok(response)
    }

    async fn process_text_interaction(&self, request: &NoraRequest) -> Result<String> {
        let original = request.content.trim();
        let lowered = original.to_lowercase();

        let response = if lowered.contains("hello")
            || lowered.contains("hi")
            || lowered.contains("good")
        {
            "Hello there! Lovely to meet you. How can I help today?".to_string()
        } else if lowered.contains("project")
            || lowered.contains("roadmap")
            || lowered.contains("pipeline")
        {
            self.describe_roadmap().await
        } else if lowered.contains("capabilities") || lowered.contains("what can you do") {
            "Great question! I'm your executive assistant - I handle strategic planning, coordinate teams, analyse performance, and manage communications. I'm particularly good at multi-agent coordination and decision support. What would you like to tackle first?".to_string()
        } else if lowered.contains("help") {
            "Absolutely! I can help with planning, team coordination, performance analysis, communications management, and executive decisions. What's on your mind?".to_string()
        } else if lowered.contains("thank") {
            "You're very welcome! Always happy to help. Just give me a shout when you need anything.".to_string()
        } else {
            // Default conversational response with British professional tone
            self.generate_llm_response(request, original).await
        };

        Ok(response)
    }

    async fn process_task_coordination(
        &self,
        _request: &NoraRequest,
    ) -> Result<(String, Vec<ExecutiveAction>)> {
        let ctx = self.context.read().await;

        let mut response_parts = vec![
            "I've reviewed our current task landscape and project portfolio.".to_string()
        ];

        // Analyze active projects
        let active_count = ctx.active_projects.iter()
            .filter(|p| matches!(p.status, ProjectStatus::InProgress))
            .count();

        if active_count > 0 {
            response_parts.push(format!(
                "We have {} active projects requiring coordination.",
                active_count
            ));
        }

        // Check priorities
        let high_priority_count = ctx.current_priorities.iter()
            .filter(|p| matches!(p.urgency, PriorityUrgency::High | PriorityUrgency::Critical))
            .count();

        if high_priority_count > 0 {
            response_parts.push(format!(
                "{} high-priority items need immediate attention.",
                high_priority_count
            ));
        }

        response_parts.push("Would you like me to deep-dive into any specific initiative?".to_string());

        let response = response_parts.join(" ");
        let actions = vec![];

        Ok((response, actions))
    }

    async fn process_strategy_planning(
        &self,
        request: &NoraRequest,
    ) -> Result<(String, Vec<ExecutiveAction>)> {
        // Use LLM for strategic planning if available
        if self.llm.is_some() {
            let strategic_prompt = format!(
                "Provide strategic planning analysis and recommendations for: {}",
                request.content
            );

            let response = self.generate_llm_response(request, &strategic_prompt).await;

            // Generate strategic actions
            let actions = vec![
                ExecutiveAction {
                    action_id: Uuid::new_v4().to_string(),
                    action_type: "StrategicReview".to_string(),
                    description: "Schedule strategic review session with key stakeholders".to_string(),
                    parameters: serde_json::json!({
                        "duration": "2 hours",
                        "participants": ["Executive Team", "Project Leads"]
                    }),
                    requires_approval: true,
                    estimated_duration: Some("2 hours".to_string()),
                    assigned_to: Some("Strategy Team".to_string()),
                },
            ];

            Ok((response, actions))
        } else {
            let response = "Strategic analysis in progress. I recommend scheduling a comprehensive review session to align on priorities and resource allocation.".to_string();
            Ok((response, vec![]))
        }
    }

    async fn process_performance_analysis(&self, request: &NoraRequest) -> Result<String> {
        let ctx = self.context.read().await;

        let mut insights = vec!["**Performance Analysis Summary**".to_string()];

        // Analyze project progress
        let total_projects = ctx.active_projects.len();
        if total_projects > 0 {
            let avg_progress: f64 = ctx.active_projects.iter()
                .map(|p| p.progress_percentage as f64)
                .sum::<f64>() / total_projects as f64;

            insights.push(format!("Portfolio Progress: {:.1}% average across {} projects", avg_progress, total_projects));

            // Identify at-risk projects
            let at_risk: Vec<_> = ctx.active_projects.iter()
                .filter(|p| matches!(p.status, ProjectStatus::AtRisk))
                .collect();

            if !at_risk.is_empty() {
                insights.push(format!("⚠️  {} projects flagged as at-risk requiring intervention", at_risk.len()));
            }

            // Budget analysis
            let total_allocated: f64 = ctx.active_projects.iter().map(|p| p.budget_status.allocated).sum();
            let total_spent: f64 = ctx.active_projects.iter().map(|p| p.budget_status.spent).sum();
            let utilization = if total_allocated > 0.0 { (total_spent / total_allocated) * 100.0 } else { 0.0 };

            insights.push(format!("Budget Utilization: {:.1}% (£{:.0}K spent of £{:.0}K allocated)",
                utilization, total_spent / 1000.0, total_allocated / 1000.0));
        }

        // Use LLM for deeper analysis if available
        if let Some(llm) = &self.llm {
            let context_snapshot = self.build_context_snapshot(request).await;
            if let Ok(llm_insights) = llm.generate(
                "Provide executive-level performance insights and recommendations based on the portfolio data.",
                &request.content,
                &context_snapshot
            ).await {
                insights.push(String::new()); // blank line
                insights.push(llm_insights);
            }
        }

        Ok(insights.join("\n"))
    }

    async fn process_communication_management(
        &self,
        _request: &NoraRequest,
    ) -> Result<(String, Vec<ExecutiveAction>)> {
        // Process communication management
        let response = "Communication management processed.".to_string();
        let actions = vec![];
        Ok((response, actions))
    }

    async fn process_decision_support(&self, _request: &NoraRequest) -> Result<String> {
        // Process decision support requests
        Ok("Decision support analysis completed.".to_string())
    }

    async fn process_proactive_notification(&self, _request: &NoraRequest) -> Result<String> {
        // Process proactive notifications
        Ok("Proactive notification processed.".to_string())
    }

    async fn generate_voice_response(&self, content: &str) -> Result<String> {
        self.voice_engine
            .synthesize_speech(content)
            .await
            .map_err(NoraError::VoiceEngineError)
    }

    async fn generate_follow_up_suggestions(
        &self,
        _request: &NoraRequest,
        _response: &str,
    ) -> Result<Vec<String>> {
        Ok(vec![
            "Would you like me to elaborate on any specific point?".to_string(),
            "Shall I prepare a detailed report on this topic?".to_string(),
            "Would you like me to schedule follow-up actions?".to_string(),
        ])
    }

    async fn update_conversation_memory(
        &self,
        request: &NoraRequest,
        response: &str,
    ) -> Result<()> {
        let mut memory = self.memory.write().await;
        memory.add_interaction(request, response).await?;
        Ok(())
    }

    pub async fn seed_projects(&self, projects: Vec<ProjectContext>) -> Result<()> {
        let mut context = self.context.write().await;
        context.active_projects = projects;
        context.last_updated = Utc::now();
        Ok(())
    }

    async fn describe_roadmap(&self) -> String {
        let ctx = self.context.read().await;
        if ctx.active_projects.is_empty() {
            return "I don’t have any projects recorded on the roadmap yet. Would you like me to register them?".to_string();
        }

        let mut lines = Vec::new();
        lines.push("Here's the current roadmap:".to_string());
        for project in &ctx.active_projects {
            lines.push(format!(
                "• {} – {} ({}% complete)",
                project.name,
                Self::humanise_status(&project.status),
                project.progress_percentage.round()
            ));
        }
        lines.push("Would you like a deeper dive into any particular initiative?".to_string());
        lines.join("\n")
    }

    async fn build_context_snapshot(&self, request: &NoraRequest) -> String {
        let mut sections = Vec::new();
        let ctx = self.context.read().await;

        if !ctx.active_projects.is_empty() {
            sections.push("Active projects:".to_string());
            for project in &ctx.active_projects {
                sections.push(format!(
                    "- {} (status: {}, progress: {}%)",
                    project.name,
                    Self::humanise_status(&project.status),
                    project.progress_percentage.round()
                ));
            }
        }

        if !ctx.current_priorities.is_empty() {
            sections.push("Priority focus areas:".to_string());
            for priority in &ctx.current_priorities {
                sections.push(format!(
                    "- {} ({} / status: {})",
                    priority.title,
                    match priority.urgency {
                        PriorityUrgency::Low => "low urgency",
                        PriorityUrgency::Medium => "medium urgency",
                        PriorityUrgency::High => "high urgency",
                        PriorityUrgency::Critical => "critical",
                    },
                    Self::humanise_priority_status(&priority.status)
                ));
            }
        }

        drop(ctx);

        let memory = self.memory.read().await;
        let recent = memory.recent_interactions(3);
        if !recent.is_empty() {
            sections.push("Recent dialogue snippets:".to_string());
            for interaction in recent {
                sections.push(format!(
                    "- User: {} | Nora: {}",
                    interaction.user_input, interaction.nora_response
                ));
            }
        }

        sections.push(format!(
            "Request type: {:?}, priority: {:?}",
            request.request_type, request.priority
        ));
        sections.push(format!("Timestamp: {}", Utc::now().to_rfc3339()));

        sections.join("\n")
    }

    async fn generate_llm_response(&self, request: &NoraRequest, user_text: &str) -> String {
        if let Some(llm) = &self.llm {
            let context_snapshot = self.build_context_snapshot(request).await;
            let system_prompt = self.system_prompt();
            match llm
                .generate(&system_prompt, user_text, &context_snapshot)
                .await
            {
                Ok(answer) if !answer.trim().is_empty() => answer.trim().to_string(),
                Ok(_) => Self::default_follow_up(),
                Err(err) => {
                    tracing::warn!("LLM generation failed: {}", err);
                    Self::default_follow_up()
                }
            }
        } else {
            Self::default_follow_up()
        }
    }

    fn system_prompt(&self) -> String {
        self.config
            .llm
            .as_ref()
            .map(|cfg| cfg.system_prompt.clone())
            .unwrap_or_else(|| {
                "You are Nora, a composed British executive assistant for PowerClub Global. Provide concise, insight-driven answers grounded in the supplied context and surface clear next actions.".to_string()
            })
    }

    fn default_follow_up() -> String {
        "Right, I understand what you're getting at. Let me analyse this properly and get you some actionable recommendations. Would you like me to dig deeper into this for you?".to_string()
    }

    fn default_projects() -> Vec<ProjectContext> {
        let now = Utc::now();
        vec![
            ProjectContext {
                project_id: "pcg-dashboard-mcp".to_string(),
                name: "PCG Dashboard MCP".to_string(),
                description: "Executive control centre combining multi-agent orchestration and performance telemetry.".to_string(),
                status: ProjectStatus::InProgress,
                progress_percentage: 72.0,
                team_members: vec!["Platform".to_string(), "Data Ops".to_string()],
                budget_status: BudgetStatus {
                    allocated: 1_000_000.0,
                    spent: 620_000.0,
                    remaining: 380_000.0,
                    burn_rate: 1.12,
                    forecast_completion: 0.9,
                },
                key_milestones: vec![Milestone {
                    id: "mcp-milestone-1".to_string(),
                    name: "Voice + Orchestration GA".to_string(),
                    due_date: now + Duration::weeks(4),
                    status: MilestoneStatus::InProgress,
                    completion_percentage: 65.0,
                }],
                risks: vec![],
            },
            ProjectContext {
                project_id: "powerclub-global".to_string(),
                name: "PowerClub Global Coordination".to_string(),
                description: "Enterprise operations programme covering global club launches.".to_string(),
                status: ProjectStatus::OnHold,
                progress_percentage: 48.0,
                team_members: vec!["Operations".to_string(), "Finance".to_string()],
                budget_status: BudgetStatus {
                    allocated: 2_500_000.0,
                    spent: 1_150_000.0,
                    remaining: 1_350_000.0,
                    burn_rate: 0.95,
                    forecast_completion: 0.8,
                },
                key_milestones: vec![Milestone {
                    id: "powerclub-q4".to_string(),
                    name: "Q4 Expansion Blueprint".to_string(),
                    due_date: now + Duration::weeks(8),
                    status: MilestoneStatus::NotStarted,
                    completion_percentage: 0.0,
                }],
                risks: vec![],
            },
            ProjectContext {
                project_id: "experience-the-game".to_string(),
                name: "Experience the Game".to_string(),
                description: "Immersive fan engagement platform spanning live events and digital twins.".to_string(),
                status: ProjectStatus::InProgress,
                progress_percentage: 61.0,
                team_members: vec!["Product".to_string(), "Marketing".to_string()],
                budget_status: BudgetStatus {
                    allocated: 1_800_000.0,
                    spent: 1_020_000.0,
                    remaining: 780_000.0,
                    burn_rate: 1.08,
                    forecast_completion: 0.88,
                },
                key_milestones: vec![Milestone {
                    id: "etg-beta".to_string(),
                    name: "Beta cohort launch".to_string(),
                    due_date: now + Duration::weeks(6),
                    status: MilestoneStatus::InProgress,
                    completion_percentage: 55.0,
                }],
                risks: vec![],
            },
            ProjectContext {
                project_id: "chimia-dao".to_string(),
                name: "Chimia DAO".to_string(),
                description: "Decentralised governance framework for sustainability investments.".to_string(),
                status: ProjectStatus::Planning,
                progress_percentage: 32.0,
                team_members: vec!["Research".to_string(), "Legal".to_string()],
                budget_status: BudgetStatus {
                    allocated: 950_000.0,
                    spent: 220_000.0,
                    remaining: 730_000.0,
                    burn_rate: 0.65,
                    forecast_completion: 0.75,
                },
                key_milestones: vec![Milestone {
                    id: "dao-charter".to_string(),
                    name: "Charter ratification".to_string(),
                    due_date: now + Duration::weeks(10),
                    status: MilestoneStatus::NotStarted,
                    completion_percentage: 0.0,
                }],
                risks: vec![],
            },
        ]
    }

    fn default_priorities() -> Vec<ExecutivePriority> {
        vec![
            ExecutivePriority {
                id: "priority-voice".to_string(),
                title: "Voice concierge launch".to_string(),
                description: "Stabilise Nora's voice concierge and integrate orchestration hooks."
                    .to_string(),
                urgency: PriorityUrgency::High,
                impact: PriorityImpact::Strategic,
                owner: "Innovation Office".to_string(),
                target_date: Some(Utc::now() + Duration::weeks(4)),
                status: PriorityStatus::InProgress,
            },
            ExecutivePriority {
                id: "priority-roadmap".to_string(),
                title: "Roadmap transparency".to_string(),
                description: "Publish near-real time roadmap summaries for stakeholders."
                    .to_string(),
                urgency: PriorityUrgency::Medium,
                impact: PriorityImpact::High,
                owner: "Strategy Team".to_string(),
                target_date: Some(Utc::now() + Duration::weeks(6)),
                status: PriorityStatus::Planned,
            },
        ]
    }

    fn humanise_status(status: &ProjectStatus) -> String {
        match status {
            ProjectStatus::Planning => "planning",
            ProjectStatus::InProgress => "in progress",
            ProjectStatus::OnHold => "on hold",
            ProjectStatus::AtRisk => "at risk",
            ProjectStatus::Completed => "completed",
            ProjectStatus::Cancelled => "cancelled",
        }
        .to_string()
    }

    fn humanise_priority_status(status: &PriorityStatus) -> String {
        match status {
            PriorityStatus::Planned => "planned",
            PriorityStatus::InProgress => "in progress",
            PriorityStatus::OnTrack => "on track",
            PriorityStatus::AtRisk => "at risk",
            PriorityStatus::Delayed => "delayed",
            PriorityStatus::Completed => "completed",
        }
        .to_string()
    }

    async fn extract_context_updates(
        &self,
        request: &NoraRequest,
        response: &str,
    ) -> Vec<ContextUpdate> {
        let mut updates = Vec::new();

        // Extract insights from response
        if response.contains("project") || response.contains("initiative") {
            updates.push(ContextUpdate {
                update_type: "ProjectMention".to_string(),
                key: "recent_project_discussion".to_string(),
                value: serde_json::json!({
                    "request_type": format!("{:?}", request.request_type),
                    "timestamp": Utc::now().to_rfc3339()
                }),
                confidence: 0.8,
                source: "response_analysis".to_string(),
            });
        }

        if response.contains("priority") || response.contains("urgent") {
            updates.push(ContextUpdate {
                update_type: "PriorityShift".to_string(),
                key: "priority_discussion".to_string(),
                value: serde_json::json!({
                    "priority_level": format!("{:?}", request.priority),
                    "timestamp": Utc::now().to_rfc3339()
                }),
                confidence: 0.7,
                source: "priority_analysis".to_string(),
            });
        }

        updates
    }
}
