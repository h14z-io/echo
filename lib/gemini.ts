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
  locale = 'en',
  images?: { base64: string; mimeType: string }[]
): Promise<InsightResult> {
  const response = await fetch('/api/insights/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, images, locale }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Generation failed' }))
    throw new Error(error.error || 'Generation failed')
  }

  return response.json()
}

export interface DiagramResult {
  mermaidCode: string
}

export async function generateDiagram(
  notes: { date: number; title: string; transcription: string }[],
  locale = 'en',
  images?: { base64: string; mimeType: string }[]
): Promise<DiagramResult> {
  const response = await fetch('/api/insights/diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, images, locale }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Diagram generation failed' }))
    throw new Error(error.error || 'Diagram generation failed')
  }

  return response.json()
}

export interface AskResult {
  content: string
  mermaidDiagrams: string[]
}

export async function askInsightQuestion(
  notes: { date: number; title: string; transcription: string }[],
  insightName: string,
  userPrompt: string,
  locale = 'en'
): Promise<AskResult> {
  const response = await fetch('/api/insights/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, insightName, userPrompt, locale }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Question failed' }))
    throw new Error(error.error || 'Question failed')
  }

  return response.json()
}
