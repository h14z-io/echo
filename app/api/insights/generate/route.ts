import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { LOCALE_LANGUAGE } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/translations'

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured on server' },
      { status: 500 }
    )
  }

  try {
    const { notes, locale = 'en' } = await request.json() as {
      notes: { date: number; title: string; transcription: string }[]
      locale?: Locale
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({ error: 'No notes provided' }, { status: 400 })
    }

    const language = LOCALE_LANGUAGE[locale] || 'English'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const notesContext = notes
      .sort((a, b) => a.date - b.date)
      .map((n) => `[${new Date(n.date).toLocaleDateString()}] "${n.title}": ${n.transcription}`)
      .join('\n\n')

    const prompt = `You have ${notes.length} voice notes with their transcriptions. Analyze all the content and generate your response in ${language}:

1. SUMMARY: General summary of all topics discussed (1 paragraph)
2. KEY_POINTS: The most important points mentioned (bullet list)
3. ACTION_ITEMS: Concrete actions, decisions, or next steps mentioned
4. TIMELINE: Chronology of events/topics ordered by date

Notes:
${notesContext}

Respond ONLY with valid JSON (no markdown, no code blocks):
{"summary": "...", "keyPoints": ["...", "..."], "actionItems": ["...", "..."], "timeline": [{"date": "...", "event": "..."}, ...]}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Insight generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
