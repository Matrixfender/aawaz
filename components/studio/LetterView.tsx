'use client';

import * as React from 'react';
import { Edit2, Check, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export interface LetterData {
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  placeholders?: string[];
}

export function LetterView({
  letter,
  onUpdate,
}: {
  letter: LetterData;
  onUpdate?: (updated: LetterData) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [subject, setSubject] = React.useState(letter.subject || '');
  const [salutation, setSalutation] = React.useState(letter.salutation || '');
  const [body, setBody] = React.useState(letter.body || '');
  const [closing, setClosing] = React.useState(letter.closing || '');

  React.useEffect(() => {
    setSubject(letter.subject || '');
    setSalutation(letter.salutation || '');
    setBody(letter.body || '');
    setClosing(letter.closing || '');
  }, [letter]);

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate({
        subject,
        salutation,
        body,
        closing,
        placeholders: letter.placeholders,
      });
    }
  };

  // Helper to highlight [placeholder] patterns
  const renderTextWithPlaceholders = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-medium mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Formal Letter
          </Badge>
          {letter.placeholders && letter.placeholders.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {letter.placeholders.length} placeholder{letter.placeholders.length > 1 ? 's' : ''} to review
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
          className="text-xs"
        >
          {isEditing ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              Done Editing
            </>
          ) : (
            <>
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit Letter
            </>
          )}
        </Button>
      </div>

      {/* Paper-like Preview Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm transition-all font-serif">
        {isEditing ? (
          <div className="space-y-4 font-sans">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-base font-semibold mt-1 p-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Salutation</label>
              <input
                type="text"
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                className="w-full text-sm mt-1 p-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Letter Body</label>
              <Textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 font-serif text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sign-off / Closing</label>
              <input
                type="text"
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
                className="w-full text-sm mt-1 p-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-foreground/90 leading-relaxed max-w-none">
            {/* Subject */}
            {subject && (
              <div className="border-b border-border/40 pb-4">
                <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 font-semibold">
                  Subject
                </p>
                <h3 className="text-lg font-bold font-serif text-foreground">
                  {renderTextWithPlaceholders(subject)}
                </h3>
              </div>
            )}

            {/* Salutation */}
            {salutation && (
              <p className="text-base font-serif">
                {renderTextWithPlaceholders(salutation)}
              </p>
            )}

            {/* Body */}
            {body && (
              <div className="space-y-4 text-base font-serif">
                {body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {renderTextWithPlaceholders(paragraph)}
                  </p>
                ))}
              </div>
            )}

            {/* Closing */}
            {closing && (
              <div className="pt-4 font-serif">
                <p className="whitespace-pre-line leading-relaxed">
                  {renderTextWithPlaceholders(closing)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
