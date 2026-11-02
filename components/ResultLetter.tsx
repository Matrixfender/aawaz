'use client';

interface LetterResult {
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  placeholders: string[];
}

interface ResultLetterProps {
  result: LetterResult;
}

function highlightPlaceholders(text: string) {
  // Replace [placeholder] patterns with highlighted spans
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={i} className="placeholder-highlight">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatBody(body: string) {
  return body.split('\n').map((line, i) => (
    <p key={i} className={line === '' ? 'mt-4' : 'mb-2'}>
      {highlightPlaceholders(line)}
    </p>
  ));
}

export default function ResultLetter({ result }: ResultLetterProps) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Placeholders notice */}
      {result.placeholders?.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl px-4 py-3">
          <p className="text-sm text-orange-300">
            <span className="font-semibold">Fill in these placeholders before sending: </span>
            {result.placeholders.join(', ')}
          </p>
        </div>
      )}

      {/* Letter preview */}
      <div className="card font-serif">
        {/* Subject */}
        {result.subject && (
          <div className="mb-6 pb-4 border-b border-gray-700/50">
            <span className="text-xs font-sans font-semibold text-orange-400 uppercase tracking-wider">Subject: </span>
            <span className="text-white font-semibold">{result.subject}</span>
          </div>
        )}

        {/* Date placeholder */}
        <div className="text-right text-gray-400 text-sm mb-6">
          {highlightPlaceholders('[Date]')}
        </div>

        {/* Salutation */}
        {result.salutation && (
          <div className="text-gray-200 mb-4">
            {highlightPlaceholders(result.salutation)}
          </div>
        )}

        {/* Body */}
        <div className="text-gray-300 leading-relaxed mb-6">
          {formatBody(result.body)}
        </div>

        {/* Closing */}
        {result.closing && (
          <div className="text-gray-200 mt-6 whitespace-pre-line">
            {highlightPlaceholders(result.closing)}
          </div>
        )}
      </div>
    </div>
  );
}
