'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceNote } from '@/types';
import { audioUtils } from '@/lib/audio';
import { transcribeAudio } from '@/lib/gemini';
import { Mic, Square, Loader2, Pause, Play, Check, RotateCcw, FileText } from 'lucide-react';

interface VoiceRecorderProps {
  onNewNote: (note: VoiceNote) => void;
  apiKey: string;
}

export default function VoiceRecorder({ onNewNote, apiKey }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showActions, setShowActions] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load available audio devices
    const loadAudioDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);

        // Set default device if none selected
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error loading audio devices:', err);
      }
    };

    loadAudioDevices();

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Calculate average volume for button animation with higher sensitivity
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      setAudioLevel(Math.min(rms * 8, 1)); // Increased amplification for more reactivity

      canvasCtx.fillStyle = 'rgb(10, 10, 10)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(59, 130, 246)'; // blue-500
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization
      drawWaveform();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setShowActions(true);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Stop visualization
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        // Reset audio level
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscribe = async () => {
    if (!recordedBlob) return;

    setIsTranscribing(true);
    setError(null);
    setShowActions(false);

    try {
      // Get audio duration
      const duration = await audioUtils.getAudioDuration(recordedBlob);

      // Convert to base64
      const base64Audio = await audioUtils.blobToBase64(recordedBlob);

      // Transcribe using Gemini
      let transcription = '';
      if (apiKey) {
        try {
          transcription = await transcribeAudio(recordedBlob, apiKey);
        } catch (err) {
          console.error('Transcription error:', err);
          setError('Transcription failed. Audio saved without transcription.');
        }
      } else {
        setError('No API key configured. Audio saved without transcription.');
      }

      // Create new note
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        audioBlob: base64Audio,
        transcription,
        timestamp: Date.now(),
        duration,
      };

      onNewNote(newNote);

      // Reset state
      setRecordedBlob(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio recording.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveWithoutTranscription = async () => {
    if (!recordedBlob) return;

    setShowActions(false);

    try {
      // Get audio duration
      const duration = await audioUtils.getAudioDuration(recordedBlob);

      // Convert to base64
      const base64Audio = await audioUtils.blobToBase64(recordedBlob);

      // Create new note without transcription
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        audioBlob: base64Audio,
        transcription: '',
        timestamp: Date.now(),
        duration,
      };

      onNewNote(newNote);

      // Reset state
      setRecordedBlob(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error saving audio:', err);
      setError('Failed to save audio recording.');
    }
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    setShowActions(false);
    setRecordingTime(0);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Circular Recording Button with Timer */}
      <div className="relative mb-6">
        {/* Waveform Background (hidden canvas) */}
        <canvas
          ref={canvasRef}
          width={800}
          height={100}
          className="hidden"
        />

        {/* Animated Rings - Reactive to audio */}
        {isRecording && (
          <>
            {/* Outer ring - more reactive */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/40 to-pink-500/40 blur-md"
              style={{
                transform: `scale(${1 + audioLevel * 0.5})`,
                opacity: 0.3 + audioLevel * 0.4,
                transition: 'transform 0.05s ease-out, opacity 0.05s ease-out'
              }}
            />
            {/* Middle ring */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-pink-500/30"
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                opacity: 0.4 + audioLevel * 0.3,
                transition: 'transform 0.05s ease-out, opacity 0.05s ease-out'
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/20 to-pink-400/20"
              style={{
                transform: `scale(${1 + audioLevel * 0.15})`,
                opacity: 0.5 + audioLevel * 0.2,
                transition: 'transform 0.05s ease-out, opacity 0.05s ease-out'
              }}
            />
          </>
        )}

        {/* Main Circle */}
        <div className="relative">
          {!isRecording && !isTranscribing && !showActions ? (
            <button
              onClick={startRecording}
              disabled={isTranscribing}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 shadow-2xl shadow-purple-500/50 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed group"
            >
              <Mic className="w-12 h-12 md:w-16 md:h-16 text-white mb-2" />
              <span className="text-white font-medium text-sm">Start Recording</span>
            </button>
          ) : isTranscribing ? (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/50 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-white animate-spin mb-2" />
              <span className="text-white font-medium text-sm">Transcribing...</span>
            </div>
          ) : showActions ? (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 shadow-2xl shadow-green-500/50 flex flex-col items-center justify-center">
              <Check className="w-12 h-12 md:w-16 md:h-16 text-white mb-2" />
              <span className="text-white font-medium text-sm">Recording Complete</span>
            </div>
          ) : (
            <button
              onClick={stopRecording}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 flex flex-col items-center justify-center"
              style={{
                transform: `scale(${1 + audioLevel * 0.2})`,
                boxShadow: `0 0 ${30 + audioLevel * 60}px rgba(239, 68, 68, ${0.6 + audioLevel * 0.4})`,
                transition: 'transform 0.05s ease-out, box-shadow 0.05s ease-out'
              }}
            >
              <div className="text-3xl md:text-4xl font-mono text-white mb-3">
                {formatTime(recordingTime)}
              </div>
              <div
                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
                style={{
                  transform: `scale(${1 + audioLevel * 0.1})`,
                  transition: 'transform 0.05s ease-out'
                }}
              >
                <Square className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons - Shown after recording */}
      {showActions && recordedBlob && (
        <div className="flex flex-col gap-3 w-full max-w-md mb-4">
          <button
            onClick={handleTranscribe}
            disabled={!apiKey}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            <span>Generate Transcription</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleReRecord}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Re-record</span>
            </button>

            <button
              onClick={handleSaveWithoutTranscription}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <Check className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>

          {!apiKey && (
            <p className="text-center text-xs text-yellow-400">
              No API key configured. Transcription disabled.
            </p>
          )}
        </div>
      )}

      {/* Status Text */}
      {!showActions && (
        <div className="text-center mb-4 min-h-[24px]">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : !isRecording && !isTranscribing ? (
            <p className="text-gray-400 text-sm">Ready to record</p>
          ) : null}
        </div>
      )}

      {/* Microphone Selector */}
      {!showActions && audioDevices.length > 0 && (
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <label htmlFor="mic-select" className="text-sm text-gray-300">
            Microphone
          </label>
          <select
            id="mic-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isRecording || isTranscribing}
            className="w-full px-4 py-2 text-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {!apiKey && !error && !showActions && (
        <p className="text-center text-xs text-yellow-400 mt-4 max-w-md">
          No API key configured. Add your Gemini API key in Settings for transcription.
        </p>
      )}
    </div>
  );
}
