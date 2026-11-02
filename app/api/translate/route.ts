import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { translateText } from '@/lib/sarvam';
import { DEMO_TRANSLATED } from '@/lib/demoData';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TranslateSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sourceLang: z.string().min(1, 'Source language is required'),
  targetLang: z.string().min(1, 'Target language is required'),
});

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

  const parsed = TranslateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    );
  }

  const { text, sourceLang, targetLang } = parsed.data;

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ translatedText: DEMO_TRANSLATED });
  }

  try {
    // sarvam-translate:v1 supports 2000 chars; chunk if needed
    const MAX_CHARS = 1900;
    if (text.length <= MAX_CHARS) {
      const translatedText = await translateText(text, sourceLang, targetLang);
      return NextResponse.json({ translatedText });
    }

    // Split into chunks for long text
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHARS) {
        chunks.push(remaining);
        break;
      }
      // Find a good split point
      let splitIdx = remaining.lastIndexOf('. ', MAX_CHARS);
      if (splitIdx === -1) splitIdx = remaining.lastIndexOf(' ', MAX_CHARS);
      if (splitIdx === -1) splitIdx = MAX_CHARS;
      chunks.push(remaining.slice(0, splitIdx + 1));
      remaining = remaining.slice(splitIdx + 1);
    }

    const translated = await Promise.all(
      chunks.map((chunk) => translateText(chunk, sourceLang, targetLang))
    );

    return NextResponse.json({ translatedText: translated.join(' ') });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    console.error('[/api/translate]', message);
    return NextResponse.json(
      { error: `Translation failed: ${message}` },
      { status: 500 }
    );
  }
}
