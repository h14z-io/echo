# 🚀 Quick Start Guide

## Install & Run in 3 Steps

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open http://localhost:3000
```

## First Time Setup

1. Open the app in your browser
2. Click the **Settings** icon (⚙️) in the top right
3. Paste your Gemini API key
4. Click **Save**

Get your API key here: https://aistudio.google.com/apikey

## Quick Test

1. Click the **"+"** button to create a new conversation
2. Click **"Start Recording"**
3. Say something (e.g., "This is a test recording")
4. Click **"Stop Recording"**
5. Wait a few seconds for transcription
6. See your audio + transcription appear!

## Features You Can Try

- ✅ Create multiple conversations
- ✅ Record multiple notes per conversation
- ✅ Rename conversations (click the edit icon)
- ✅ Play back audio with waveform visualization
- ✅ Copy transcription to clipboard
- ✅ Download audio files (.webm)
- ✅ Download transcriptions (.txt)
- ✅ Delete notes and conversations

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Troubleshooting

### Microphone not working
- Check browser permissions (allow microphone access)
- Try Chrome/Edge (best compatibility)

### Transcription not working
- Make sure you added your Gemini API key in Settings
- Check browser console for errors
- Verify your API key is valid

### Audio not saving
- Check browser console for localStorage errors
- Clear browser cache and try again

## Notes

- All data is stored in **browser localStorage**
- API key is **never sent to any server** except Google's Gemini API
- Works completely offline (except for transcription)
- No backend needed!

---

Happy recording! 🎙️
