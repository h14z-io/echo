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
    const { notes, insightName, userPrompt, locale = 'en' } = await request.json() as {
      notes: { date: number; title: string; transcription: string }[]
      insightName: string
      userPrompt: string
      locale?: Locale
    }

    if (!notes || !userPrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const language = LOCALE_LANGUAGE[locale] || 'English'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const notesContext = notes
      .sort((a, b) => a.date - b.date)
      .map((n) => `[${new Date(n.date).toLocaleDateString()}] "${n.title}": ${n.transcription}`)
      .join('\n\n')

    const prompt = `Context: You have ${notes.length} voice notes from a workspace called "${insightName}".

Transcriptions:
${notesContext}

User instruction: ${userPrompt}

Respond in ${language}.`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Insight question error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Question failed' },
      { status: 500 }
    )
  }
}
