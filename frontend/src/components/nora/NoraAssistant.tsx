import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/ui/loader';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Crown,
  MessageSquare,
  Settings,
  Zap
} from 'lucide-react';

// Type definitions based on Rust backend
interface NoraRequest {
  requestId: string;
  sessionId: string;
  requestType: NoraRequestType;
  content: string;
  context?: any;
  voiceEnabled: boolean;
  priority: RequestPriority;
  timestamp: string;
}

interface NoraResponse {
  responseId: string;
  requestId: string;
  sessionId: string;
  responseType: NoraResponseType;
  content: string;
  actions: ExecutiveAction[];
  voiceResponse?: string; // Base64 encoded audio
  followUpSuggestions: string[];
  contextUpdates: ContextUpdate[];
  timestamp: string;
  processingTimeMs: number;
}

type NoraRequestType =
  | 'voiceInteraction'
  | 'textInteraction'
  | 'taskCoordination'
  | 'strategyPlanning'
  | 'performanceAnalysis'
  | 'communicationManagement'
  | 'decisionSupport'
  | 'proactiveNotification';

type NoraResponseType =
  | 'DirectResponse'
  | 'TaskDelegation'
  | 'StrategyRecommendation'
  | 'PerformanceInsight'
  | 'DecisionSupport'
  | 'CoordinationAction'
  | 'ProactiveAlert';

type RequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent' | 'Executive';

interface ExecutiveAction {
  actionId: string;
  actionType: string;
  description: string;
  parameters: any;
  requiresApproval: boolean;
  estimatedDuration?: string;
  assignedTo?: string;
}

interface ContextUpdate {
  updateType: string;
  key: string;
  value: any;
  confidence: number;
  source: string;
}

interface NoraAssistantProps {
  className?: string;
  defaultSessionId?: string;
}

export function NoraAssistant({ className, defaultSessionId }: NoraAssistantProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentInput, setCurrentInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'nora';
    content: string;
    timestamp: Date;
    response?: NoraResponse;
  }>>([]);

  const sessionId = useRef(defaultSessionId || `session-${Date.now()}`);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const hasInitializedRef = useRef(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Initialize Nora on component mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeNora();
    }
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
      }
    }
  }, []);

  const initializeNora = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/nora/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            personality: {
              accentStrength: 0.8,
              formalityLevel: "professional",
              warmthLevel: "warm",
              proactiveCommunication: true,
              executiveVocabulary: true,
              britishExpressions: true,
              politenessLevel: "veryPolite"
            },
            voice: {
              tts: {
                provider: "elevenLabs",
                voiceId: "ZtcPZrt9K4w8e1OB9M6w",
                speed: 1.0,
                volume: 0.8,
                pitch: 0.0,
                quality: "high",
                britishVoicePreferences: ["ZtcPZrt9K4w8e1OB9M6w"],
                fallbackProviders: ["system"]
              },
              stt: {
                provider: "system",
                model: "system_stt",
                language: "en-GB",
                britishDialectSupport: true,
                executiveVocabulary: true,
                realTime: false,
                noiseReduction: true
              },
              audio: {
                sampleRate: 44100,
                channels: 2,
                bitDepth: 16,
                bufferSize: 1024,
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true
              },
              britishAccent: {
                accentStrength: 0.8,
                regionalVariant: "receivedPronunciation",
                formalityLevel: "professional",
                vocabularyPreferences: "executive"
              },
              executiveMode: {
                enabled: true,
                proactiveCommunication: true,
                executiveSummaryStyle: true,
                formalAddress: true,
                businessVocabulary: true
              }
            },
            executiveMode: true,
            proactiveNotifications: true,
            contextAwareness: true,
            multiAgentCoordination: true
          },
          activateImmediately: true
        })
      });

      if (response.ok) {
        const payload = await response.json();
        setIsInitialized(true);
        if (payload?.message) {
          setConversationHistory(prev => {
            const alreadyWelcomed = prev.some(
              entry => entry.type === 'nora' && entry.content === payload.message
            );
            if (alreadyWelcomed) {
              return prev;
            }

            return [
              ...prev,
              {
                type: 'nora',
                content: payload.message,
                timestamp: new Date(),
              }
            ];
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize Nora:', error);
      addMessage('nora', 'I apologise, but I\'m having difficulty connecting at the moment. Please try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (type: 'user' | 'nora', content: string, response?: NoraResponse) => {
    setConversationHistory(prev => [...prev, {
      type,
      content,
      timestamp: new Date(),
      response
    }]);
  };

  const sendMessage = async (content: string, requestType: NoraRequestType = 'textInteraction') => {
    if (!content.trim() || isLoading) return;

    addMessage('user', content);
    setCurrentInput('');
    setInterimTranscript('');
    setIsLoading(true);

    const request = {
      message: content,
      sessionId: sessionId.current,
      requestType,
      voiceEnabled,
      priority: 'normal',
      context: null
    };

    try {
      const response = await fetch('/api/nora/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const noraResponse: NoraResponse = await response.json();
        addMessage('nora', noraResponse.content, noraResponse);

        // Play voice response if available
        if (noraResponse.voiceResponse && voiceEnabled && audioRef.current) {
          const audioElement = audioRef.current;
          audioElement.src = `data:audio/mpeg;base64,${noraResponse.voiceResponse}`;
          audioElement.load();
          audioElement.play().catch(err => {
            console.error('Failed to play Nora voice response:', err);
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('nora', 'I apologise, but I encountered an issue processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startSpeechRecognition = async () => {
    if (!speechRecognitionSupported) {
      await startMediaRecorder();
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = async (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript ?? '';
          if (result?.isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (finalTranscript.trim()) {
          recognition.stop();
          speechRecognitionRef.current = null;
          setIsListening(false);
          setInterimTranscript('');
          await sendMessage(finalTranscript.trim(), 'voiceInteraction');
        }
      };

      recognition.onerror = async () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript('');
        await startMediaRecorder();
      };

      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onspeechend = () => {
        recognition.stop();
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition failed, falling back to recorder:', error);
      await startMediaRecorder();
    }
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const base64Audio = await blobToBase64(audioBlob);

        try {
          const response = await fetch('/api/nora/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: base64Audio })
          });

          if (response.ok) {
            const { text } = await response.json();
            const cleanedText = text?.trim();
            if (cleanedText && !cleanedText.startsWith('This is a dummy transcription')) {
              await sendMessage(cleanedText, 'voiceInteraction');
            } else {
              addMessage('nora', "I couldn't clearly capture that audio. Please try again with a clearer phrase.");
            }
          } else {
            addMessage('nora', 'I was unable to transcribe that audio clip. Let’s give it another go.');
          }
        } catch (error) {
          console.error('Transcription request failed:', error);
          addMessage('nora', 'I ran into an error while transcribing that clip. Could you repeat it for me?');
        }
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const startVoiceRecording = async () => {
    await startSpeechRecognition();
  };

  const stopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
      setInterimTranscript('');
      return;
    }

    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/wav;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentInput);
    }
  };

  const getRequestTypeIcon = (type: NoraRequestType) => {
    switch (type) {
      case 'TaskCoordination': return <Zap className="w-4 h-4" />;
      case 'StrategyPlanning': return <Crown className="w-4 h-4" />;
      case 'VoiceInteraction': return <Volume2 className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case 'Executive': return 'bg-purple-100 text-purple-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-600" />
          Nora - Executive Assistant
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={voiceEnabled ? 'text-blue-600' : 'text-gray-400'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 p-4">
        {!isInitialized ? (
          <div className="flex items-center justify-center flex-1">
            <Loader message="Initializing Nora..." size={32} />
          </div>
        ) : (
          <>
            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              {conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    {message.response && (
                      <div className="mt-2 space-y-1">
                        {/* Executive Actions */}
                        {message.response.actions.length > 0 && (
                          <div className="text-xs space-y-1">
                            {message.response.actions.map(action => (
                              <Badge
                                key={action.actionId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {action.actionType}: {action.description}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Follow-up Suggestions */}
                        {message.response.followUpSuggestions.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Suggestions:</span>
                            <ul className="list-disc list-inside ml-2">
                              {message.response.followUpSuggestions.map((suggestion, i) => (
                                <li key={i} className="cursor-pointer hover:text-blue-600"
                                    onClick={() => setCurrentInput(suggestion)}>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader message="Nora is thinking..." size={16} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={currentInput || interimTranscript}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Nora anything... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[40px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                  variant={isListening ? "destructive" : "secondary"}
                  size="icon"
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => sendMessage(currentInput)}
                  disabled={!currentInput.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Voice Conversation Controls */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Voice Conversation</h4>
                <Badge variant={voiceEnabled ? "default" : "secondary"}>
                  {voiceEnabled ? "Voice On" : "Voice Off"}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  variant={voiceEnabled ? "default" : "outline"}
                  className="flex-1"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                  {voiceEnabled ? "Voice Enabled" : "Enable Voice"}
                </Button>

                {voiceEnabled && (
                  <Button
                    onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                    variant={isListening ? "destructive" : "default"}
                    size="lg"
                    className="px-6"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        End Call
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Call
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isListening && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-green-700">
                      Recording... Speak to Nora now. Click "End Call" when finished.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Please provide a strategic overview of current projects', 'strategyPlanning')}
              >
                Strategy Overview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Show me performance analytics for the team', 'performanceAnalysis')}
              >
                Performance Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Coordinate tasks and priorities', 'taskCoordination')}
              >
                Task Coordination
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Card>
  );
}
