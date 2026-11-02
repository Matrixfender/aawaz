'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Recorder from '@/components/Recorder';
import ModeToggle from '@/components/ModeToggle';
import ResultNotes from '@/components/ResultNotes';
import ResultLetter from '@/components/ResultLetter';
import AudioPlayer from '@/components/AudioPlayer';
import HistoryDrawer from '@/components/HistoryDrawer';
import { INPUT_LANGUAGES, OUTPUT_LANGUAGES, LETTER_TYPES, TONES } from '@/lib/languages';
import { saveToHistory, HistoryItem } from '@/lib/storage';

// ── Types ───────────────────────────────────────────────────────────────────
type Mode = 'notes' | 'letter';
type Step = 'idle' | 'transcribing' | 'writing' | 'speaking' | 'translating';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

// ── Toast Component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-xs w-full" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            toast-enter flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm
            ${t.type === 'error' ? 'bg-red-900/90 border-red-700/50 text-red-200' : ''}
            ${t.type === 'success' ? 'bg-green-900/90 border-green-700/50 text-green-200' : ''}
            ${t.type === 'info' ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}
          `}
          role="alert"
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-current opacity-60 hover:opacity-100 ml-2 flex-shrink-0">✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Select Wrapper ───────────────────────────────────────────────────────────
function SelectField({ value, onChange, children, label, id }: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; label: string; id: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select-field w-full pr-8"
        >
          {children}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ── Result text helpers ──────────────────────────────────────────────────────
function resultToText(mode: Mode, result: unknown): string {
  if (!result) return '';
  if (mode === 'notes') {
    const n = result as Record<string, unknown>;
    const lines: string[] = [];
    if (n.title) lines.push(`# ${n.title}\n`);
    if (n.summary) lines.push(`## Summary\n${n.summary}\n`);
    if (Array.isArray(n.keyPoints) && n.keyPoints.length) {
      lines.push(`## Key Points`);
      n.keyPoints.forEach((p: unknown) => lines.push(`- ${p}`));
      lines.push('');
    }
    if (Array.isArray(n.decisions) && n.decisions.length) {
      lines.push(`## Decisions`);
      n.decisions.forEach((d: unknown) => lines.push(`- ${d}`));
      lines.push('');
    }
    if (Array.isArray(n.actionItems) && n.actionItems.length) {
      lines.push(`## Action Items`);
      (n.actionItems as Array<{task:string;owner?:string|null;due?:string|null}>).forEach((a) => {
        lines.push(`- [ ] ${a.task}${a.owner ? ` (@${a.owner})` : ''}${a.due ? ` — due: ${a.due}` : ''}`);
      });
      lines.push('');
    }
    if (Array.isArray(n.openQuestions) && n.openQuestions.length) {
      lines.push(`## Open Questions`);
      n.openQuestions.forEach((q: unknown) => lines.push(`- ${q}`));
    }
    return lines.join('\n');
  } else {
    const l = result as Record<string, unknown>;
    return [
      l.subject ? `Subject: ${l.subject}` : '',
      '',
      String(l.salutation || ''),
      '',
      String(l.body || '').replace(/\\n/g, '\n'),
      '',
      String(l.closing || '').replace(/\\n/g, '\n'),
    ].join('\n');
  }
}

function resultToSpeakText(mode: Mode, result: unknown): string {
  if (!result) return '';
  if (mode === 'notes') {
    const n = result as Record<string, unknown>;
    const parts: string[] = [];
    if (n.summary) parts.push(String(n.summary));
    if (Array.isArray(n.keyPoints)) parts.push('Key points: ' + (n.keyPoints as string[]).join('. '));
    if (Array.isArray(n.actionItems)) {
      const items = (n.actionItems as Array<{task:string}>).map(a => a.task);
      if (items.length) parts.push('Action items: ' + items.join('. '));
    }
    return parts.join('. ');
  } else {
    const l = result as Record<string, string>;
    return `${l.salutation || ''}. ${(l.body || '').replace(/\\n/g, ' ')}`;
  }
}

// ── Main Page ────────────────────────────────────────────────────────────────
function AawazApp() {
  const searchParams = useSearchParams();
  
  // Mode & language state
  const [mode, setMode] = useState<Mode>('notes');
  const [inputLanguage, setInputLanguage] = useState('auto');
  const [outputLanguage, setOutputLanguage] = useState('en-IN');
  const [letterType, setLetterType] = useState('complaint');
  const [tone, setTone] = useState('formal');

  // Pipeline state
  const [step, setStep] = useState<Step>('idle');
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [audioBase64, setAudioBase64] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translateTarget, setTranslateTarget] = useState('hi-IN');
  const [showTranslatePanel, setShowTranslatePanel] = useState(false);

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [copied, setCopied] = useState(false);

  const isDemoMode = !process.env.NEXT_PUBLIC_HAS_KEY || searchParams.get('demo') === '1';

  // Toast helpers
  const toast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = toastCounter + 1;
    setToastCounter(id);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, [toastCounter]);

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Step 1: Transcript ready from Recorder
  const handleTranscriptReady = useCallback((t: string, lang: string) => {
    setTranscript(t);
    setDetectedLanguage(lang);
    setResult(null);
    setAudioBase64('');
    setTranslatedText('');
  }, []);

  // Step 2: Generate
  const handleGenerate = useCallback(async () => {
    if (!transcript.trim()) {
      toast('Please record or type some text first.', 'error');
      return;
    }
    setStep('writing');
    setResult(null);
    setAudioBase64('');
    setTranslatedText('');

    try {
      const suffix = isDemoMode ? '?demo=1' : '';
      const res = await fetch(`/api/process${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          mode,
          letterType: mode === 'letter' ? letterType : undefined,
          outputLanguage,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      setResult(data.result);

      // Save to history
      saveToHistory({
        mode,
        transcript,
        result: data.result,
        outputLanguage,
        letterType: mode === 'letter' ? letterType : undefined,
      });
      setHistoryRefresh((n) => n + 1);
      toast('Done! Your content is ready.', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Processing failed', 'error');
    } finally {
      setStep('idle');
    }
  }, [transcript, mode, letterType, outputLanguage, tone, isDemoMode, toast]);

  // Step 3: Listen (TTS)
  const handleListen = useCallback(async () => {
    if (!result) return;
    const speakText = resultToSpeakText(mode, result);
    if (!speakText.trim()) return;

    setAudioLoading(true);
    setStep('speaking');
    try {
      const suffix = isDemoMode ? '?demo=1' : '';
      const ttsLang = OUTPUT_LANGUAGES.find(l => l.code === outputLanguage)?.ttsCode || outputLanguage;
      const res = await fetch(`/api/speak${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakText, languageCode: ttsLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS failed');
      setAudioBase64(data.audioBase64);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Text-to-speech failed', 'error');
    } finally {
      setAudioLoading(false);
      setStep('idle');
    }
  }, [result, mode, outputLanguage, isDemoMode, toast]);

  // Translate
  const handleTranslate = useCallback(async () => {
    if (!result) return;
    const text = resultToText(mode, result);
    setStep('translating');
    try {
      const suffix = isDemoMode ? '?demo=1' : '';
      const res = await fetch(`/api/translate${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: outputLanguage,
          targetLang: translateTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      setTranslatedText(data.translatedText);
      toast('Translation ready!', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Translation failed', 'error');
    } finally {
      setStep('idle');
    }
  }, [result, mode, outputLanguage, translateTarget, isDemoMode, toast]);

  // Copy
  const handleCopy = useCallback(() => {
    const text = translatedText || resultToText(mode, result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast('Copied to clipboard!', 'success');
    });
  }, [result, mode, translatedText, toast]);

  // Download
  const handleDownload = useCallback((ext: 'txt' | 'md') => {
    const text = translatedText || resultToText(mode, result);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aawaz-${mode}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, mode, translatedText]);

  // Reopen history item
  const handleReopen = useCallback((item: HistoryItem) => {
    setMode(item.mode);
    setTranscript(item.transcript);
    setOutputLanguage(item.outputLanguage);
    if (item.letterType) setLetterType(item.letterType);
    setResult(item.result);
    setAudioBase64('');
    setTranslatedText('');
  }, []);

  const isLoading = step !== 'idle';
  const stepLabel = {
    idle: '',
    transcribing: 'Transcribing…',
    writing: 'Writing…',
    speaking: 'Speaking…',
    translating: 'Translating…',
  }[step];

  return (
    <div className="min-h-screen bg-gray-950">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onReopen={handleReopen}
        refreshTrigger={historyRefresh}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black gradient-text tracking-tight">Aawaz</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Bolo. Hum likh denge.</p>
          </div>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="badge bg-yellow-900/50 text-yellow-400 border border-yellow-700/30">
                Demo Mode
              </span>
            )}
            <button
              onClick={() => setHistoryOpen(true)}
              aria-label="Open history"
              className="btn-ghost flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setResult(null); setAudioBase64(''); }} />
        </div>

        {/* Language + Mode Settings */}
        <div className={`card grid gap-4 ${mode === 'letter' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <SelectField id="input-lang" label="Input Language" value={inputLanguage} onChange={setInputLanguage}>
            {INPUT_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name} — {l.nativeName}</option>
            ))}
          </SelectField>
          <SelectField id="output-lang" label="Output Language" value={outputLanguage} onChange={setOutputLanguage}>
            {OUTPUT_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </SelectField>
          {mode === 'letter' && (
            <>
              <SelectField id="letter-type" label="Letter Type" value={letterType} onChange={setLetterType}>
                {LETTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </SelectField>
              <SelectField id="tone" label="Tone" value={tone} onChange={setTone}>
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </SelectField>
            </>
          )}
        </div>

        {/* Recorder */}
        <div className="card">
          <Recorder
            onTranscriptReady={handleTranscriptReady}
            onTranscribing={(loading) => setStep(loading ? 'transcribing' : 'idle')}
            inputLanguage={inputLanguage}
            disabled={step === 'transcribing'}
          />

          {/* Transcript Box */}
          {(transcript || step === 'transcribing') && (
            <div className="mt-6 space-y-3 animate-slide-up">
              {step === 'transcribing' && (
                <div className="flex items-center gap-2 text-orange-400 text-sm">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Transcribing…
                </div>
              )}
              {transcript && (
                <>
                  <div className="flex items-center justify-between">
                    <label htmlFor="transcript-box" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Transcript
                      {detectedLanguage && (
                        <span className="ml-2 normal-case badge bg-gray-800 text-gray-400">
                          {INPUT_LANGUAGES.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
                        </span>
                      )}
                    </label>
                    <button
                      onClick={() => { setTranscript(''); setResult(null); setAudioBase64(''); }}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <textarea
                    id="transcript-box"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={4}
                    className="input-field resize-y text-sm"
                    placeholder="Transcript will appear here. You can edit it before generating."
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        {transcript && (
          <div className="flex justify-center animate-fade-in">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="btn-primary px-8 py-3 text-base flex items-center gap-2"
            >
              {step === 'writing' ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Writing…
                </>
              ) : (
                <>
                  {mode === 'notes' ? '📝' : '✉️'}
                  {mode === 'notes' ? 'Generate Notes' : 'Write Letter'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Global loading indicator */}
        {isLoading && step !== 'writing' && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 animate-fade-in">
            <svg className="w-4 h-4 animate-spin text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {stepLabel}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-slide-up">
            {/* Disclaimer */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl px-4 py-2.5 text-xs text-blue-300">
              ℹ️ Letters and notes are AI-generated. Review before sending.
            </div>

            {mode === 'notes' ? (
              <ResultNotes result={result as Parameters<typeof ResultNotes>[0]['result']} />
            ) : (
              <ResultLetter result={result as Parameters<typeof ResultLetter>[0]['result']} />
            )}

            {/* Audio Player */}
            {(audioBase64 || audioLoading) && (
              <AudioPlayer audioBase64={audioBase64} isLoading={audioLoading} />
            )}

            {/* Translate panel */}
            {showTranslatePanel && (
              <div className="card space-y-3 animate-slide-up">
                <h4 className="text-sm font-semibold text-gray-300">Translate result to:</h4>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={translateTarget}
                      onChange={(e) => setTranslateTarget(e.target.value)}
                      className="select-field w-full pr-8"
                    >
                      {OUTPUT_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={step === 'translating'}
                    className="btn-secondary px-4 flex-shrink-0"
                  >
                    {step === 'translating' ? 'Translating…' : 'Translate'}
                  </button>
                </div>
                {translatedText && (
                  <div className="bg-gray-800/50 rounded-xl p-4 text-gray-300 text-sm whitespace-pre-wrap border border-gray-700/50">
                    {translatedText}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleListen}
                disabled={isLoading}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                🔊 {audioBase64 ? 'Replay' : 'Listen'}
              </button>
              <button
                onClick={() => setShowTranslatePanel(!showTranslatePanel)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                🌐 Translate
              </button>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button
                onClick={() => handleDownload('txt')}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                ⬇ .txt
              </button>
              <button
                onClick={() => handleDownload('md')}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                ⬇ .md
              </button>
            </div>
          </div>
        )}

        {/* Empty state when no transcript yet */}
        {!transcript && step === 'idle' && (
          <div className="text-center py-10 text-gray-600">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="text-lg font-medium text-gray-500">Hit the mic to begin</p>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'notes'
                ? 'Speak your meeting, class, or thoughts — get structured notes instantly.'
                : 'Describe your situation in any language — get a formal letter ready to send.'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-gray-600 border-t border-gray-800/50 mt-8">
        Powered by{' '}
        <a href="https://sarvam.ai" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
          Sarvam AI
        </a>{' '}
        · Saaras STT · Bulbul TTS · Sarvam LLM · Translate
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading Aawaz...</div>}>
      <AawazApp />
    </Suspense>
  );
}

