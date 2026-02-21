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
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const locale = (formData.get('locale') as Locale) || 'en'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const buffer = await audioFile.arrayBuffer()
    const base64Data = Buffer.from(buffer).toString('base64')
    const mimeType = audioFile.type || 'audio/webm'

    const language = LOCALE_LANGUAGE[locale] || 'English'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const audioPart = {
      inlineData: { data: base64Data, mimeType },
    }

    const prompt = `Analyze this voice audio and generate:
1. TITLE: A descriptive title of 3-6 words in ${language}
2. SUMMARY: A summary of 2-3 lines in ${language}
3. TRANSCRIPTION: Complete and literal transcription in the ORIGINAL language of the audio (auto-detect the spoken language)
4. TAGS: 2-3 relevant tags in lowercase without spaces (in the language of the audio)

Respond ONLY with valid JSON (no markdown, no code blocks):
{"title": "...", "summary": "...", "transcription": "...", "tags": ["tag1", "tag2"]}`

    const result = await model.generateContent([prompt, audioPart])
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    )
  }
}
