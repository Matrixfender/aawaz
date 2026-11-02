'use client';

import { useState } from 'react';

interface NotesResult {
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{ task: string; owner?: string | null; due?: string | null }>;
  openQuestions: string[];
}

interface ResultNotesProps {
  result: NotesResult;
}

export default function ResultNotes({ result }: ResultNotesProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Title */}
      <div className="card">
        <h3 className="text-xl font-bold text-white">{result.title}</h3>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="card">
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Summary</h4>
          <p className="text-gray-300 leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Key Points */}
      {result.keyPoints?.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Key Points</h4>
          <ul className="space-y-2">
            {result.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {result.actionItems?.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Action Items</h4>
          <ul className="space-y-3">
            {result.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(i)}
                  aria-label={checkedItems.has(i) ? 'Mark as pending' : 'Mark as done'}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                    ${checkedItems.has(i)
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-600 hover:border-orange-500'
                    }`}
                >
                  {checkedItems.has(i) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className={`flex-1 ${checkedItems.has(i) ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                  <span>{item.task}</span>
                  <div className="flex gap-3 mt-1">
                    {item.owner && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                        {item.owner}
                      </span>
                    )}
                    {item.due && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v6l4.5 2.7-.8 1.3-5.2-3V7h1.5z" />
                        </svg>
                        {item.due}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {result.decisions?.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Decisions</h4>
          <ul className="space-y-2">
            {result.decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-300">
                <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open Questions */}
      {result.openQuestions?.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Open Questions</h4>
          <ul className="space-y-2">
            {result.openQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-300">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
