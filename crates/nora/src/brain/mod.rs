use reqwest::Client;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{NoraError, Result};

/// Supported LLM providers for Nora
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum LLMProvider {
    OpenAI,
}

/// Configuration for Nora's reasoning engine
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct LLMConfig {
    pub provider: LLMProvider,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub system_prompt: String,
    #[serde(default)]
    pub endpoint: Option<String>,
}

impl Default for LLMConfig {
    fn default() -> Self {
        Self {
            provider: LLMProvider::OpenAI,
            model: "gpt-4o-mini".to_string(),
            temperature: 0.2,
            max_tokens: 600,
            system_prompt: "You are Nora, the executive AI assistant for PowerClub Global. Respond in confident British English, provide concise executive summaries, and surface relevant projects, stakeholders, or next actions. Offer follow-up suggestions only when useful.".to_string(),
            endpoint: None,
        }
    }
}

/// Thin wrapper around the configured LLM provider
#[derive(Debug, Clone)]
pub struct LLMClient {
    config: LLMConfig,
    client: Client,
    api_key: Option<String>,
}

impl LLMClient {
    pub fn new(config: LLMConfig) -> Self {
        let api_key = match config.provider {
            LLMProvider::OpenAI => std::env::var("OPENAI_API_KEY").ok(),
        };

        Self {
            config,
            client: Client::new(),
            api_key,
        }
    }

    pub fn is_ready(&self) -> bool {
        self.api_key.is_some() || self.config.endpoint.is_some()
    }

    /// Check if LLM is configured and operational
    pub fn is_configured(&self) -> bool {
        self.config.endpoint.is_some() || self.api_key.is_some()
    }

    pub async fn generate(
        &self,
        system_prompt: &str,
        user_query: &str,
        context: &str,
    ) -> Result<String> {
        match self.config.provider {
            LLMProvider::OpenAI => {
                self.generate_openai(system_prompt, user_query, context)
                    .await
            }
        }
    }

    async fn generate_openai(
        &self,
        system_prompt: &str,
        user_query: &str,
        context: &str,
    ) -> Result<String> {
        let endpoint = self
            .config
            .endpoint
            .clone()
            .unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string());

        let auth_header = self.api_key.as_ref().map(|k| format!("Bearer {}", k));

        if auth_header.is_none() && self.config.endpoint.is_none() {
            return Err(NoraError::ConfigError(
                "LLM configured without OPENAI_API_KEY or custom endpoint".to_string(),
            ));
        }

        let system = if system_prompt.is_empty() {
            self.config.system_prompt.as_str()
        } else {
            system_prompt
        };

        let payload = serde_json::json!({
            "model": self.config.model,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "messages": [
                { "role": "system", "content": system },
                {
                    "role": "user",
                    "content": format!(
                        "Context:\n{context}\n\nExecutive request:\n{user_query}",
                        context = context,
                        user_query = user_query
                    )
                }
            ]
        });

        let client = self
            .client
            .post(endpoint)
            .header("Content-Type", "application/json");

        let client = if let Some(auth) = auth_header {
            client.header("Authorization", auth)
        } else {
            client
        };

        let response = client.json(&payload).send().await.map_err(|e| {
            tracing::warn!("LLM request failed: {}", e);
            NoraError::LLMError(format!("Failed to send request: {}", e))
        })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            tracing::warn!("LLM API error ({}): {}", status, body);
            return Err(NoraError::LLMError(format!(
                "OpenAI API error ({}): {}",
                status, body
            )));
        }

        let json: serde_json::Value = response.json().await.map_err(|e| {
            tracing::warn!("Failed to parse LLM response: {}", e);
            NoraError::LLMError(format!("Failed to parse response: {}", e))
        })?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .trim()
            .to_string();

        if content.is_empty() {
            tracing::warn!("LLM returned empty content");
            return Err(NoraError::LLMError(
                "OpenAI returned an empty response".to_string(),
            ));
        }

        tracing::debug!("LLM response received: {} chars", content.len());
        Ok(content)
    }
}
