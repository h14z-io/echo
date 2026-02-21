import { db } from '@/lib/db'
import { audioUtils } from '@/lib/audio'
import { generateId, formatTimestamp } from '@/lib/utils'
import type { VoiceNote, Folder } from '@/types'

// v1 types (from localStorage format)
interface V1VoiceNote {
  id: string
  audioBlob: string // base64
  transcription: string
  timestamp: number
  duration: number
}

interface V1Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  notes: V1VoiceNote[]
}

interface V1Settings {
  geminiApiKey: string
  darkMode: boolean
}

const FOLDER_COLORS = [
  '#e84d6e', '#f07593', '#60a5fa', '#34d399',
  '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf',
  '#fb923c', '#818cf8',
]

const CONVERSATIONS_KEY = 'voice_notes_conversations'
const SETTINGS_KEY = 'voice_notes_settings'

export function hasV1Data(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CONVERSATIONS_KEY) !== null
}

export async function migrateV1toV2(): Promise<{ notesMigrated: number, foldersCreated: number }> {
  if (typeof window === 'undefined') {
    return { notesMigrated: 0, foldersCreated: 0 }
  }

  const raw = localStorage.getItem(CONVERSATIONS_KEY)
  if (!raw) {
    return { notesMigrated: 0, foldersCreated: 0 }
  }

  let conversations: V1Conversation[]
  try {
    conversations = JSON.parse(raw)
  } catch {
    return { notesMigrated: 0, foldersCreated: 0 }
  }

  let notesMigrated = 0
  let foldersCreated = 0

  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i]

    // Create folder for each conversation
    const folderId = generateId()
    const folder: Folder = {
      id: folderId,
      name: conversation.title || 'Untitled',
      color: FOLDER_COLORS[i % FOLDER_COLORS.length],
      createdAt: conversation.createdAt,
    }
    await db.folders.put(folder)
    foldersCreated++

    // Migrate each note in the conversation
    for (const v1Note of conversation.notes) {
      try {
        const audioBlob = audioUtils.base64ToBlob(v1Note.audioBlob)

        const note: VoiceNote = {
          id: generateId(),
          title: 'Migrated note',
          defaultTitle: formatTimestamp(v1Note.timestamp),
          audioBlob,
          audioFormat: 'webm',
          duration: v1Note.duration,
          transcription: v1Note.transcription || null,
          summary: null,
          tags: [],
          folderId,
          insightIds: [],
          status: v1Note.transcription ? 'ready' : 'error',
          createdAt: v1Note.timestamp,
          updatedAt: Date.now(),
        }

        await db.notes.put(note)
        notesMigrated++
      } catch (err) {
        console.error('Failed to migrate note:', v1Note.id, err)
      }
    }
  }

  // Migrate API key
  const settingsRaw = localStorage.getItem(SETTINGS_KEY)
  if (settingsRaw) {
    try {
      const v1Settings: V1Settings = JSON.parse(settingsRaw)
      if (v1Settings.geminiApiKey) {
        await db.settings.set('apiKey', v1Settings.geminiApiKey)
      }
    } catch {
      console.error('Failed to migrate settings')
    }
  }

  // Clean up v1 data
  localStorage.removeItem(CONVERSATIONS_KEY)
  localStorage.removeItem(SETTINGS_KEY)

  return { notesMigrated, foldersCreated }
}
