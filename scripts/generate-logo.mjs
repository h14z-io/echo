#!/usr/bin/env node

/**
 * One-time script to generate the Echo app logo using Gemini Nano Banana Pro.
 *
 * Usage: node scripts/generate-logo.mjs
 *
 * Requires GEMINI_API_KEY in .env.local or as environment variable.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// Load API key from .env.local
function loadApiKey() {
  const envPath = resolve(projectRoot, '.env.local')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    const match = content.match(/GEMINI_API_KEY=(.+)/)
    if (match) return match[1].trim()
  }
  return process.env.GEMINI_API_KEY
}

const apiKey = loadApiKey()
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in .env.local or environment')
  process.exit(1)
}

const MODEL = 'gemini-3-pro-image-preview'

const prompt = `Generate a minimal, modern app icon for a voice notes app called "Echo".
Design requirements:
- A clean, geometric sound wave or echo ripple pattern
- Use magenta/pink color (#BB2649) as the primary color
- Pure black (#000000) background
- Very minimal, no text whatsoever, just the icon symbol
- Should work at small sizes (app icon)
- Square format, centered composition
- Think Linear, Vercel, or Raycast level of design sophistication
- Subtle gradient allowed on the symbol itself`

console.log(`Generating logo with ${MODEL}...`)

try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API error:', response.status, errorText)
    process.exit(1)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []

  let imageFound = false
  for (const part of parts) {
    if (part.inlineData) {
      const { data: b64, mimeType } = part.inlineData
      const ext = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'png'
      const buffer = Buffer.from(b64, 'base64')

      const publicDir = resolve(projectRoot, 'public')
      if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

      const outputPath = resolve(publicDir, `logo.${ext}`)
      writeFileSync(outputPath, buffer)
      console.log(`Logo saved to public/logo.${ext} (${(buffer.length / 1024).toFixed(1)} KB)`)
      imageFound = true
      break
    }
  }

  if (!imageFound) {
    console.error('No image returned. Text response:')
    for (const part of parts) {
      if (part.text) console.log(part.text)
    }
    process.exit(1)
  }
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
