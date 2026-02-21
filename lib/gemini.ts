// Client-side API wrappers - calls server-side Route Handlers

export interface TranscriptionResult {
  title: string
  summary: string
  transcription: string
  tags: string[]
}

export async function processRecording(
  audioBlob: Blob,
  locale = 'en'
): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('audio', audioBlob)
  formData.append('locale', locale)

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Transcription failed' }))
    throw new Error(error.error || 'Transcription failed')
  }

  return response.json()
}

export interface InsightResult {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  timeline: { date: string; event: string }[]
}

export async function generateInsightAnalysis(
  notes: { date: number; title: string; transcription: string }[],
  locale = 'en'
): Promise<InsightResult> {
  const response = await fetch('/api/insights/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, locale }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Generation failed' }))
    throw new Error(error.error || 'Generation failed')
  }

  return response.json()
}

export async function askInsightQuestion(
  notes: { date: number; title: string; transcription: string }[],
  insightName: string,
  userPrompt: string,
  locale = 'en'
): Promise<string> {
  const response = await fetch('/api/insights/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, insightName, userPrompt, locale }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Question failed' }))
    throw new Error(error.error || 'Question failed')
  }

  const data = await response.json()
  return data.content
}
