'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mic,
  Keyboard,
  Sparkles,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernRecorder } from '@/components/studio/ModernRecorder';
import { NotesView } from '@/components/studio/NotesView';
import { LetterView, LetterData } from '@/components/studio/LetterView';
import { ResultToolbar } from '@/components/studio/ResultToolbar';
import { INPUT_LANGUAGES, OUTPUT_LANGUAGES, LETTER_TYPES, TONES } from '@/lib/languages';
import { useAuth } from '@/lib/auth-context';
import { saveDocument } from '@/lib/documents';
import { toast } from 'sonner';

type Mode = 'notes' | 'letter';
type InputMethod = 'speak' | 'type';
type Step = 'idle' | 'transcribing' | 'writing' | 'done';

const LETTER_EXAMPLE_CHIPS = [
  {
    label: 'Security Deposit',
    text: 'My landlord has not returned my 20,000 deposit for 2 months after I moved out of the flat in Pune. Write a formal complaint demanding the refund within 7 days.',
  },
  {
    label: 'Sick Leave',
    text: 'I am suffering from high fever and doctor advised 3 days bed rest from tomorrow. Write a polite formal leave application to my team lead Rahul.',
  },
  {
    label: 'Broadband Complaint',
    text: 'My internet connection with account ID ACT-49201 has been down for the past 48 hours. I work from home and need urgent restoration or fee compensation.',
  },
];

const NOTES_EXAMPLE_CHIPS = [
  {
    label: 'Product Sprint',
    text: 'Aaj ki sprint meeting mein decide hua ki payment gateway integration Amit handle karega by Friday. Priyanka UI review karegi aur Priyesh testing karega next Tuesday tak.',
  },
  {
    label: 'Client Discussion',
    text: 'Client requested 20% discount on annual plan. We agreed on 15% if they commit for two years. Contract draft to be sent by Priya by tomorrow evening.',
  },
];

function StudioContent() {
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  // URL query pre-fills
  const initialMode = (searchParams.get('mode') as Mode) || 'notes';
  const initialInput = (searchParams.get('input') as InputMethod) || 'speak';

  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [inputMethod, setInputMethod] = React.useState<InputMethod>(initialInput);

  // Settings
  const [inputLanguage, setInputLanguage] = React.useState(
    profile?.default_input_language || 'auto'
  );
  const [outputLanguage, setOutputLanguage] = React.useState(
    profile?.default_output_language || 'en-IN'
  );
  const [letterType, setLetterType] = React.useState('complaint');
  const [tone, setTone] = React.useState(profile?.default_tone || 'formal');
  const [mobileOptionsOpen, setMobileOptionsOpen] = React.useState(false);

  // Working text
  const [text, setText] = React.useState('');
  const [step, setStep] = React.useState<Step>('idle');
  const [result, setResult] = React.useState<any>(null);
  const [savedDocId, setSavedDocId] = React.useState<string | undefined>(undefined);

  // Sync profile defaults when loaded
  React.useEffect(() => {
    if (profile) {
      if (profile.default_input_language) setInputLanguage(profile.default_input_language);
      if (profile.default_output_language) setOutputLanguage(profile.default_output_language);
      if (profile.default_tone) setTone(profile.default_tone);
    }
  }, [profile]);

  const handleVoiceTranscript = (newTranscript: string, detectedLang?: string) => {
    setText((prev) => (prev ? `${prev} ${newTranscript}` : newTranscript));
    if (detectedLang && inputLanguage === 'auto') {
      setInputLanguage(detectedLang);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please speak or type some text first');
      return;
    }

    setStep('writing');
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text.trim(),
          mode,
          letterType: mode === 'letter' ? letterType : undefined,
          outputLanguage,
          tone: mode === 'letter' ? tone : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      setResult(data.result);
      setStep('done');

      // Auto-save to database
      if (user) {
        const title =
          mode === 'notes'
            ? data.result?.title || 'Notes'
            : data.result?.subject || `${letterType.toUpperCase()} Letter`;

        try {
          const doc = await saveDocument(
            {
              type: mode,
              title,
              input_mode: inputMethod === 'speak' ? 'voice' : 'text',
              transcript: text,
              input_language: inputLanguage,
              output_language: outputLanguage,
              letter_type: mode === 'letter' ? letterType : undefined,
              tone: mode === 'letter' ? tone : undefined,
              result: data.result,
            },
            user.id
          );
          setSavedDocId(doc.id);
          toast.success('Generated and auto-saved to dashboard');
        } catch (saveErr) {
          console.error('Auto-save error:', saveErr);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
      setStep('idle');
    }
  };

  const exampleChips = mode === 'letter' ? LETTER_EXAMPLE_CHIPS : NOTES_EXAMPLE_CHIPS;

  // Raw content generator for download/copy
  const getRawContent = () => {
    if (!result) return '';
    if (mode === 'notes') {
      let lines = [`# ${result.title || 'Notes'}\n`];
      if (result.summary) lines.push(`## Summary\n${result.summary}\n`);
      if (result.keyPoints?.length) {
        lines.push('## Key Points');
        result.keyPoints.forEach((p: string) => lines.push(`- ${p}`));
        lines.push('');
      }
      if (result.decisions?.length) {
        lines.push('## Decisions');
        result.decisions.forEach((d: string) => lines.push(`- ${d}`));
        lines.push('');
      }
      if (result.actionItems?.length) {
        lines.push('## Action Items');
        result.actionItems.forEach((a: any) =>
          lines.push(`- [ ] ${a.task}${a.owner ? ` (@${a.owner})` : ''}${a.due ? ` due: ${a.due}` : ''}`)
        );
        lines.push('');
      }
      if (result.openQuestions?.length) {
        lines.push('## Questions');
        result.openQuestions.forEach((q: string) => lines.push(`- ${q}`));
      }
      return lines.join('\n');
    } else {
      return [
        `Subject: ${result.subject || ''}`,
        '',
        result.salutation || '',
        '',
        result.body || '',
        '',
        result.closing || '',
      ].join('\n');
    }
  };

  const getSpeakableText = () => {
    if (!result) return '';
    if (mode === 'notes') {
      return `${result.title || ''}. ${result.summary || ''}. Key points: ${(result.keyPoints || []).join('. ')}`;
    }
    return `${result.salutation || ''}. ${result.body || ''}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-border/60">
        <SegmentedControl
          value={mode}
          onChange={(newMode) => {
            setMode(newMode);
            setResult(null);
          }}
          options={[
            { value: 'notes', label: 'Aawaz Notes' },
            { value: 'letter', label: 'Bol Ke Likho' },
          ]}
        />

        {/* Input Method Switcher */}
        <SegmentedControl
          size="sm"
          value={inputMethod}
          onChange={setInputMethod}
          options={[
            { value: 'speak', label: 'Speak', icon: <Mic className="h-3.5 w-3.5" /> },
            { value: 'type', label: 'Type', icon: <Keyboard className="h-3.5 w-3.5" /> },
          ]}
        />
      </div>

      {/* Options Row (Desktop compact, mobile collapsible) */}
      <div className="bg-card/70 border border-border/70 rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Language & Output Options
          </span>
          <button
            type="button"
            onClick={() => setMobileOptionsOpen(!mobileOptionsOpen)}
            className="sm:hidden text-xs text-primary flex items-center gap-1 font-medium"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {mobileOptionsOpen ? 'Hide' : 'Options'}
          </button>
        </div>

        <div
          className={`grid gap-3 ${
            mobileOptionsOpen ? 'grid-cols-1' : 'hidden sm:grid'
          } ${mode === 'letter' ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}
        >
          <Select
            id="input-language"
            label="Input Language"
            value={inputLanguage}
            onChange={(e) => setInputLanguage(e.target.value)}
          >
            {INPUT_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.nativeName}
              </option>
            ))}
          </Select>

          <Select
            id="output-language"
            label="Output Language"
            value={outputLanguage}
            onChange={(e) => setOutputLanguage(e.target.value)}
          >
            {OUTPUT_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </Select>

          {mode === 'letter' && (
            <>
              <Select
                id="letter-type"
                label="Letter Type"
                value={letterType}
                onChange={(e) => setLetterType(e.target.value)}
              >
                {LETTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>

              <Select
                id="letter-tone"
                label="Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Input Workspace */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {inputMethod === 'speak' ? (
            <ModernRecorder
              onTranscriptReady={handleVoiceTranscript}
              onTranscribing={(loading) => setStep(loading ? 'transcribing' : 'idle')}
              inputLanguage={inputLanguage}
              disabled={step === 'transcribing' || step === 'writing'}
            />
          ) : null}

          {/* Textarea for typing or correcting voice transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {inputMethod === 'speak' ? 'Transcript (editable)' : 'Your description or notes'}
              </span>
              <div className="flex items-center gap-2">
                <span>{text.length} characters</span>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="hover:text-destructive transition-colors ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <Textarea
              rows={inputMethod === 'type' ? 6 : 4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'letter'
                  ? 'My landlord has not returned my 20,000 deposit for 2 months after I moved out. Write a formal complaint demanding the refund within 7 days.'
                  : 'Start speaking or type meeting notes, decisions and action points here in any Indian language or Hinglish...'
              }
              className="font-sans leading-relaxed text-sm bg-background/70"
            />

            {/* Example Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Examples:</span>
              {exampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(chip.text)}
                  className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {step === 'transcribing' && (
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Transcribing speech...
                </span>
              )}
              {step === 'writing' && (
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating {mode === 'notes' ? 'structured notes' : 'letter'}...
                </span>
              )}
              {step === 'idle' && (
                <span>Speak or type in any Indian language or Hinglish</span>
              )}
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!text.trim() || step === 'transcribing' || step === 'writing'}
              className="px-6"
            >
              {step === 'writing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Writing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate {mode === 'notes' ? 'Notes' : 'Letter'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Result Toolbar */}
          <ResultToolbar
            title={mode === 'notes' ? result.title || 'Notes' : result.subject || 'Letter'}
            textToSpeak={getSpeakableText()}
            sourceLang={outputLanguage}
            rawContent={getRawContent()}
            documentId={savedDocId}
            onTranslated={(translated) => {
              if (mode === 'letter') {
                setResult((prev: any) => ({ ...prev, body: translated }));
              } else {
                setResult((prev: any) => ({ ...prev, summary: translated }));
              }
            }}
          />

          {/* Content Rendering */}
          {mode === 'notes' ? (
            <NotesView notes={result} />
          ) : (
            <LetterView
              letter={result}
              onUpdate={(updated) => setResult(updated)}
            />
          )}

          {/* AI generated disclaimer */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            Letters and notes are AI-generated. Review before sending.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <React.Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12 text-center text-xs text-muted-foreground">Loading Studio...</div>}>
      <StudioContent />
    </React.Suspense>
  );
}

