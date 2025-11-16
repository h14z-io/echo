export interface VoiceNote {
  id: string;
  audioBlob: string; // base64 encoded
  transcription: string;
  timestamp: number;
  duration: number; // in seconds
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  notes: VoiceNote[];
}

export interface AppSettings {
  geminiApiKey: string;
  darkMode: boolean;
}
