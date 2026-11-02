'use client';

import { useEffect, useState } from 'react';
import { getHistory, deleteFromHistory, clearHistory, HistoryItem } from '@/lib/storage';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReopen: (item: HistoryItem) => void;
  refreshTrigger: number;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  onReopen,
  refreshTrigger,
}: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, [refreshTrigger, isOpen]);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(getHistory());
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 z-50
          transform transition-transform duration-300 ease-out overflow-y-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="History drawer"
        aria-hidden={!isOpen}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">History</h2>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button onClick={handleClear} className="btn-ghost text-xs text-red-400 hover:text-red-300">
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close history"
                className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Empty state */}
          {history.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">No history yet.</p>
              <p className="text-xs mt-1">Your last 10 results will appear here.</p>
            </div>
          )}

          {/* History items */}
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="card hover:border-gray-600 transition-colors cursor-pointer group"
              >
                <div onClick={() => { onReopen(item); onClose(); }} className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${item.mode === 'notes' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                      {item.mode === 'notes' ? '📝 Notes' : '✉️ Letter'}
                    </span>
                    {item.letterType && (
                      <span className="badge bg-gray-800 text-gray-400 capitalize">{item.letterType}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-1.5">
                    {item.transcript.slice(0, 100)}{item.transcript.length > 100 ? '…' : ''}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); onReopen(item); onClose(); }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Reopen →
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    aria-label="Delete this item"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
