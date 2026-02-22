// Echo v2 - Type Definitions

export interface VoiceNote {
  id: string
  title: string
  defaultTitle: string
  audioBlob: Blob
  audioFormat: string
  duration: number
  transcription: string | null
  summary: string | null
  tags: string[]
  detectedLanguage?: string
  folderId: string | null
  insightIds: string[]
  status: 'recording' | 'transcribing' | 'ready' | 'error'
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
  color: string
  noteCount?: number
  createdAt: number
}

export interface InsightImage {
  id: string
  insightId: string
  blob: Blob
  name: string
  mimeType: string
  width: number
  height: number
  mermaidCode?: string
  createdAt: number
}

export interface Insight {
  id: string
  name: string
  noteIds: string[]
  imageIds: string[]
  generatedContent: InsightContent | null
  lastGeneratedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface InsightContent {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  timeline: TimelineEntry[]
  customSections: CustomSection[]
}

export interface TimelineEntry {
  date: number
  noteId: string
  event: string
}

export interface CustomSection {
  prompt: string
  content: string
  generatedAt: number
}

export interface AppSettings {
  apiKey: string
  theme: 'dark' | 'light'
  onboardingCompleted: boolean
}
