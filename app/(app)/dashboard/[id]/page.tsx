'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Mic,
  Keyboard,
  Loader2,
  FileText,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDocumentById, deleteDocument, DocumentItem } from '@/lib/documents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NotesView } from '@/components/studio/NotesView';
import { LetterView } from '@/components/studio/LetterView';
import { ResultToolbar } from '@/components/studio/ResultToolbar';
import { toast } from 'sonner';

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [doc, setDoc] = React.useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDoc() {
      if (!user || !id) return;
      setIsLoading(true);
      try {
        const item = await getDocumentById(id, user.id);
        if (!item) {
          toast.error('Document not found');
          router.push('/dashboard');
          return;
        }
        setDoc(item);
      } catch (err: any) {
        toast.error('Could not load document');
      } finally {
        setIsLoading(false);
      }
    }
    loadDoc();
  }, [user, id, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document?')) return;
    if (!user || !doc) return;

    const ok = await deleteDocument(doc.id, user.id);
    if (ok) {
      toast.success('Document deleted');
      router.push('/dashboard');
    } else {
      toast.error('Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) return null;

  const isNotes = doc.type === 'notes';

  const getRawContent = () => {
    const res = doc.result;
    if (!res) return '';
    if (isNotes) {
      let lines = [`# ${res.title || doc.title}\n`];
      if (res.summary) lines.push(`## Summary\n${res.summary}\n`);
      if (res.keyPoints?.length) {
        lines.push('## Key Points');
        res.keyPoints.forEach((p: string) => lines.push(`- ${p}`));
        lines.push('');
      }
      if (res.decisions?.length) {
        lines.push('## Decisions');
        res.decisions.forEach((d: string) => lines.push(`- ${d}`));
        lines.push('');
      }
      if (res.actionItems?.length) {
        lines.push('## Action Items');
        res.actionItems.forEach((a: any) =>
          lines.push(`- [ ] ${a.task}${a.owner ? ` (@${a.owner})` : ''}${a.due ? ` due: ${a.due}` : ''}`)
        );
        lines.push('');
      }
      if (res.openQuestions?.length) {
        lines.push('## Questions');
        res.openQuestions.forEach((q: string) => lines.push(`- ${q}`));
      }
      return lines.join('\n');
    } else {
      return [
        `Subject: ${res.subject || ''}`,
        '',
        res.salutation || '',
        '',
        res.body || '',
        '',
        res.closing || '',
      ].join('\n');
    }
  };

  const getSpeakableText = () => {
    const res = doc.result;
    if (!res) return '';
    if (isNotes) {
      return `${res.title || ''}. ${res.summary || ''}. Key points: ${(res.keyPoints || []).join('. ')}`;
    }
    return `${res.salutation || ''}. ${res.body || ''}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>

      {/* Meta Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isNotes ? 'orange' : 'secondary'}>
            {isNotes ? 'Aawaz Notes' : 'Bol Ke Likho Letter'}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {doc.input_mode === 'voice' ? (
              <Mic className="h-3 w-3" />
            ) : (
              <Keyboard className="h-3 w-3" />
            )}
            {doc.input_mode === 'voice' ? 'Spoken' : 'Typed'}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {new Date(doc.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {doc.title}
        </h1>
      </div>

      {/* Action Toolbar */}
      <ResultToolbar
        title={doc.title}
        textToSpeak={getSpeakableText()}
        sourceLang={doc.output_language || 'en-IN'}
        rawContent={getRawContent()}
        documentId={doc.id}
        onTranslated={(translated) => {
          if (isNotes) {
            setDoc((prev: any) => ({
              ...prev,
              result: { ...prev.result, summary: translated },
            }));
          } else {
            setDoc((prev: any) => ({
              ...prev,
              result: { ...prev.result, body: translated },
            }));
          }
        }}
      />

      {/* Document View */}
      {isNotes ? (
        <NotesView notes={doc.result} />
      ) : (
        <LetterView letter={doc.result} />
      )}
    </div>
  );
}
