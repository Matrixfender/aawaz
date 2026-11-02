import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatComplete } from '@/lib/sarvam';
import { buildNotesPrompt, buildLetterPrompt } from '@/lib/prompts';
import { parseJson } from '@/lib/parseJson';
import { DEMO_NOTES, DEMO_LETTER } from '@/lib/demoData';

import { getAuthenticatedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ProcessSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  mode: z.enum(['notes', 'letter']),
  letterType: z.string().optional(),
  outputLanguage: z.string().min(1, 'Output language is required'),
  tone: z.string().optional().default('formal'),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const isDemo =
    !process.env.SARVAM_API_KEY ||
    req.nextUrl.searchParams.get('demo') === '1';

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ProcessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    );
  }

  const { transcript, mode, letterType, outputLanguage, tone } = parsed.data;

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json({
      mode,
      result: mode === 'notes' ? DEMO_NOTES : DEMO_LETTER,
    });
  }

  try {
    let prompt: string;
    if (mode === 'notes') {
      prompt = buildNotesPrompt(transcript, outputLanguage);
    } else {
      prompt = buildLetterPrompt(
        transcript,
        letterType || 'other',
        outputLanguage,
        tone || 'formal'
      );
    }

    const rawContent = await chatComplete(
      'You are a helpful assistant. Always respond with valid JSON only.',
      prompt
    );

    let result: unknown;
    try {
      result = parseJson(rawContent);
    } catch {
      // Retry once: ask the model to fix the JSON
      const retryContent = await chatComplete(
        'You are a JSON repair assistant. Return only valid JSON, no explanation.',
        `Fix this invalid JSON and return only the corrected JSON:\n${rawContent}`
      );
      result = parseJson(retryContent);
    }

    return NextResponse.json({ mode, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error('[/api/process]', message);
    return NextResponse.json(
      { error: `Processing failed: ${message}` },
      { status: 500 }
    );
  }
}
