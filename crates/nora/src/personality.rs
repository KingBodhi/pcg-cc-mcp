//! British personality system for Nora

use std::collections::HashMap;

use regex::Regex;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::agent::{NoraRequest, RequestPriority};

/// Configuration for British personality traits
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct PersonalityConfig {
    pub accent_strength: f32,
    pub formality_level: FormalityLevel,
    pub warmth_level: WarmthLevel,
    pub proactive_communication: bool,
    pub executive_vocabulary: bool,
    pub british_expressions: bool,
    pub politeness_level: PolitenessLevel,
}

impl PersonalityConfig {
    pub fn british_executive_assistant() -> Self {
        Self {
            accent_strength: 0.8,
            formality_level: FormalityLevel::Professional,
            warmth_level: WarmthLevel::Warm,
            proactive_communication: true,
            executive_vocabulary: true,
            british_expressions: true,
            politeness_level: PolitenessLevel::VeryPolite,
        }
    }

    pub fn casual_british() -> Self {
        Self {
            accent_strength: 0.6,
            formality_level: FormalityLevel::Casual,
            warmth_level: WarmthLevel::Friendly,
            proactive_communication: false,
            executive_vocabulary: false,
            british_expressions: true,
            politeness_level: PolitenessLevel::Polite,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum FormalityLevel {
    Casual,
    Professional,
    VeryFormal,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum WarmthLevel {
    Neutral,
    Warm,
    Friendly,
    Enthusiastic,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum PolitenessLevel {
    Direct,
    Polite,
    VeryPolite,
    ExtremelyPolite,
}

/// British personality implementation for Nora
#[derive(Debug)]
pub struct BritishPersonality {
    config: PersonalityConfig,
    british_expressions: HashMap<String, Vec<String>>,
    executive_phrases: HashMap<String, Vec<String>>,
    politeness_modifiers: Vec<String>,
    vocabulary_replacements: HashMap<String, String>,
}

impl BritishPersonality {
    pub fn new(config: PersonalityConfig) -> Self {
        let mut personality = Self {
            config,
            british_expressions: HashMap::new(),
            executive_phrases: HashMap::new(),
            politeness_modifiers: Vec::new(),
            vocabulary_replacements: HashMap::new(),
        };

        personality.initialize_expressions();
        personality.initialize_executive_phrases();
        personality.initialize_politeness_modifiers();
        personality.initialize_vocabulary_replacements();

        personality
    }

    /// Apply British personality to a response
    pub fn apply_personality_to_response(&self, response: &str, request: &NoraRequest) -> String {
        let mut processed = response.to_string();

        // Apply vocabulary replacements for British English
        processed = self.apply_vocabulary_replacements(&processed);

        // Apply British expressions
        if self.config.british_expressions {
            processed = self.apply_british_expressions(&processed);
        }

        // Apply executive vocabulary if enabled
        if self.config.executive_vocabulary {
            processed = self.apply_executive_vocabulary(&processed, request);
        }

        // Apply politeness modifications
        processed = self.apply_politeness_modifications(&processed, request);

        // Apply formality adjustments
        processed = self.apply_formality_adjustments(&processed, request);

        // Apply warmth adjustments
        processed = self.apply_warmth_adjustments(&processed, request);

        processed
    }

    /// Generate proactive communication if enabled
    pub fn generate_proactive_communication(&self, context: &str) -> Option<String> {
        if !self.config.proactive_communication {
            return None;
        }

        // Analyze context and generate appropriate proactive communication
        if context.contains("meeting") {
            Some("I say, shall I prepare the agenda for your upcoming meeting?".to_string())
        } else if context.contains("deadline") {
            Some("I do hope you don't mind me mentioning, but there's a deadline approaching that might require your attention.".to_string())
        } else if context.contains("task") {
            Some("Might I suggest we review the task priorities? I'm rather keen to ensure everything is progressing smoothly.".to_string())
        } else {
            None
        }
    }

    /// Get appropriate greeting based on time of day and context
    pub fn get_contextual_greeting(&self, time_of_day: &str, is_first_interaction: bool) -> String {
        let base_greeting = match time_of_day {
            "morning" => {
                if is_first_interaction {
                    "Good morning"
                } else {
                    "Morning"
                }
            }
            "afternoon" => {
                if is_first_interaction {
                    "Good afternoon"
                } else {
                    "Afternoon"
                }
            }
            "evening" => {
                if is_first_interaction {
                    "Good evening"
                } else {
                    "Evening"
                }
            }
            _ => "Hello",
        };

        match self.config.formality_level {
            FormalityLevel::VeryFormal => {
                format!("{}. How may I assist you today?", base_greeting)
            }
            FormalityLevel::Professional => {
                format!("{}! How can I help?", base_greeting)
            }
            FormalityLevel::Casual => {
                format!("{}, how's things?", base_greeting)
            }
        }
    }

    // Private implementation methods

    fn initialize_expressions(&mut self) {
        self.british_expressions.insert(
            "agreement".to_string(),
            vec![
                "Quite right".to_string(),
                "Absolutely".to_string(),
                "Indeed".to_string(),
                "Spot on".to_string(),
                "Precisely".to_string(),
            ],
        );

        self.british_expressions.insert(
            "uncertainty".to_string(),
            vec![
                "I'm rather unsure".to_string(),
                "I'm not entirely certain".to_string(),
                "I dare say it's unclear".to_string(),
                "It's a bit tricky to say".to_string(),
            ],
        );

        self.british_expressions.insert(
            "polite_interruption".to_string(),
            vec![
                "I beg your pardon, but".to_string(),
                "If I may interject".to_string(),
                "Excuse me, but".to_string(),
                "Sorry to interrupt, however".to_string(),
            ],
        );
    }

    fn initialize_executive_phrases(&mut self) {
        self.executive_phrases.insert(
            "analysis".to_string(),
            vec![
                "Upon careful consideration".to_string(),
                "Having reviewed the situation".to_string(),
                "Based on my assessment".to_string(),
                "From a strategic perspective".to_string(),
            ],
        );

        self.executive_phrases.insert(
            "recommendation".to_string(),
            vec![
                "I would strongly recommend".to_string(),
                "My professional opinion is".to_string(),
                "I suggest we consider".to_string(),
                "The optimal course of action would be".to_string(),
            ],
        );

        self.executive_phrases.insert(
            "urgency".to_string(),
            vec![
                "This requires immediate attention".to_string(),
                "I must emphasise the urgency of".to_string(),
                "Time is rather of the essence here".to_string(),
                "This is critically important".to_string(),
            ],
        );
    }

    fn initialize_politeness_modifiers(&mut self) {
        self.politeness_modifiers = vec![
            "if I may".to_string(),
            "if you don't mind".to_string(),
            "if I might suggest".to_string(),
            "perhaps".to_string(),
            "possibly".to_string(),
            "I do hope".to_string(),
            "I trust".to_string(),
        ];
    }

    fn initialize_vocabulary_replacements(&mut self) {
        self.vocabulary_replacements
            .insert("elevator".to_string(), "lift".to_string());
        self.vocabulary_replacements
            .insert("apartment".to_string(), "flat".to_string());
        self.vocabulary_replacements
            .insert("vacation".to_string(), "holiday".to_string());
        self.vocabulary_replacements
            .insert("schedule".to_string(), "timetable".to_string());
        self.vocabulary_replacements
            .insert("analyze".to_string(), "analyse".to_string());
        self.vocabulary_replacements
            .insert("organize".to_string(), "organise".to_string());
        self.vocabulary_replacements
            .insert("color".to_string(), "colour".to_string());
        self.vocabulary_replacements
            .insert("favor".to_string(), "favour".to_string());
        self.vocabulary_replacements
            .insert("center".to_string(), "centre".to_string());
        self.vocabulary_replacements
            .insert("theater".to_string(), "theatre".to_string());
        self.vocabulary_replacements
            .insert("defense".to_string(), "defence".to_string());
        self.vocabulary_replacements
            .insert("license".to_string(), "licence".to_string());
    }

    fn apply_vocabulary_replacements(&self, text: &str) -> String {
        let mut result = text.to_string();

        for (american, british) in &self.vocabulary_replacements {
            // Use word boundaries to avoid partial replacements
            let pattern = format!(r"\b{}\b", regex::escape(american));
            let re = Regex::new(&pattern).unwrap();
            result = re.replace_all(&result, british.as_str()).to_string();
        }

        result
    }

    fn apply_british_expressions(&self, text: &str) -> String {
        let mut result = text.to_string();

        // Add British expressions contextually
        if result.contains("yes") || result.contains("correct") {
            if let Some(expressions) = self.british_expressions.get("agreement") {
                if !expressions.is_empty() && result.len() < 50 {
                    // Only for short responses
                    let expr = &expressions[0]; // Use first expression for consistency
                    result = format!("{}. {}", expr, result);
                }
            }
        }

        result
    }

    fn apply_executive_vocabulary(&self, text: &str, request: &NoraRequest) -> String {
        let mut result = text.to_string();

        // Apply executive vocabulary based on request type and priority
        match request.priority {
            RequestPriority::Executive | RequestPriority::Urgent => {
                if result.contains("I think") {
                    result = result.replace("I think", "In my professional assessment");
                }
                if result.contains("maybe") {
                    result = result.replace("maybe", "it is likely that");
                }
            }
            _ => {}
        }

        result
    }

    fn apply_politeness_modifications(&self, text: &str, _request: &NoraRequest) -> String {
        let mut result = text.to_string();

        match self.config.politeness_level {
            PolitenessLevel::VeryPolite | PolitenessLevel::ExtremelyPolite => {
                // Add polite softeners
                if !result.starts_with("I ") && !result.starts_with("May ") {
                    if result.contains("suggest") || result.contains("recommend") {
                        result = format!("If I may suggest, {}", result.to_lowercase());
                    }
                }

                // Add courtesy endings
                if !result.ends_with("please.")
                    && !result.ends_with("thank you.")
                    && result.len() > 50
                {
                    result = format!("{}. I do hope this is helpful.", result);
                }
            }
            PolitenessLevel::Polite => {
                if result.contains("you should") {
                    result = result.replace("you should", "you might consider");
                }
            }
            PolitenessLevel::Direct => {
                // Keep direct style
            }
        }

        result
    }

    fn apply_formality_adjustments(&self, text: &str, request: &NoraRequest) -> String {
        let mut result = text.to_string();

        match self.config.formality_level {
            FormalityLevel::VeryFormal => {
                // Use more formal constructions
                result = result.replace("can't", "cannot");
                result = result.replace("won't", "will not");
                result = result.replace("don't", "do not");
                result = result.replace("isn't", "is not");

                // Add formal address for executive requests
                if matches!(request.priority, RequestPriority::Executive) {
                    if !result.starts_with("I ") {
                        result = format!("Allow me to inform you that {}", result.to_lowercase());
                    }
                }
            }
            FormalityLevel::Professional => {
                // Balance formality with approachability
                result = result.replace("yeah", "yes");
                result = result.replace("ok", "very well");
            }
            FormalityLevel::Casual => {
                // Allow contractions and casual language
            }
        }

        result
    }

    fn apply_warmth_adjustments(&self, text: &str, _request: &NoraRequest) -> String {
        let mut result = text.to_string();

        match self.config.warmth_level {
            WarmthLevel::Enthusiastic => {
                // Add enthusiasm markers
                if result.len() > 20 && !result.contains("!") {
                    result = format!("{}!", result);
                }
            }
            WarmthLevel::Friendly => {
                // Add friendly touches
                if result.starts_with("I ") && !result.contains("pleased") {
                    result = result.replace("I ", "I'm pleased to ");
                }
            }
            WarmthLevel::Warm => {
                // Add subtle warmth
                if result.contains("help") && !result.contains("happy to") {
                    result = result.replace("help", "be happy to help");
                }
            }
            WarmthLevel::Neutral => {
                // Keep neutral tone
            }
        }

        result
    }
}
