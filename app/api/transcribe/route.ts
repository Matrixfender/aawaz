import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { transcribeAudio } from '@/lib/sarvam';
import { DEMO_TRANSCRIPT, DEMO_LANGUAGE_CODE } from '@/lib/demoData';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const isDemo =
    !process.env.SARVAM_API_KEY ||
    req.nextUrl.searchParams.get('demo') === '1';

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return NextResponse.json({
      transcript: DEMO_TRANSCRIPT,
      detectedLanguage: DEMO_LANGUAGE_CODE,
    });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const languageCode = (formData.get('language') as string | null) || 'auto';

    // Validate
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided. Please record or upload audio first.' },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty. Please record something before submitting.' },
        { status: 400 }
      );
    }

    // Determine filename from blob type
    const mimeType = audioFile.type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const filename = `recording.${ext}`;

    const result = await transcribeAudio(
      audioFile,
      filename,
      languageCode === 'auto' ? undefined : languageCode
    );

    if (!result.transcript || result.transcript.trim() === '') {
      return NextResponse.json(
        { error: 'No speech detected in the audio. Please speak clearly and try again.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      transcript: result.transcript,
      detectedLanguage: result.language_code,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    const isRateLimit = message.includes('429');
    const isAuthError = message.includes('403') || message.includes('401');

    if (isAuthError) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your SARVAM_API_KEY.' },
        { status: 403 }
      );
    }
    if (isRateLimit) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    console.error('[/api/transcribe]', message);
    return NextResponse.json(
      { error: `Transcription failed: ${message}` },
      { status: 500 }
    );
  }
}
