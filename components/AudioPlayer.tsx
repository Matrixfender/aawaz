'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  audioBase64: string;
  isLoading?: boolean;
}

export default function AudioPlayer({ audioBase64, isLoading }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioBase64) return;
    const url = `data:audio/wav;base64,${audioBase64}`;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      setProgress(audio.currentTime / (audio.duration || 1));
    };
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioBase64]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse" />
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full shimmer" />
        <span className="text-xs text-gray-500">Speaking...</span>
      </div>
    );
  }

  if (!audioBase64) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center flex-shrink-0 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <span className="text-xs text-gray-400 font-mono flex-shrink-0">
        {duration ? formatTime(duration * progress) : '0:00'} / {duration ? formatTime(duration) : '—'}
      </span>
    </div>
  );
}
