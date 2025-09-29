use anyhow::Result;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyCheckContext {
    pub task_id: String,
    pub project_id: String,
    pub severity: Option<String>,
    pub tags: Vec<String>,
    pub actor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyDecision {
    pub allow: bool,
    pub actions: Vec<PolicyAction>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PolicyAction {
    RequireHumanReview,
    EscalateCrisis,
    StartWorkflow { workflow: String },
    Annotate { key: String, value: String },
}

pub fn evaluate(context: PolicyCheckContext) -> Result<PolicyDecision> {
    info!(task_id = %context.task_id, "evaluating PCG policy");

    let mut actions = Vec::new();
    let mut allow = true;

    if context.tags.iter().any(|tag| tag == "crisis") {
        allow = false;
        actions.push(PolicyAction::EscalateCrisis);
        actions.push(PolicyAction::StartWorkflow {
            workflow: "crisis-esc".to_string(),
        });
    }

    if context
        .severity
        .as_deref()
        .map(|lvl| lvl.eq_ignore_ascii_case("high"))
        .unwrap_or(false)
    {
        actions.push(PolicyAction::RequireHumanReview);
    }

    Ok(PolicyDecision {
        allow,
        actions,
        notes: None,
    })
}

pub fn record_decision(context: &PolicyCheckContext, decision: &PolicyDecision) {
    if decision.allow {
        info!(task_id = %context.task_id, "policy approval granted");
    } else {
        warn!(task_id = %context.task_id, "policy blocked – escalation triggered");
    }
}
