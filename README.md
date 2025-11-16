# Echō - Voice Notes with AI Transcription

A modern voice notes application with automatic transcription using Gemini 2.5 Flash API.

## Features

- 🎙️ **Voice Recording** with real-time waveform visualization
- 🤖 **Automatic Transcription** using Gemini 2.5 Flash
- 💬 **Conversation Management** - Organize notes into conversations
- ⏱️ **Timestamps** on all notes and conversations
- 📝 **Copy to Clipboard** - Easy transcription copying
- 💾 **Download Audio & Transcriptions** - Export your notes
- 🎨 **Dark Mode** by default
- 💾 **LocalStorage** - All data stored locally in your browser

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Gemini 2.5 Flash API** for transcription
- **Web Audio API** for recording
- **Canvas API** for waveform visualization

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/apikey))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

4. Click the Settings icon and add your Gemini API key

### Building for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

This project is ready to deploy to Vercel:

1. Push to GitHub
2. Import in Vercel
3. Deploy!

No environment variables needed - the API key is stored in the browser's localStorage.

## Usage

1. **Create a Conversation**: Click the "+" button to create a new conversation
2. **Record Audio**: Click "Start Recording" to begin recording
3. **Stop & Transcribe**: Click "Stop Recording" - the audio will be automatically transcribed
4. **Manage Notes**: Play back audio, copy transcriptions, download files, or delete notes
5. **Organize**: Rename conversations and delete them when needed

## API Key Privacy

Your Gemini API key is stored **only in your browser's localStorage**. It is never sent to any server except Google's Gemini API for transcription. The app runs entirely client-side.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limited audio recording support)

## License

MIT

## Credits

Built with ❤️ using Gemini 2.5 Flash for transcription.
