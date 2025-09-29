//! Voice processing capabilities for Nora
//!
//! Adapted from voice-agent-v2 for executive assistant functionality

pub mod config;
pub mod engine;
pub mod stt;
pub mod tts;

use chrono::{DateTime, Utc};
pub use config::{AudioConfig, STTConfig, STTProvider, TTSConfig, TTSProvider, VoiceConfig};
pub use engine::VoiceEngine;
use serde::{Deserialize, Serialize};
pub use stt::{SpeechToText, TranscriptionResult};
use ts_rs::TS;
pub use tts::{TextToSpeech, VoiceProfile};

/// Request for speech synthesis
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SpeechRequest {
    pub text: String,
    pub voice_profile: VoiceProfile,
    pub speed: f32,
    pub volume: f32,
    pub format: AudioFormat,
    pub british_accent: bool,
    pub executive_tone: bool,
}

/// Response from speech synthesis
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SpeechResponse {
    pub audio_data: String, // Base64 encoded
    pub duration_ms: u64,
    pub sample_rate: u32,
    pub format: AudioFormat,
    pub processing_time_ms: u64,
}

/// Audio format options
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum AudioFormat {
    Wav,
    Mp3,
    Flac,
    Ogg,
}

/// Voice processing errors
#[derive(Debug, thiserror::Error)]
pub enum VoiceError {
    #[error("TTS error: {0}")]
    TTSError(String),

    #[error("STT error: {0}")]
    STTError(String),

    #[error("Audio processing error: {0}")]
    AudioError(String),

    #[error("Voice engine not initialized")]
    NotInitialized,

    #[error("Unsupported audio format: {0}")]
    UnsupportedFormat(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

pub type VoiceResult<T> = Result<T, VoiceError>;

/// Voice interaction event
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct VoiceInteraction {
    pub interaction_id: String,
    pub session_id: String,
    pub interaction_type: VoiceInteractionType,
    pub audio_input: Option<String>, // Base64 encoded
    pub transcription: Option<String>,
    pub response_text: String,
    pub audio_response: Option<String>, // Base64 encoded
    pub processing_time_ms: u64,
    pub timestamp: DateTime<Utc>,
}

/// Types of voice interactions
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum VoiceInteractionType {
    /// User spoke to Nora
    SpeechInput,
    /// Nora spoke to user
    SpeechOutput,
    /// Two-way conversation
    Conversation,
    /// Voice command
    Command,
    /// Executive briefing
    Briefing,
    /// Alert/notification
    Alert,
}
