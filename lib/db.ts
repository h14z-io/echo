import type { VoiceNote, Folder, Insight } from '@/types'

const DB_NAME = 'echo-v2'
const DB_VERSION = 1

const STORES = {
  notes: 'notes',
  folders: 'folders',
  insights: 'insights',
  settings: 'settings',
} as const

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'))
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result

        if (!database.objectStoreNames.contains(STORES.notes)) {
          const notesStore = database.createObjectStore(STORES.notes, { keyPath: 'id' })
          notesStore.createIndex('createdAt', 'createdAt')
          notesStore.createIndex('folderId', 'folderId')
          notesStore.createIndex('status', 'status')
        }

        if (!database.objectStoreNames.contains(STORES.folders)) {
          const foldersStore = database.createObjectStore(STORES.folders, { keyPath: 'id' })
          foldersStore.createIndex('name', 'name')
        }

        if (!database.objectStoreNames.contains(STORES.insights)) {
          const insightsStore = database.createObjectStore(STORES.insights, { keyPath: 'id' })
          insightsStore.createIndex('updatedAt', 'updatedAt')
        }

        if (!database.objectStoreNames.contains(STORES.settings)) {
          database.createObjectStore(STORES.settings, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        dbPromise = null
        reject(request.error)
      }
    })
  }

  return dbPromise
}

// Generic helpers

async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || undefined)
    request.onerror = () => reject(request.error)
  })
}

async function put<T>(storeName: string, item: T): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function remove(storeName: string, id: string): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAllByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function destroy(): Promise<void> {
  if (dbPromise) {
    const database = await dbPromise
    database.close()
    dbPromise = null
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Typed API

export const db = {
  destroy,
  notes: {
    getAll: () => getAll<VoiceNote>(STORES.notes),

    get: (id: string) => getById<VoiceNote>(STORES.notes, id),

    put: (note: VoiceNote) => put(STORES.notes, note),

    delete: (id: string) => remove(STORES.notes, id),

    getByFolder: (folderId: string) =>
      getAllByIndex<VoiceNote>(STORES.notes, 'folderId', folderId),

    search: async (query: string): Promise<VoiceNote[]> => {
      const all = await getAll<VoiceNote>(STORES.notes)
      const lower = query.toLowerCase()
      return all
        .filter(
          (n) =>
            n.title.toLowerCase().includes(lower) ||
            n.transcription?.toLowerCase().includes(lower) ||
            n.tags.some((t) => t.toLowerCase().includes(lower))
        )
        .sort((a, b) => b.createdAt - a.createdAt)
    },

    getRecent: async (limit = 5): Promise<VoiceNote[]> => {
      const all = await getAll<VoiceNote>(STORES.notes)
      return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
    },
  },

  folders: {
    getAll: () => getAll<Folder>(STORES.folders),
    get: (id: string) => getById<Folder>(STORES.folders, id),
    put: (folder: Folder) => put(STORES.folders, folder),
    delete: async (id: string) => {
      // Unassign notes from this folder before deleting
      const notes = await getAllByIndex<VoiceNote>(STORES.notes, 'folderId', id)
      for (const note of notes) {
        await put(STORES.notes, { ...note, folderId: null, updatedAt: Date.now() })
      }
      await remove(STORES.folders, id)
    },
  },

  insights: {
    getAll: () => getAll<Insight>(STORES.insights),
    get: (id: string) => getById<Insight>(STORES.insights, id),
    put: (insight: Insight) => put(STORES.insights, insight),
    delete: async (id: string) => {
      // Remove insight reference from associated notes
      const insight = await getById<Insight>(STORES.insights, id)
      if (insight) {
        for (const noteId of insight.noteIds) {
          const note = await getById<VoiceNote>(STORES.notes, noteId)
          if (note) {
            await put(STORES.notes, {
              ...note,
              insightIds: note.insightIds.filter((iid) => iid !== id),
              updatedAt: Date.now(),
            })
          }
        }
      }
      await remove(STORES.insights, id)
    },
  },

  settings: {
    get: async <T = unknown>(key: string): Promise<T | undefined> => {
      const result = await getById<{ key: string; value: T }>(STORES.settings, key)
      return result?.value
    },
    set: <T = unknown>(key: string, value: T) =>
      put(STORES.settings, { key, value }),
  },
}
