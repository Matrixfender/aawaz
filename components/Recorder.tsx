'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface RecorderProps {
  onTranscriptReady: (transcript: string, detectedLanguage: string) => void;
  onTranscribing: (loading: boolean) => void;
  inputLanguage: string;
  disabled?: boolean;
}

// Max recording duration in seconds (Saaras REST API: 30s per clip)
const MAX_CLIP_SECONDS = 29;

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
}

function mimeToExt(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function Recorder({
  onTranscriptReady,
  onTranscribing,
  inputLanguage,
  disabled,
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [clipCount, setClipCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const stopAndTranscribe = useCallback(
    async (isAutoStop = false) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);

      mediaRecorderRef.current.stop();

      // Wait for dataavailable to fire
      await new Promise<void>((resolve) => {
        const mr = mediaRecorderRef.current!;
        const onStop = () => {
          mr.removeEventListener('stop', onStop);
          resolve();
        };
        mr.addEventListener('stop', onStop);
      });

      // Stop all tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const audioBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      chunksRef.current = [];

      if (audioBlob.size < 1000) {
        setError('Recording too short. Please speak for at least 1 second.');
        return;
      }

      onTranscribing(true);
      setError(null);

      try {
        const form = new FormData();
        form.append('audio', audioBlob, `recording.${mimeToExt(mimeTypeRef.current)}`);
        form.append('language', inputLanguage);

        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Transcription failed');
          return;
        }

        const newTranscript = accumulatedTranscript
          ? `${accumulatedTranscript} ${data.transcript}`
          : data.transcript;

        setAccumulatedTranscript(newTranscript);
        setClipCount((c) => c + 1);
        onTranscriptReady(newTranscript, data.detectedLanguage);

        // If auto-stopped (hit 30s limit), start recording again automatically
        if (isAutoStop) {
          setElapsedSeconds(0);
          startRecording(newTranscript);
        }
      } catch (e) {
        setError('Network error during transcription. Please check your connection.');
      } finally {
        onTranscribing(false);
      }
    },
    [accumulatedTranscript, inputLanguage, onTranscriptReady, onTranscribing]
  );

  const startRecording = useCallback(
    async (currentTranscript?: string) => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mimeType = getSupportedMimeType();
        mimeTypeRef.current = mimeType;

        const mr = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mr;
        chunksRef.current = [];

        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mr.start(250); // collect data every 250ms
        setIsRecording(true);
        setElapsedSeconds(0);
        if (currentTranscript !== undefined) {
          setAccumulatedTranscript(currentTranscript);
        }

        // Timer
        timerRef.current = setInterval(() => {
          setElapsedSeconds((s) => s + 1);
        }, 1000);

        // Auto-stop at 29s to stay within 30s API limit
        autoStopRef.current = setTimeout(() => {
          stopAndTranscribe(true);
        }, MAX_CLIP_SECONDS * 1000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setError('Microphone permission denied. Please allow microphone access and try again.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Could not start recording. Please check your microphone settings.');
        }
      }
    },
    [stopAndTranscribe]
  );

  const handleToggle = useCallback(() => {
    if (isRecording) {
      stopAndTranscribe(false);
    } else {
      startRecording(accumulatedTranscript);
    }
  }, [isRecording, stopAndTranscribe, startRecording, accumulatedTranscript]);

  const handleReset = useCallback(() => {
    setAccumulatedTranscript('');
    setClipCount(0);
    setElapsedSeconds(0);
    setError(null);
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      onTranscribing(true);
      setError(null);
      try {
        const form = new FormData();
        form.append('audio', file, file.name);
        form.append('language', inputLanguage);

        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Transcription failed');
          return;
        }

        const newTranscript = accumulatedTranscript
          ? `${accumulatedTranscript} ${data.transcript}`
          : data.transcript;

        setAccumulatedTranscript(newTranscript);
        onTranscriptReady(newTranscript, data.detectedLanguage);
      } catch {
        setError('Upload failed. Please try again.');
      } finally {
        onTranscribing(false);
      }
      // Reset input
      e.target.value = '';
    },
    [accumulatedTranscript, inputLanguage, onTranscriptReady, onTranscribing]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const remaining = MAX_CLIP_SECONDS - elapsedSeconds;
  const isNearLimit = elapsedSeconds >= MAX_CLIP_SECONDS - 10;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Record Button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="recording-ring absolute inset-0 rounded-full bg-red-500/30" />
            <span className="recording-ring-2 absolute inset-0 rounded-full bg-red-500/20" />
          </>
        )}
        <button
          onClick={handleToggle}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`
            relative z-10 w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/50
            ${isRecording
              ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-900/50'
              : 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600 shadow-orange-900/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isRecording ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.94V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-1.06A8 8 0 0 1 4 12a1 1 0 1 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z" />
            </svg>
          )}
        </button>
      </div>

      {/* Timer */}
      {isRecording && (
        <div className={`text-center animate-fade-in ${isNearLimit ? 'text-red-400' : 'text-gray-400'}`}>
          <div className="text-2xl font-mono font-bold">
            {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
            {String(elapsedSeconds % 60).padStart(2, '0')}
          </div>
          <div className="text-xs mt-1">
            {isNearLimit
              ? `Auto-saving in ${remaining}s and continuing…`
              : `Up to ${MAX_CLIP_SECONDS}s per clip — will auto-continue`}
          </div>
        </div>
      )}

      {/* Clip counter */}
      {clipCount > 0 && !isRecording && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {clipCount} clip{clipCount > 1 ? 's' : ''} recorded
          </span>
          <button onClick={handleReset} className="btn-ghost text-xs text-red-400 hover:text-red-300">
            Reset
          </button>
        </div>
      )}

      {/* Upload option */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">or</span>
        <label className="btn-ghost cursor-pointer text-xs flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload audio
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={disabled || isRecording}
            className="sr-only"
          />
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-sm bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
