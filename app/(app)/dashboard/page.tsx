'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Mic,
  Keyboard,
  FileText,
  Mail,
  Search,
  MoreVertical,
  ExternalLink,
  Copy,
  Download,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchDocuments, deleteDocument, DocumentItem } from '@/lib/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'all' | 'notes' | 'letter'>('all');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  // Time-aware greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = (
    profile?.display_name ||
    user?.fullName ||
    'there'
  ).split(' ')[0];

  const loadDocuments = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetchDocuments(user.id, {
        type: activeTab,
        search,
        page,
        limit: 20,
      });
      setDocuments(res.documents);
      setTotal(res.total);
    } catch (err: any) {
      toast.error('Could not load documents');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, search, page]);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Compute 4 Stat Cards from documents
  const stats = React.useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const notesCount = documents.filter((d) => d.type === 'notes').length;
    const lettersCount = documents.filter((d) => d.type === 'letter').length;
    const thisWeekCount = documents.filter(
      (d) => new Date(d.created_at) >= oneWeekAgo
    ).length;

    return {
      total,
      notes: notesCount,
      letters: lettersCount,
      thisWeek: thisWeekCount,
    };
  }, [documents, total]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    if (!user) return;

    const ok = await deleteDocument(id, user.id);
    if (ok) {
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } else {
      toast.error('Failed to delete document');
    }
  };

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getPreviewText = (doc: DocumentItem) => {
    if (doc.type === 'notes') {
      return (
        doc.result?.summary ||
        doc.result?.keyPoints?.[0] ||
        doc.transcript ||
        'Structured meeting notes'
      );
    }
    return (
      doc.result?.body?.slice(0, 140) ||
      doc.transcript?.slice(0, 140) ||
      'Formal letter draft'
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create voice notes or formal letters in any Indian language.
          </p>
        </div>
        <Link href="/studio">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Document
          </Button>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-border/70">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Items
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Notes
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.notes}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Letters
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.letters}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            This Week
          </p>
          <p className="text-2xl font-bold text-primary mt-1">
            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.thisWeek}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* New voice note card */}
        <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors group flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Mic className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              New voice note
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Capture meeting discussions, ideas or classes in Hindi, Marathi, or Hinglish.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <Link
              href="/studio?mode=notes&input=speak"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Start recording <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/studio?mode=notes&input=type"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Type instead
            </Link>
          </div>
        </div>

        {/* Write a letter card */}
        <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors group flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-foreground mb-3">
              <Mail className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Write a letter (Bol Ke Likho)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Describe a dispute, leave or complaint. Get a formal ready-to-send application.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <Link
              href="/studio?mode=letter&input=speak"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Speak letter <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/studio?mode=letter&input=type"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Type instead
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SegmentedControl
            size="sm"
            value={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Items' },
              { value: 'notes', label: 'Notes' },
              { value: 'letter', label: 'Letters' },
            ]}
          />

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search title or text..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No documents yet"
            description={
              search
                ? 'No documents matched your search query. Try another term.'
                : 'Start speaking or typing to generate your first structured note or formal letter.'
            }
            action={
              <Link href="/studio">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create now
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const isNotes = doc.type === 'notes';
              const preview = getPreviewText(doc);

              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/${doc.id}`)}
                  className="group relative p-4 rounded-xl border border-border/70 bg-card hover:border-border hover:shadow-sm cursor-pointer transition-all flex items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`h-9 w-9 rounded-lg shrink-0 flex items-center justify-center mt-0.5 sm:mt-0 ${
                        isNotes
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-secondary text-foreground border border-border/60'
                      }`}
                    >
                      {isNotes ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {doc.title}
                        </h4>
                        <Badge
                          variant={isNotes ? 'orange' : 'secondary'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {isNotes ? 'Notes' : 'Letter'}
                        </Badge>
                        <span className="text-muted-foreground text-xs flex items-center gap-1 font-mono">
                          {doc.input_mode === 'voice' ? (
                            <span title="Voice input"><Mic className="h-3 w-3" /></span>
                          ) : (
                            <span title="Typed input"><Keyboard className="h-3 w-3" /></span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {preview}
                      </p>
                    </div>
                  </div>

                  {/* Right meta and menu */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {formatRelativeTime(doc.created_at)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
