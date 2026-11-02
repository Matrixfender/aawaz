'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Volume2,
  VolumeX,
  Languages,
  Copy,
  Check,
  Download,
  CheckCircle,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { OUTPUT_LANGUAGES } from '@/lib/languages';
import { toast } from 'sonner';

interface ResultToolbarProps {
  textToSpeak: string;
  sourceLang: string;
  onTranslated?: (translatedText: string) => void;
  documentId?: string;
  rawContent: string;
  title: string;
}

export function ResultToolbar({
  textToSpeak,
  sourceLang,
  onTranslated,
  documentId,
  rawContent,
  title,
}: ResultToolbarProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioLoading, setAudioLoading] = React.useState(false);
  const [audioBase64, setAudioBase64] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showTranslate, setShowTranslate] = React.useState(false);
  const [translateTarget, setTranslateTarget] = React.useState('hi-IN');
  const [translating, setTranslating] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Play audio when audioBase64 changes
  React.useEffect(() => {
    if (audioBase64) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.src = `data:audio/wav;base64,${audioBase64}`;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioBase64]);

  const handleSpeak = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioBase64 && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setAudioLoading(true);
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          languageCode: sourceLang === 'auto' ? 'en-IN' : sourceLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate speech');

      if (data.audioBase64) {
        setAudioBase64(data.audioBase64);
      }
    } catch (err: any) {
      toast.error(err.message || 'TTS playback failed');
    } finally {
      setAudioLoading(false);
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          sourceLang,
          targetLang: translateTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');

      if (data.translatedText && onTranslated) {
        onTranslated(data.translatedText);
        toast.success('Translated successfully');
        setShowTranslate(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'aawaz'}.${format}`;
    const blob = new Blob([rawContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as .${format}`);
  };

  return (
    <div className="space-y-3">
      {/* Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card/70 shadow-sm">
        {/* Saved Confirmation Link */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>Auto-saved to</span>
          <Link
            href="/dashboard"
            className="font-medium text-foreground underline hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Listen (TTS) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeak}
            disabled={audioLoading}
            className="text-xs"
            title="Read aloud with Sarvam Bulbul TTS"
          >
            {audioLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : isPlaying ? (
              <Pause className="h-3.5 w-3.5 mr-1.5 text-primary" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isPlaying ? 'Pause' : 'Listen'}
          </Button>

          {/* Translate */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranslate(!showTranslate)}
            className="text-xs"
            title="Translate result with Sarvam Translate"
          >
            <Languages className="h-3.5 w-3.5 mr-1.5" />
            Translate
          </Button>

          {/* Copy */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>

          {/* Download Text */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload('txt')}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Download .txt"
          >
            .txt
          </Button>

          {/* Download Markdown */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload('md')}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Download .md"
          >
            .md
          </Button>
        </div>
      </div>

      {/* Translation Popdown */}
      {showTranslate && (
        <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-sm space-y-2 animate-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Translate into Indian Language
            </span>
            <button
              onClick={() => setShowTranslate(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={translateTarget}
              onChange={(e) => setTranslateTarget(e.target.value)}
              className="h-8 text-xs"
            >
              {OUTPUT_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              onClick={handleTranslate}
              disabled={translating}
              className="h-8 text-xs shrink-0"
            >
              {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              {translating ? 'Translating...' : 'Apply'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
