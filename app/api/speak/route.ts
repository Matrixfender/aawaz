import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { textToSpeech, chunkTextForTTS } from '@/lib/sarvam';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SpeakSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  languageCode: z.string().min(1, 'Language code is required'),
});

// Demo audio: a short silent WAV (44-byte header, no data)
const DEMO_WAV_BASE64 =
  'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export async function POST(req: NextRequest) {
  const isDemo =
    !process.env.SARVAM_API_KEY ||
    req.nextUrl.searchParams.get('demo') === '1';

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SpeakSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    );
  }

  const { text, languageCode } = parsed.data;

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ audioBase64: DEMO_WAV_BASE64 });
  }

  try {
    // Split text into chunks (max 2400 chars each per TTS docs limit of 2500)
    const chunks = chunkTextForTTS(text, 2400);

    // Call TTS for each chunk in sequence
    const audioChunks: string[] = [];
    for (const chunk of chunks) {
      const base64 = await textToSpeech(chunk, languageCode);
      audioChunks.push(base64);
    }

    // Return all chunks; client concatenates/plays them sequentially
    return NextResponse.json({
      audioBase64: audioChunks.join(''),
      chunkCount: audioChunks.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS failed';
    console.error('[/api/speak]', message);
    return NextResponse.json(
      { error: `Text-to-speech failed: ${message}` },
      { status: 500 }
    );
  }
}
