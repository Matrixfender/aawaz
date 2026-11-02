'use client';

import * as React from 'react';
import { CheckSquare, Square, FileText, CheckCircle2, HelpCircle, ListTodo } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActionItem {
  task: string;
  owner?: string | null;
  due?: string | null;
}

interface NotesData {
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
}

export function NotesView({ notes }: { notes: NotesData }) {
  const [completedTasks, setCompletedTasks] = React.useState<Set<number>>(new Set());

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {notes.title || 'Meeting / Voice Notes'}
        </h2>
      </div>

      {/* Summary */}
      {notes.summary && (
        <Card className="border-border/60">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {notes.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Points & Decisions in 2-column or stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Points */}
        {notes.keyPoints && notes.keyPoints.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Key Points
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ul className="space-y-2">
                {notes.keyPoints.map((point, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Decisions */}
        {notes.decisions && notes.decisions.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Decisions Made
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ul className="space-y-2">
                {notes.decisions.map((decision, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Items (Checkable) */}
      {notes.actionItems && notes.actionItems.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-primary" />
              Action Items ({completedTasks.size}/{notes.actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2">
              {notes.actionItems.map((item, idx) => {
                const done = completedTasks.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTask(idx)}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors select-none"
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
                      aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {done ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          done ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.task}
                      </p>
                      {(item.owner || item.due) && (
                        <div className="flex items-center gap-2 mt-1">
                          {item.owner && (
                            <Badge variant="secondary" className="text-[10px]">
                              @{item.owner}
                            </Badge>
                          )}
                          {item.due && (
                            <span className="text-[11px] text-muted-foreground">
                              Due: {item.due}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Questions */}
      {notes.openQuestions && notes.openQuestions.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              Open Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <ul className="space-y-2">
              {notes.openQuestions.map((question, i) => (
                <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">?</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
