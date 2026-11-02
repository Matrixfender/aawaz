/**
 * Sarvam API fetch wrappers - server-side only
 * All calls use the api-subscription-key header
 */

const SARVAM_BASE = 'https://api.sarvam.ai';

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error('SARVAM_API_KEY is not set');
  return key;
}

// ── Speech-to-Text (Saaras) ──────────────────────────────────────────────────
// Endpoint: POST /speech-to-text (multipart/form-data)
// Max duration: 30 seconds per request
// Returns: { transcript, language_code, request_id }
export async function transcribeAudio(
  audioBlob: Blob,
  filename: string,
  languageCode?: string // BCP-47 or omit for auto
): Promise<{ transcript: string; language_code: string }> {
  const model = process.env.SARVAM_STT_MODEL || 'saaras:v4';
  const form = new FormData();
  form.append('file', audioBlob, filename);
  form.append('model', model);
  form.append('mode', 'transcribe');
  if (languageCode && languageCode !== '' && languageCode !== 'auto') {
    form.append('language_code', languageCode);
  }

  const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': getApiKey() },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STT error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    transcript: data.transcript || '',
    language_code: data.language_code || 'en-IN',
  };
}

// ── Chat Completions (Sarvam LLM) ────────────────────────────────────────────
// Endpoint: POST /v1/chat/completions
// Returns OpenAI-compatible response
export async function chatComplete(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const model = process.env.SARVAM_LLM_MODEL || 'sarvam-105b-conversations';

  const res = await fetch(`${SARVAM_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      reasoning_effort: null, // disable think mode for deterministic JSON output
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Text-to-Speech (Bulbul) ──────────────────────────────────────────────────
// Endpoint: POST /text-to-speech
// Max: 2500 chars per request
// Returns: { audios: string[] } where each element is base64-encoded WAV
export async function textToSpeech(
  text: string,
  languageCode: string
): Promise<string> {
  const model = process.env.SARVAM_TTS_MODEL || 'bulbul:v4-flash';
  const speaker = process.env.SARVAM_TTS_SPEAKER || 'meera';

  const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      language_code: languageCode,
      model,
      speaker,
      speech_sample_rate: 22050,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS error ${res.status}: ${err}`);
  }

  const data = await res.json();
  // audios is an array of base64 strings; join and return combined
  const audios: string[] = data.audios || [];
  if (audios.length === 0) throw new Error('TTS returned no audio');
  return audios.join('');
}

// ── Translation (Sarvam Translate) ───────────────────────────────────────────
// Endpoint: POST /translate
// Max: 2000 chars per request (sarvam-translate:v1)
export async function translateText(
  input: string,
  sourceLangCode: string,
  targetLangCode: string
): Promise<string> {
  const model = process.env.SARVAM_TRANSLATE_MODEL || 'sarvam-translate:v1';

  const res = await fetch(`${SARVAM_BASE}/translate`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input,
      source_language_code: sourceLangCode === 'auto' ? 'auto' : sourceLangCode,
      target_language_code: targetLangCode,
      model,
      mode: 'formal',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Translate error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.translated_text || data.translatedText || input;
}

// ── Chunk text for TTS ───────────────────────────────────────────────────────
// TTS limit: 2500 chars per request; split at sentence boundaries
export function chunkTextForTTS(text: string, maxChars = 2400): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Split on sentence-ending punctuation followed by space or end
  const sentences = text.split(/(?<=[।.!?;])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 <= maxChars) {
      current = current ? `${current} ${sentence}` : sentence;
    } else {
      if (current) chunks.push(current);
      // If a single sentence exceeds limit, split it on commas
      if (sentence.length > maxChars) {
        const parts = sentence.split(/(?<=[,])\s+/);
        let subCurrent = '';
        for (const part of parts) {
          if (subCurrent.length + part.length + 1 <= maxChars) {
            subCurrent = subCurrent ? `${subCurrent} ${part}` : part;
          } else {
            if (subCurrent) chunks.push(subCurrent);
            subCurrent = part;
          }
        }
        if (subCurrent) current = subCurrent;
        else current = '';
      } else {
        current = sentence;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
