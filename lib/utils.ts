export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const TAG_COLORS = [
  { bg: 'rgba(244, 63, 94, 0.2)', text: '#fda4af' },    // rose
  { bg: 'rgba(139, 92, 246, 0.2)', text: '#c4b5fd' },    // violet
  { bg: 'rgba(14, 165, 233, 0.2)', text: '#7dd3fc' },    // sky
  { bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' },    // emerald
  { bg: 'rgba(245, 158, 11, 0.2)', text: '#fcd34d' },    // amber
  { bg: 'rgba(6, 182, 212, 0.2)', text: '#67e8f9' },     // cyan
  { bg: 'rgba(236, 72, 153, 0.2)', text: '#f9a8d4' },    // pink
  { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc' },    // indigo
]

export function getTagColor(tag: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}
