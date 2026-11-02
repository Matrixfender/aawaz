'use client';

import * as React from 'react';
import { Mic, Square, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModernRecorderProps {
  onTranscriptReady: (text: string, detectedLang?: string) => void;
  onTranscribing: (loading: boolean) => void;
  inputLanguage: string;
  disabled?: boolean;
}

const MAX_CLIP_SECONDS = 30;

export function ModernRecorder({
  onTranscriptReady,
  onTranscribing,
  inputLanguage,
  disabled,
}: ModernRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [audioLevel, setAudioLevel] = React.useState(0);
  const [clipCount, setClipCount] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Monitor audio levels for subtle visualizer
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch {
      // AudioContext not supported
    }
  };

  const cleanupAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const uploadAndTranscribe = async (blob: Blob) => {
    onTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', inputLanguage);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe');
      }

      if (data.transcript) {
        onTranscriptReady(data.transcript, data.detectedLanguage);
        toast.success('Speech transcribed successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not transcribe speech');
    } finally {
      onTranscribing(false);
    }
  };

  const stopRecording = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    cleanupAudioMeter();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = async () => {
    chunksRef.current = [];
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) {
          await uploadAndTranscribe(blob);
          setClipCount((c) => c + 1);
        }
      };

      recorder.start(500); // 500ms timeslices
      setIsRecording(true);
      setupAudioMeter(stream);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_CLIP_SECONDS - 1) {
            stopRecording();
            toast.info('Reached 30s limit for this clip. Processing...');
            return MAX_CLIP_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else {
        toast.error('Could not access microphone: ' + err.message);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Audio file must be under 25MB');
      return;
    }

    await uploadAndTranscribe(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const progressPercent = (seconds / MAX_CLIP_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Calm Circular Button with Subtle Ring Pulse */}
      <div className="relative flex items-center justify-center">
        {/* Subtle pulsating outer ring while recording */}
        {isRecording && (
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 pointer-events-none"
            style={{ animationDuration: '2s' }}
          />
        )}

        {/* Progress SVG Border */}
        {isRecording && (
          <svg className="absolute -inset-2 h-24 w-24 -rotate-90 pointer-events-none">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-primary/20"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progressPercent) / 100}
              strokeLinecap="round"
              className="text-primary transition-all duration-300"
            />
          </svg>
        )}

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center transition-all select-none shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            isRecording
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-95'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95'
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
            <Square className="h-7 w-7 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>

      {/* Timer & Level Indicators */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        {isRecording ? (
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span>
              00:{seconds < 10 ? `0${seconds}` : seconds} / 00:30
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-medium">
            Tap to speak in any Indian language
          </p>
        )}

        {/* Audio Level waveform bars */}
        {isRecording && (
          <div className="flex items-center gap-0.5 h-4 mt-1">
            {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.3].map((multiplier, idx) => {
              const height = Math.max(
                3,
                Math.round(((audioLevel * multiplier) / 100) * 16)
              );
              return (
                <div
                  key={idx}
                  className="w-1 rounded-full bg-primary transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Option */}
      <div className="mt-4 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRecording}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload audio file
        </Button>
      </div>
    </div>
  );
}
