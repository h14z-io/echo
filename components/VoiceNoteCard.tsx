'use client';

import { VoiceNote } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { audioUtils } from '@/lib/audio';
import { transcribeAudio } from '@/lib/gemini';
import { Play, Pause, Download, Copy, Trash2, Check, FileText, Loader2 } from 'lucide-react';

interface VoiceNoteCardProps {
  note: VoiceNote;
  onDelete: (noteId: string) => void;
  onUpdateTranscription?: (noteId: string, transcription: string) => void;
  apiKey?: string;
}

export default function VoiceNoteCard({ note, onDelete, onUpdateTranscription, apiKey }: VoiceNoteCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Create audio element
    const blob = audioUtils.base64ToBlob(note.audioBlob);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Update current time
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      drawPlaybackWaveform(audio.currentTime / audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Draw initial waveform
    drawStaticWaveform();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      URL.revokeObjectURL(url);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [note.audioBlob]);

  // Store waveform data for consistent rendering
  const waveformDataRef = useRef<number[]>([]);

  const drawStaticWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 50;
    const barWidth = width / barCount;

    // Generate consistent waveform data if not exists
    if (waveformDataRef.current.length === 0) {
      waveformDataRef.current = Array.from({ length: barCount }, () =>
        Math.random() * 0.8 + 0.1
      );
    }

    ctx.clearRect(0, 0, width, height);

    // Draw bars with consistent heights
    for (let i = 0; i < barCount; i++) {
      const barHeight = waveformDataRef.current[i] * height;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = 'rgba(147, 51, 234, 0.3)'; // purple-600/30
      ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  };

  const drawPlaybackWaveform = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 50;
    const barWidth = width / barCount;
    const playedBars = Math.floor(barCount * progress);

    ctx.clearRect(0, 0, width, height);

    // Draw bars with progress color and gradient effect
    for (let i = 0; i < barCount; i++) {
      const barHeight = waveformDataRef.current[i] * height;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Create gradient for played bars
      if (i < playedBars) {
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)'); // purple-500
        gradient.addColorStop(1, 'rgba(147, 51, 234, 1)'); // purple-600
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = 'rgba(147, 51, 234, 0.3)'; // purple-600/30
      }

      ctx.fillRect(x, y, barWidth - 2, barHeight);

      // Add glow effect to current playing bar
      if (i === playedBars) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    const blob = audioUtils.base64ToBlob(note.audioBlob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-note-${note.timestamp}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTranscription = () => {
    const blob = new Blob([note.transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${note.timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(note.transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateTranscription = async () => {
    if (!apiKey || !onUpdateTranscription) return;

    setIsTranscribing(true);

    try {
      const blob = audioUtils.base64ToBlob(note.audioBlob);
      const transcription = await transcribeAudio(blob, apiKey);
      onUpdateTranscription(note.id, transcription);
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 space-y-4 hover:border-white/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {audioUtils.formatTimestamp(note.timestamp)}
        </span>
        <button
          onClick={() => {
            if (confirm('Delete this note?')) {
              onDelete(note.id);
            }
          }}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-300"
          title="Delete note"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Audio Player */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayback}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <div className="flex-1 bg-black/20 rounded-lg p-2">
            <canvas
              ref={canvasRef}
              width={400}
              height={60}
              className="w-full h-12 rounded"
            />
          </div>

          <span className="text-sm text-gray-300 min-w-[80px] text-right font-mono">
            {audioUtils.formatDuration(currentTime)} / {audioUtils.formatDuration(note.duration)}
          </span>
        </div>

        <button
          onClick={downloadAudio}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-gray-300 rounded-lg transition-all duration-300"
        >
          <Download className="w-4 h-4" />
          <span>Download Audio</span>
        </button>
      </div>

      {/* Transcription */}
      {note.transcription ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-purple-300">Transcription</h4>
            <div className="flex gap-2">
              <button
                onClick={copyTranscription}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={downloadTranscription}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                title="Download transcription"
              >
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-4 border border-white/5">
            {note.transcription}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleGenerateTranscription}
            disabled={!apiKey || isTranscribing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Generate Transcription</span>
              </>
            )}
          </button>
          {!apiKey && (
            <p className="text-center text-xs text-yellow-400">
              Add API key in Settings to enable transcription
            </p>
          )}
        </div>
      )}
    </div>
  );
}
