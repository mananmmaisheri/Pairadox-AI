
export enum AgentState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export type FeedbackState = 'up' | 'down';

export interface User {
  username: string;
  email: string;
  password?: string; // Stored locally for simulation
  avatar?: string;   // Base64 image string
  chatHistory?: Record<string, Message[]>;
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  feedback?: FeedbackState;
  attachment?: string; // Data URL for display (user uploaded)
  generatedImage?: string; // Data URL for generated image (agent created)
  suggestions?: string[]; // Suggested follow-up questions
}

export interface GenAIResponse {
  answer: string;
  suggestions: string[];
  imagePrompt?: string; // If the agent wants to generate an image
}

export interface LatencyMetrics {
  asrTime: number;
  llmTime: number;
  ttsTime: number;
  totalTime: number;
}

export interface MurfConfig {
  voiceId: string;
  apiKey: string;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
}

// Union type for TTS configuration
export type TTSProvider = 
  | { type: 'NATIVE'; config: {} }
  | { type: 'MURF'; config: MurfConfig }
  | { type: 'ELEVENLABS'; config: ElevenLabsConfig };


export interface Theme {
  primary: string;    // Main color (e.g. 'cyan-500')
  secondary: string;  // Glow color
  accent: string;     // UI accents
  bgGradient: string; // CSS gradient class
  orbColor: string;   // Internal orb color class
}

export interface Assistant {
  id: string;
  name: string;
  voiceId: string;
  theme: Theme;
  systemInstruction?: string;
}
