'use client';

interface ModeToggleProps {
  mode: 'notes' | 'letter';
  onChange: (mode: 'notes' | 'letter') => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex bg-gray-800 rounded-xl p-1 border border-gray-700">
      <button
        onClick={() => onChange('notes')}
        className={`
          px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50
          ${mode === 'notes'
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        aria-pressed={mode === 'notes'}
      >
        📝 Aawaz Notes
      </button>
      <button
        onClick={() => onChange('letter')}
        className={`
          px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50
          ${mode === 'letter'
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        aria-pressed={mode === 'letter'}
      >
        ✉️ Bol Ke Likho
      </button>
    </div>
  );
}
