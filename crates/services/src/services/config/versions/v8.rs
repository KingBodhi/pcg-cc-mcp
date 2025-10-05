use anyhow::Error;
use ed25519_dalek::Keypair;
use executors::{executors::BaseCodingAgent, profile::ExecutorProfileId};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use strum_macros::EnumString;
use ts_rs::TS;
pub use v7::{EditorConfig, EditorType, GitHubConfig, NotificationConfig, SoundFile, UiLanguage};

use crate::services::config::versions::v7;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct AptosWalletConfig {
    pub account_address: String,
    pub public_key: String,
    pub private_key: String,
}

impl AptosWalletConfig {
    pub fn generate() -> Self {
        let mut rng = OsRng;
        let keypair = Keypair::generate(&mut rng);
        let public_key_bytes = keypair.public.to_bytes();

        let mut hasher = Sha3_256::new();
        hasher.update(public_key_bytes);
        hasher.update([0u8]); // Ed25519 scheme byte
        let authentication_key = hasher.finalize();

        let account_address = format!("0x{}", hex::encode(authentication_key));
        let public_key = format!("0x{}", hex::encode(public_key_bytes));
        let private_key = format!("0x{}", hex::encode(keypair.secret.to_bytes()));

        Self {
            account_address,
            public_key,
            private_key,
        }
    }
}

impl Default for AptosWalletConfig {
    fn default() -> Self {
        Self::generate()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, EnumString)]
#[ts(use_ts_enum)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[strum(serialize_all = "SCREAMING_SNAKE_CASE")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Config {
    pub config_version: String,
    pub theme: ThemeMode,
    pub executor_profile: ExecutorProfileId,
    pub disclaimer_acknowledged: bool,
    pub onboarding_acknowledged: bool,
    pub github_login_acknowledged: bool,
    pub telemetry_acknowledged: bool,
    pub notifications: NotificationConfig,
    pub editor: EditorConfig,
    pub github: GitHubConfig,
    pub analytics_enabled: Option<bool>,
    pub workspace_dir: Option<String>,
    pub last_app_version: Option<String>,
    pub show_release_notes: bool,
    #[serde(default)]
    pub language: UiLanguage,
    #[serde(default)]
    pub aptos_wallet: AptosWalletConfig,
}

impl Config {
    pub fn from_previous_version(raw_config: &str) -> Result<Self, Error> {
        let old_config = match serde_json::from_str::<v7::Config>(raw_config) {
            Ok(cfg) => cfg,
            Err(e) => {
                tracing::error!("❌ Failed to parse config: {}", e);
                tracing::error!("   at line {}, column {}", e.line(), e.column());
                return Err(e.into());
            }
        };

        Ok(Self {
            config_version: "v8".to_string(),
            theme: match old_config.theme {
                v7::ThemeMode::Light => ThemeMode::Light,
                v7::ThemeMode::Dark => ThemeMode::Dark,
                v7::ThemeMode::System => ThemeMode::System,
            },
            executor_profile: old_config.executor_profile,
            disclaimer_acknowledged: old_config.disclaimer_acknowledged,
            onboarding_acknowledged: old_config.onboarding_acknowledged,
            github_login_acknowledged: old_config.github_login_acknowledged,
            telemetry_acknowledged: old_config.telemetry_acknowledged,
            notifications: old_config.notifications,
            editor: old_config.editor,
            github: old_config.github,
            analytics_enabled: old_config.analytics_enabled,
            workspace_dir: old_config.workspace_dir,
            last_app_version: old_config.last_app_version,
            show_release_notes: old_config.show_release_notes,
            language: old_config.language,
            aptos_wallet: AptosWalletConfig::generate(),
        })
    }
}

impl From<String> for Config {
    fn from(raw_config: String) -> Self {
        if let Ok(config) = serde_json::from_str::<Config>(&raw_config)
            && config.config_version == "v8"
        {
            return config;
        }

        match Self::from_previous_version(&raw_config) {
            Ok(config) => {
                tracing::info!("Config upgraded to v8");
                config
            }
            Err(e) => {
                tracing::warn!("Config migration failed: {}, using default", e);
                Self::default()
            }
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            config_version: "v8".to_string(),
            theme: ThemeMode::System,
            executor_profile: ExecutorProfileId::new(BaseCodingAgent::ClaudeCode),
            disclaimer_acknowledged: false,
            onboarding_acknowledged: false,
            github_login_acknowledged: false,
            telemetry_acknowledged: false,
            notifications: NotificationConfig::default(),
            editor: EditorConfig::default(),
            github: GitHubConfig::default(),
            analytics_enabled: None,
            workspace_dir: None,
            last_app_version: None,
            show_release_notes: false,
            language: UiLanguage::default(),
            aptos_wallet: AptosWalletConfig::generate(),
        }
    }
}
